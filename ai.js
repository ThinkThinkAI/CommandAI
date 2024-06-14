#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import JSONScript from "jsonscriptlib";

import AIClient from "./lib/aiClient/aiClient.js";
import Logger from "./lib/logger.js";

import { getCommand, getConfig } from "./lib/cli.js";

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

async function generateScript(command, config) {
  const spinner = ora(gradient.cristal("Thinking...")).start();
  const client = new AIClient(config);
  const jsonScript = await client.generateScript(command);
  spinner.succeed(gradient.cristal("Ready."));
  console.log();
  logger.info({ jsonScript: JSON.parse(jsonScript) }, "JSON Response logged");
  return jsonScript;
}

function displayExecutionDetails(script, config) {
  if (config.showExecutionDescription) {
    console.log(gradient.cristal("Execution Description:"));
    console.log(
      script.executionDescription
        .map((line) => gradient.teen(line.trim()))
        .join("\n"),
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
          gradient.passion("Create file:") + gradient.teen(coloredLine),
        );
      } else {
        console.log(gradient.teen(line));
      }
    });
    console.log();
  }
}

async function promptUser() {
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
  return proceedOption;
}

function handleError(error, retryCount, maxRetries) {
  console.log(error);
  const spinner = ora(gradient.cristal("Thinking...")).start();
  spinner.fail(gradient.morning("Bad Thoughts. Re-thinking."));
  logger.error({ error }, "An error occurred during processing");

  if (retryCount > maxRetries) {
    console.log(
      gradient.cristal(
        "The AI Service and Model is not working correctly for us.",
      ),
    );
    console.log(
      gradient.morning(
        "Please try again or open a ticket on https://github.com/CommandAI/ai-cli/issues with your AI Service Provider and Model.",
      ),
    );
  }
}

async function main(continuePrompt = true) {
  const command = await getCommand();
  const config = await getConfig(command);

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const jsonScript = await generateScript(command, config);
      const script = new JSONScript(JSON.parse(jsonScript));

      displayExecutionDetails(script, config);

      const shouldPromptUser = continuePrompt && command[0] !== "!";
      const proceedOption = shouldPromptUser ? await promptUser() : "yes";

      if (proceedOption === "yes") {
        await executeScript(script);
        process.exit();
      } else if (proceedOption === "no") {
        logger.info("Execution aborted by user.");
        process.exit();
      }
    } catch (error) {
      handleError(error, retryCount, maxRetries);
      retryCount += 1;
    }
  }
}

main();

export default main;
