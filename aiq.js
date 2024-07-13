#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import AIClient from "./lib/aiClient/aiClient.js";
import { getConfig } from "./lib/cli.js";

import { getDatabaseAdapter } from "dbinfoz";

const configFilePath = path.resolve(process.env.HOME, ".commandai/db.json");

let USE_PROMPT = true;

function consoleLog(message) {
  if (USE_PROMPT) {
    console.log(message);
  }
}

async function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function getConnectionConfig(dbConfigs, nameOrFilePath) {
  let dbConfig = dbConfigs.find(
    (config) =>
      config.name === nameOrFilePath ||
      (config.config && config.config.filename === nameOrFilePath),
  );

  if (!dbConfig) {
    if (await fileExists(nameOrFilePath)) {
      dbConfig = { type: 'sqlite', config: { filename: nameOrFilePath } };
    } else {
      const relativePath = path.resolve(process.cwd(), nameOrFilePath);
      
      if (await fileExists(relativePath)) {
        dbConfig = { type: 'sqlite', config: { filename: relativePath } };
      } else {
        throw new Error(`Configuration for ${nameOrFilePath} not found and it's not a file!`);
      }
    }
  }

  return dbConfig;
}


async function generateQuery(command, client, dbAdapter) {
  let spinner = null;
  if (USE_PROMPT) { spinner = ora(gradient.cristal("Thinking...")).start(); }
  const queryString = await client.generateQuery(command, dbAdapter);
  if (USE_PROMPT) { spinner.succeed(gradient.cristal("Query generated.")); }

  const queryObject = JSON.parse(queryString);
  return queryObject;
}

async function retryQuery(client, dbAdapter) {
  const spinner = ora(gradient.cristal("Thinking...")).start();
  const queryString = await client.generateQuery(
    "That was invalid sql. Try again. Remember the schemas.",
    dbAdapter,
  );
  spinner.succeed(gradient.cristal("Query generated."));
  consoleLog(queryString);

  const queryObject = JSON.parse(queryString);
  return queryObject;
}

async function executeQuery(adapter, query) {
  return await adapter.runQuery(query);
}

async function promptUser() {
  const { userChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "userChoice",
      message:
        "This query will modify the database. Do you want to execute it?",
      choices: ["yes", "no"],
    },
  ]);
  return userChoice;
}

async function promptUserWithPreview(previewCount = null) {
  const message =
    previewCount !== null
      ? `This query will modify ${previewCount} records. Do you want to execute or preview it?`
      : "This query will modify the database. Do you want to execute or preview it?";

  const { userChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "userChoice",
      message: message,
      choices: ["yes", "no", "preview"],
    },
  ]);

  return userChoice;
}

async function validateArguments(args) {
  if (args.length === 0) {
    return "no-params";
  }
  if (args.length === 1) {
    return "single-param";
  }
  return "execute-query";
}

async function setupClient(command) {
  const config = await getConfig(command);
  return new AIClient(config);
}

async function getPreviewCount(adapter, previewQuery) {
  try {
    const result = await executeQuery(adapter, previewQuery);
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      result[0].count !== undefined
    ) {
      return result[0].count;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching preview count: ${error.message}`);
    return null;
  }
}

async function handleQuery(command, client, adapter) {
  const queryObj = await generateQuery(command, client, adapter);
  consoleLog(gradient.cristal("Generated Query:"));
  consoleLog(gradient.teen(queryObj.query));
  return queryObj;
}

async function checkIfModifyingQuery(query) {
  const modifyingStatementsRegex =
    /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;
  return modifyingStatementsRegex.test(query);
}

async function getUserChoiceForModification(adapter, queryObj) {
  const previewCount = await getPreviewCount(adapter, queryObj.preview_count);
  return await promptUserWithPreview(previewCount);
}

async function tryExecutePreviewQuery(adapter, previewQuery) {
  try {
    const previewResult = await executeQuery(adapter, previewQuery);
    console.log(gradient.cristal("Preview Result:"));
    console.log(previewResult);
    const finalChoice = await promptUser();
    return finalChoice === "yes";
  } catch (error) {
    console.error(`Error executing preview query: ${error.message}`);
    return false;
  }
}

async function handleUserPrompt(queryObj, adapter) {
  if (await checkIfModifyingQuery(queryObj.query)) {
    const userChoice = await getUserChoiceForModification(adapter, queryObj);

    if (userChoice === "no") {
      return false;
    } else if (userChoice === "preview") {
      return await tryExecutePreviewQuery(adapter, queryObj.preview_query);
    }
  }

  return true;
}

async function displayPagedResult(result) {
  const pageSize = 10;
  let currentPage = 0;
  const totalPages = Math.ceil(result.length / pageSize);

  while (true) {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const pageResult = result.slice(start, end);

    console.log(gradient.cristal(`Page ${currentPage + 1} of ${totalPages}:`));
    console.log(pageResult);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Navigate:',
        choices: ['Next', 'Previous', 'Exit'],
      },
    ]);

    if (action === 'Next' && currentPage < totalPages - 1) {
      currentPage++;
    } else if (action === 'Previous' && currentPage > 0) {
      currentPage--;
    } else if (action === 'Exit') {
      break;
    }
  }
}


async function executeWithRetries(adapter, query, client, prompt) {
  let retries = 2;

  while (retries >= 0) {
    try {
      const result = await executeQuery(adapter, query);
      if (result.length > 0) {
        if (prompt) {
          await displayPagedResult(result);
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
      } else {
        console.log("No records found.");
      }
      break;
    } catch (error) {
      if (retries > 0) {
        console.error(`Invalid SQL: ${error.message}. Retrying...`);
        retries--;
        await retryQuery(client, adapter);
      } else {
        console.error("Failed to execute the query after multiple attempts.");
        break;
      }
    }
  }
}


async function processQuery(dbConfigs, connectionNameOrFile, command, client) {
  const connectionConfig = await getConnectionConfig(dbConfigs, connectionNameOrFile);
  const adapter = getDatabaseAdapter(connectionConfig.type, connectionConfig.config);

  const queryObj = await handleQuery(command, client, adapter);

  const shouldExecute = await handleUserPrompt(queryObj, adapter);

  if (shouldExecute) {
    await executeWithRetries(adapter, queryObj.query, client, USE_PROMPT);
  } else {
    consoleLog("Query execution aborted by user.");
  }
}

async function loadConfig() {
  if (!fs.existsSync(configFilePath)) {
    return [];
  }

  const configContent = fs.readFileSync(configFilePath, "utf-8");
  return JSON.parse(configContent);
}

async function saveConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf-8");
}

// eslint-disable-next-line max-lines-per-function
async function manageConfig() {
  const dbConfigs = await loadConfig();
  const choices =
    dbConfigs.length > 0
      ? ["Add new connection", "Edit a connection", "Remove a connection"]
      : ["Add new connection"];

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices,
    },
  ]);

  switch (action) {
    case "Add new connection":
      return await addConnection(dbConfigs);
    case "Edit a connection":
      return await editConnection(dbConfigs);
    case "Remove a connection":
      await removeConnection(dbConfigs);
      break;
  }
}

async function addConnection(dbConfigs) {
  const newConnection = await promptConnectionDetails();
  dbConfigs.push(newConnection);
  await saveConfig(dbConfigs);
  console.log("New connection added successfully.");
  return [dbConfigs, newConnection.name];
}

async function editConnection(dbConfigs) {
  const { connectionName } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionName",
      message: "Choose a connection to edit:",
      choices: dbConfigs.map((config) => config.name),
    },
  ]);

  const connectionIndex = dbConfigs.findIndex(
    (config) => config.name === connectionName,
  );
  const updatedConnection = await promptConnectionDetails(
    dbConfigs[connectionIndex],
  );
  dbConfigs[connectionIndex] = updatedConnection;
  await saveConfig(dbConfigs);
  console.log("Connection edited successfully.");
  return [dbConfigs, connectionName];
}

async function removeConnection(dbConfigs) {
  const { connectionName } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionName",
      message: "Choose a connection to remove:",
      choices: dbConfigs.map((config) => config.name),
    },
  ]);

  const updatedConfigs = dbConfigs.filter(
    (config) => config.name !== connectionName,
  );
  await saveConfig(updatedConfigs);
  console.log("Connection removed successfully.");
}

function getValue(value, defaultValue = "") {
  return value || defaultValue;
}

// eslint-disable-next-line max-lines-per-function, complexity
async function promptConnectionDetails(existingConfig = {}) {
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Connection name:",
      default: getValue(existingConfig.name),
    },
    {
      type: "list",
      name: "type",
      message: "Database type:",
      choices: ["postgres", "mysql", "sqlite"],
      default: getValue(existingConfig.type),
    },
    {
      type: "input",
      name: "user",
      message: "Database user:",
      when: (answers) => answers.type !== "sqlite",
      default: getValue(existingConfig.config?.user),
    },
    {
      type: "input",
      name: "host",
      message: "Database host:",
      when: (answers) => answers.type !== "sqlite",
      default: getValue(existingConfig.config?.host),
    },
    {
      type: "input",
      name: "database",
      message: "Database name:",
      default: getValue(existingConfig.config?.database),
    },
    {
      type: "password",
      name: "password",
      message: "Database password:",
      when: (answers) => answers.type !== "sqlite",
      default: getValue(existingConfig.config?.password),
    },
    {
      type: "number",
      name: "port",
      message: "Database port:",
      when: (answers) => answers.type !== "sqlite",
      default: getValue(existingConfig.config?.port, 5432),
    },
    {
      type: "input",
      name: "filename",
      message: "SQLite file path:",
      when: (answers) => answers.type === "sqlite",
      default: getValue(existingConfig.config?.filename),
    },
  ];

  const answers = await inquirer.prompt(questions);

  return {
    name: answers.name,
    type: answers.type,
    config: {
      user: answers.user,
      host: answers.host,
      database: answers.database,
      password: answers.password,
      port: answers.port,
      ...(answers.type === "sqlite" && { filename: answers.filename }),
    },
  };
}

function shouldExitConversation(question) {
  const exitWords = new Set(["exit", "goodbye", "quit"]);
  return !question || exitWords.has(question.toLowerCase().trim());
}

async function promptForCommands(dbConfigs, connectionNameOrFile, client) {
  let command;
  do {
    const input = await inquirer.prompt([
      {
        type: "input",
        name: "command",
        message: "aiq>",
      },
    ]);
    command = input.command;

    if (shouldExitConversation(command)) {
      break;
    }
    
    await processQuery(dbConfigs, connectionNameOrFile, command, client);
  } while (true);
}

async function handleNoOrSingleParam() {
  const [dbConfigs, connectionNameOrFile] = await manageConfig();
  const client = await setupClient();

  await promptForCommands(dbConfigs, connectionNameOrFile, client);
}

async function handleExecuteQuery(args, prompt) {
  const connectionNameOrFile = args[0];
  const command = args.slice(1).join(" ");
  const dbConfigs = await loadConfig();
  const client = await setupClient(command);
  await processQuery(dbConfigs, connectionNameOrFile, command, client);
  if (prompt) {
    await promptForCommands(dbConfigs, connectionNameOrFile, client);
  }
}

async function main(prompt = true) {
  USE_PROMPT = prompt;

  let args = process.argv.slice(2);
  if(args.length === 1) { args = args[0].split(' ') }
  const paramType = await validateArguments(args);

  switch (paramType) {
    case "no-params":
    case "single-param":
      await handleNoOrSingleParam();
      break;
    case "execute-query":
      await handleExecuteQuery(args, prompt);
      break;
    default:
      throw new Error(`Unknown paramType: ${paramType}`);
  }

  process.exit(0);
}

if (!`file://${process.argv[1]}`.includes('!')) {
  main();
}

export default main;
