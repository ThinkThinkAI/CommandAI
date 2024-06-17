#!/usr/bin/env node

import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";

import AIClient from "./lib/aiClient/aiClient.js";
import Logger from "./lib/logger.js";
import { getConfig, getCommand } from "./lib/cli.js";

import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

const logger = new Logger("chat");

function markdownToConsole(text) {
  let terminalHighlightedCode = "";
  try {
    marked.use(markedTerminal());

    terminalHighlightedCode = marked(text); //console.log(terminalHighlightedCode);
  } catch (error) {
    console.error("An error occurred while highlighting code:", error);
  }

  return terminalHighlightedCode;
}

async function askQuestion(question, client) {
  const spinner = ora(gradient.cristal("Thinking...")).start();
  try {
    const response = await client.generateResponse(question);
    spinner.succeed(gradient.cristal("Ready."));
    //console.log(response.trim());
    console.log(markdownToConsole(response.trim()));
    return response;
  } catch (error) {
    spinner.fail(gradient.cristal("Failed to get response."));
    logger.error({ error: error.message }, "Error occurred.");
  }
}

async function chatPrompt() {
  const { result } = await inquirer.prompt([
    {
      type: "input",
      name: "result",
      message: ">",
    },
  ]);
  return result;
}

async function startConversation(client, question) {
  let continueConversation = true;

  while (continueConversation) {
    if (question === null) {
      question = await chatPrompt();
    }

    const exitWords = ["exit", "goodbye", "quit"];

    if (!question || exitWords.includes(question.toLowerCase().trim())) {
      continueConversation = false;
      console.log(gradient.morning("Goodbye!"));
      break;
    }

    await askQuestion(question, client);
    question = null;
  }

  process.exit();
}

async function main(startConvo = true) {
  try {
    const command = await getCommand();
    const config = await getConfig(command);
    const client = new AIClient(config);
    if (startConvo) {
      await startConversation(client, command);
    } else {
      await askQuestion(command, client);
    }
  } catch (error) {
    logger.error(`An error occurred: ${error.message}`);
    process.exit(1);
  }
}

main();

export default main;
