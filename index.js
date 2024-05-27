#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import { loadConfig, configure } from "./config.js";
import ChatGPTClient from "./chatgptClient.js";
import OllamaClient from "./ollamaClient.js";
import JSONScript from "jsonscriptlib";

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
  } else {
    result.results.forEach((res) => {
      if (res.type === "cmd") {
        console.log(res.result);
      } else if (res.type === "file") {
        console.log(`File ${res.result}`);
      }
    });
  }
}

async function main() {
  let command = process.argv.slice(2).join(" ");
  if (!command) {
    command = await getCommandInput();
  }

  let config = loadConfig();
  if (!config) {
    console.log("No configuration found. Please configure the application.");
    config = await configure();
  }

  while (true) {
    const spinner = ora("Thinking...").start();

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

      spinner.succeed("Ready.");
      console.log();
      const script = new JSONScript(JSON.parse(jsonScript));

      if (config.showExecutionDescription) {
        console.log(
          "Execution Description:\n",
          script.executionDescription.join("\n")
        );
        console.log();
      }

      if (config.showExecutionPlan) {
        console.log("Execution Plan:\n", script.executionPlan.join("\n"));
        console.log();
      }

      // Ask for confirmation to proceed with execution
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
          break; // exit the loop after successful execution
        } else if (proceedOption === "no") {
          console.log("Execution aborted.");
          break; // exit the loop if user chooses to abort
        } else if (proceedOption === "newSolution") {
          console.log("Generating a new solution with the same prompt...");
          continue; // retry with the same command in the loop
        }
      } else {
        await executeScript(script);
        break; // exit the loop after successful execution
      }
    } catch (error) {
      spinner.fail("Failed to generate script.");
      console.error("An error occurred:", error.message);
      break; // exit the loop if an error occurs
    }
  }
}

main();
