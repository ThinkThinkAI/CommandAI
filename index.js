#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import { loadConfig, configure } from "./config.js";
import ChatGPTClient from "./chatgptClient.js";
import OllamaClient from "./ollamaClient.js";
import JSONScript from "jsonscriptlib";


const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("Error: Please provide a command.");
  process.exit(1);
}

(async () => {
  let config = loadConfig();
  if (!config) {
    console.log("No configuration found. Please configure the application.");
    config = await configure();
  }

  const spinner = ora("Generating script...").start();

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

    spinner.succeed("Script generated successfully.");
    const script = new JSONScript(JSON.parse(jsonScript));

    if (config.showExecutionDescription) {
      console.log(
        "Execution Description:",
        script.executionDescription.join("\n")
      );
    }

    if (config.showExecutionPlan) {
      console.log("Execution Plan:", script.executionPlan.join("\n"));
    }

    if (!config.showExecutionDescription && !config.showExecutionPlan) {
      // Directly execute if both options are false
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
    } else {
      // Ask for confirmation to proceed with execution
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Do you want to proceed with the execution?",
        },
      ]);

      if (proceed) {
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
      } else {
        console.log("Execution aborted.");
      }
    }
  } catch (error) {
    spinner.fail("Failed to generate script.");
    console.error("An error occurred:", error.message);
  }
})();
