#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import { loadConfig, configure } from "./config.js";
import ChatGPTClient from "./chatgptClient.js";
import OllamaClient from "./ollamaClient.js";
import JSONScript from "jsonscriptlib";
import logger from "./logger.js";
import gradient from "gradient-string";
import getStdin from "get-stdin";

const raw_logo = [
  " ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗  █████╗ ██╗",
  "██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔══██╗██║",
  "██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║███████║██║",
  "██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║██╔══██║██║",
  "╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝██║  ██║██║",
  " ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝",
];

const logo = gradient.atlas.multiline(raw_logo.join("\n"));

async function getCommandInput(defaultValue = "") {
  const { command } = await inquirer.prompt([
    {
      type: "input",
      name: "command",
      message: "Please provide a command:",
      default: defaultValue,
      validate: (input) => (input ? true : "Command cannot be empty"),
    },
  ]);
  return command;
}

async function executeScript(script) {
  const result = await script.execute();

  if (result.error) {
    console.error("Execution Error:", result.error);
    logger.error({ error: result.error }, "Execution Error");
  } else {
    result.results.forEach((res) => {
      if (res.type === "cmd") {
        console.log(res.result);
        logger.info({ cmdResult: res.result }, "Command Result");
      } else if (res.type === "file") {
        console.log(`File ${res.result}`);
        logger.info({ fileResult: res.result }, "File Result");
      }
    });
  }
}

async function main() {
  let command = process.argv.slice(2).join(" ");

  if (!command) {
    const stdinInput = await getStdin();
    if (stdinInput.trim()) {
      command = stdinInput.trim();
    } else {
      command = await getCommandInput();
    }
  }

  let config = loadConfig();
  if (!config) {
    console.log();
    console.log(logo);
    console.log();

    console.log(gradient.cristal("No configuration found."));
    console.log();
    config = await configure();
  }

  while (true) {
    const spinner = ora(gradient.cristal("Thinking...")).start();

    try {
      let jsonScript;
      if (config.aiService === "Ollama") {
        const client = new OllamaClient(config.ollamaUrl, config.ollamaModel);
        jsonScript = await client.generateScript(command);
      } else if (config.aiService === "ChatGPT") {
        const client = new ChatGPTClient(
          config.chatgptApiKey,
          config.chatgptModel
        );
        jsonScript = await client.generateScript(command);
      } else {
        throw new Error("Invalid AI service configuration.");
      }

      spinner.succeed(gradient.cristal("Ready."));
      console.log();

      logger.info({ command }, "Command logged");
      logger.info(
        { jsonScript: JSON.parse(jsonScript) },
        "JSON Response logged"
      );

      const script = new JSONScript(JSON.parse(jsonScript));

      if (config.showExecutionDescription) {
        console.log(gradient.cristal("Execution Description:"));
        console.log(
          script.executionDescription
            .map((line) => gradient.teen(line.trim()))
            .join("\n")
        );
        console.log();
      }

      if (config.showExecutionPlan) {
        console.log(gradient.cristal("Execution Plan:"));
        script.executionPlan.forEach((line) => {
          line = line.trim(); // Strip the line before processing
          if (line.startsWith("Create file:")) {
            const coloredLine = line.replace(/^(Create file:)/, "");
            console.log(
              gradient.passion("Create file:") + gradient.teen(coloredLine)
            );
          } else {
            console.log(gradient.teen(line));
          }
        });
        console.log();
      }

      if (config.showExecutionDescription || config.showExecutionPlan) {
        const { proceedOption } = await inquirer.prompt([
          {
            type: "list",
            name: "proceedOption",
            message: "Do you want to proceed with the execution?",
            choices: [
              { name: "Yes", value: "yes" },
              { name: "No", value: "no" },
              { name: "New Solution", value: "newSolution" },
            ],
          },
        ]);

        if (proceedOption === "yes") {
          console.log();
          await executeScript(script);
          break;
        } else if (proceedOption === "no") {
          logger.info("Execution aborted by user.");
          break;
        } 
      } else {
        await executeScript(script);
        break;
      }
    } catch (error) {
      spinner.fail(gradient.morning("Bad Thoughts. Re-thinking."));
      logger.error({ error }, "An error occurred during processing");
    }
  }
}

main();
