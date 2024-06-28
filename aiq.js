#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import AIClient from "./lib/aiClient/aiClient.js";
import Logger from "./lib/logger.js";
import { getConfig } from "./lib/cli.js";

import { getDatabaseAdapter } from "dbinfoz";

const logger = new Logger("aiq");

const configFilePath = path.resolve(process.env.HOME, ".commandai/db.config");

async function getConnectionConfig(dbConfigs, nameOrFilePath) {
  const dbConfig = dbConfigs.find(
    (config) =>
      config.name === nameOrFilePath ||
      (config.config && config.config.filename === nameOrFilePath),
  );

  if (!dbConfig) {
    throw new Error(`Configuration for ${nameOrFilePath} not found!`);
  }

  return dbConfig;
}

async function generateQuery(command, client, dbAdapter) {
  const spinner = ora(gradient.cristal("Thinking...")).start();
  const queryString = await client.generateQuery(command, dbAdapter);
  spinner.succeed(gradient.cristal("Query generated."));
  console.log(queryString);

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
  console.log(queryString);

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

async function promptUserWithPreview() {
  const { userChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "userChoice",
      message:
        "This query will modify the database. Do you want to execute or preview it?",
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

// eslint-disable-next-line max-lines-per-function, complexity
async function processQuery(dbConfigs, connectionNameOrFile, command, client) {
  const connectionConfig = await getConnectionConfig(
    dbConfigs,
    connectionNameOrFile,
  );

  const adapter = getDatabaseAdapter(
    connectionConfig.type,
    connectionConfig.config,
  );

  const queryObj = await generateQuery(command, client, adapter);

  console.log(gradient.cristal("Generated Query:"));
  console.log(gradient.teen(queryObj.query));

  const modifyingStatementsRegex =
    /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;
  const isModifyingQuery = modifyingStatementsRegex.test(queryObj.query);

  let execute = true;

  if (isModifyingQuery) {
    const userChoice = await promptUserWithPreview();
    if (userChoice === "no") {
      execute = false;
    } else if (userChoice === "preview") {
      try {
        const previewResult = await executeQuery(
          adapter,
          queryObj.preview_query,
        );
        console.log(gradient.cristal("Preview Result:"));
        console.log(previewResult);
        const finalChoice = await promptUser();
        execute = finalChoice === "yes";
      } catch (error) {
        console.error(`Error executing preview query: ${error.message}`);
        execute = false;
      }
    }
  }

  if (execute) {
    let retries = 2;
    while (retries >= 0) {
      try {
        const result = await executeQuery(adapter, queryObj.query);
        console.log(gradient.cristal("Query Result:"));
        console.log(result);
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
  } else {
    console.log("Query execution aborted by user.");
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
      await addConnection(dbConfigs);
      break;
    case "Edit a connection":
      await editConnection(dbConfigs);
      break;
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

    if (command.toLowerCase() !== "exit") {
      await processQuery(dbConfigs, connectionNameOrFile, command, client);
    }
  } while (command.toLowerCase() !== "exit");
}

async function main() {
  const args = process.argv.slice(2).join(" ").split(" ");
  const paramType = await validateArguments(args);

  try {
    if (paramType === "no-params" || paramType === "single-param") {
      await manageConfig();
    } else if (paramType === "execute-query") {
      const connectionNameOrFile = args[0];
      const command = args.slice(1).join(" ");
      const dbConfigs = await loadConfig();
      const client = await setupClient(command);
      await processQuery(dbConfigs, connectionNameOrFile, command, client);
      await promptForCommands(dbConfigs, connectionNameOrFile, client);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
