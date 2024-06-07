#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import getStdin from "get-stdin";
import { readFileSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import JSONScript from "jsonscriptlib";

import { loadConfig, configure } from "./util/config.js";
import ChatGPTClient from "./aiClient/adapters/chatgptAdapter.js";
import OllamaClient from "./aiClient/adapters/ollamaAdapter.js";
import logger from "./util/logger.js";

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
      message: "What would you like me to do??:",
      default: defaultValue,
      validate: (input) => (input ? true : "?????????????!!!????????"),
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

async function main(continuePrompt = true) {
  let command = process.argv.slice(2).join(" ");

  if (!command) {
    const stdinInput = await getStdin();
    if (stdinInput.trim()) {
      command = stdinInput.trim();
    } else {
      command = await getCommandInput();
    }
  }

  if (command.toLowerCase() === "version" || command.toLowerCase() === "-v") {
    const packageJsonPath = join(__dirname, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    console.log(`Version: ${packageJson.version}`);
    return;
  }

  let config = loadConfig();
  if (!config) {
    console.log();
    console.log(logo);
    console.log();

    console.log(gradient.cristal("No configuration found."));
    console.log();
    config = await configure();
  } else {
    if (
      command.toUpperCase() === "CONFIG" ||
      command.toUpperCase() === "CONFIGURE"
    ) {
      config = await configure(config);
      command = await getCommandInput();
    }
  }

  if (command.toUpperCase() === "UPGRADE") {
    exec("npm update -g command-ai", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
      } else if (stderr) {
        console.error(`stderr: ${stderr}`);
      } else {
        console.log(stdout);
      }
      process.exit();
    });
    return;
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    const spinner = ora(gradient.cristal("Thinking...")).start();

    try {
      let jsonScript;
      const client = new AIClient(config);
      jsonScript = await client.generateScript(command);

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
          line = line.trim();
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
        let proceedOption = "yes";
        continuePrompt = continuePrompt && command[0] !== "!";
        if (continuePrompt) {
          const { proceedOption: userProceedOption } = await inquirer.prompt([
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
          proceedOption = userProceedOption;
        }

        if (proceedOption === "yes") {
          console.log();
          await executeScript(script);
          process.exit();
        } else if (proceedOption === "no") {
          logger.info("Execution aborted by user.");
          process.exit();
        }
      } else {
        await executeScript(script);
        process.exit();
      }
    } catch (error) {
      retryCount += 1;
      spinner.fail(gradient.morning("Bad Thoughts. Re-thinking."));
      logger.error({ error }, "An error occurred during processing");

      if (retryCount > maxRetries) {
        console.log(
          gradient.cristal(
            "The AI Service and Model is not working correctly for us."
          )
        );
        console.log(
          gradient.morning(
            "Please try again or open a ticket on https://github.com/CommandAI/ai-cli/issues with your AI Service Provider and Model."
          )
        );
        break;
      }
    }
  }
}

main();

export default main;
