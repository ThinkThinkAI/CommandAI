#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import JSONScript from "jsonscriptlib";

import AIClient from "./lib/aiClient/aiClient.js";
import Logger from "./lib/logger.js";

import { getCommand, cliCommands, getConfig, LOGO } from "./lib/cli.js";


const logger = new Logger("command");

async function executeScript(script) {
  const result = await script.execute();

  if (result.error) {
    logger.error({ error: result.error }, "Execution Error");
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

async function main(continuePrompt = true) {
  let command = await getCommand();

  await cliCommands(command);

  let config = await getConfig(command);

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    const spinner = ora(gradient.cristal("Thinking...")).start();

    try {
      const client = new AIClient(config);
      let jsonScript = await client.generateScript(command);

      spinner.succeed(gradient.cristal("Ready."));
      console.log();

      try {
        logger.info(
          { jsonScript: JSON.parse(jsonScript) },
          "JSON Response logged"
        );
      } catch(e) {
        logger.info(`AI Client Response ${jsonScript}`)
      }

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
      console.log(error);
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
