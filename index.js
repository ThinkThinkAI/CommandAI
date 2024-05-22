#!/usr/bin/env node

import inquirer from "inquirer";
import os from "os";
import ora from "ora";
import { loadConfig, configure } from "./config.js";
import { generateScript as generateOllamaScript } from "./ollamaClient.js";
import { generateScript as generateChatGPTScript } from "./chatgptClient.js";
import JSONScript from "jsonscriptlib";

// Get the command from command line arguments
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

  const osType = os.type(); // Get the operating system type

  const aiPrompt = `I am at a command line on ${osType}. I need you to do the following ${command}  
  Format your response in the following json format. only return the json object.
    1. Structure: The JSON is an array of objects. Each object represents a step in the process.
    2. Command Execution: Each object can have a "cmd" field, which contains a command to be executed in the terminal.
    3. File Creation: Each object can also have a "file" field. The "file" field contains an object with two properties:
    • "name": The name of the file to be created, including a path if necessary (defaults to same directory)
    • "data": The content to be written into the file.
    4. Comments: Each object can have a "comment" field that provides a description or explanation of the step.
    5. Order: The steps are executed in the order they appear in the array, from top to bottom.
    `;

   const spinner = ora("AI is thinking...").start();

   try {
     let jsonScript;
     if (config.aiService === "Ollama") {
       jsonScript = await generateOllamaScript(
         aiPrompt,
         config.ollamaUrl,
         config.ollamaModel
       );
     } else if (config.aiService === "ChatGPT") {
       jsonScript = await generateChatGPTScript(
         aiPrompt,
         config.chatgptApiKey,
         config.chatgptModel
       );
     } else {
       throw new Error("Invalid AI service configuration.");
     }

     spinner.succeed("AI is done thinking.");
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
           console.log("Execution Results:", result.results);
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
