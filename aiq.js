#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import ora from "ora";
import gradient from "gradient-string";
import AIClient from "./lib/aiClient/aiClient.js";
import Logger from "./lib/logger.js";
import { getConfig } from "./lib/cli.js";

import pkg from "dbinfoz";
const { getDatabaseAdapter } = pkg;

const logger = new Logger("aiq");

const configFilePath = path.resolve(process.env.HOME, ".commandai/db.config");

async function getConnectionConfig(nameOrFilePath) {
  const configContent = fs.readFileSync(configFilePath, "utf-8");
  const dbConfigs = JSON.parse(configContent);

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

async function generateQuery(command, client) {
  const spinner = ora(gradient.cristal("Generating query...")).start();
  const query = await client.generateScript(command);
  spinner.succeed(gradient.cristal("Query generated."));
  return query;
}

async function executeQuery(connectionConfig, query) {
  const adapter = getDatabaseAdapter(
    connectionConfig.type,
    connectionConfig.config,
  );
  return await adapter.runQuery(query);
}

async function promptUser() {
  const { proceedOption } = await inquirer.prompt([
    {
      type: "list",
      name: "proceedOption",
      message: "Do you want to proceed with the query execution?",
      choices: [
        { name: "Yes", value: "yes" },
        { name: "No", value: "no" },
      ],
    },
  ]);
  return proceedOption;
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

async function processQuery(connectionNameOrFile, command) {
  const connectionConfig = await getConnectionConfig(connectionNameOrFile);
  const client = await setupClient(command);
  const query = await generateQuery(command, client);

  console.log(gradient.cristal("Generated Query:"));
  console.log(gradient.teen(query));

  const userChoice = await promptUser();
  if (userChoice === "yes") {
    const result = await executeQuery(connectionConfig, query);
    console.log(gradient.cristal("Query Result:"));
    console.log(result);
  } else {
    console.log("Query execution aborted by user.");
  }
}

async function manageConfig() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "Add new connection",
        "Edit a connection",
        "Remove a connection",
      ],
    },
  ]);
  switch (action) {
    case "Add new connection":
      await addConnection();
      break;
    case "Edit a connection":
      await editConnection();
      break;
    case "Remove a connection":
      await removeConnection();
      break;
  }
}

async function addConnection() {
  const newConnection = await promptConnectionDetails();
  const configContent = fs.readFileSync(configFilePath, "utf-8");
  const dbConfigs = JSON.parse(configContent);
  dbConfigs.push(newConnection);
  saveConfig(dbConfigs);
  console.log("New connection added successfully.");
}

async function editConnection() {
  const configContent = fs.readFileSync(configFilePath, "utf-8");
  const dbConfigs = JSON.parse(configContent);
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
  saveConfig(dbConfigs);
  console.log("Connection edited successfully.");
}

async function removeConnection() {
  const configContent = fs.readFileSync(configFilePath, "utf-8");
  const dbConfigs = JSON.parse(configContent);
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
  saveConfig(updatedConfigs);
  console.log("Connection removed successfully.");
}

// eslint-disable-next-line max-lines-per-function, complexity
async function promptConnectionDetails(existingConfig = {}) {
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Connection name:",
      default: existingConfig.name || "",
    },
    {
      type: "list",
      name: "type",
      message: "Database type:",
      choices: ["postgres", "mysql", "sqlite"],
      default: existingConfig.type || "",
    },
    {
      type: "input",
      name: "user",
      message: "Database user:",
      when: (answers) => answers.type !== "sqlite",
      default: existingConfig.config?.user || "",
    },
    {
      type: "input",
      name: "host",
      message: "Database host:",
      when: (answers) => answers.type !== "sqlite",
      default: existingConfig.config?.host || "",
    },
    {
      type: "input",
      name: "database",
      message: "Database name:",
      default: existingConfig.config?.database || "",
    },
    {
      type: "password",
      name: "password",
      message: "Database password:",
      when: (answers) => answers.type !== "sqlite",
      default: existingConfig.config?.password || "",
    },
    {
      type: "number",
      name: "port",
      message: "Database port:",
      when: (answers) => answers.type !== "sqlite",
      default: existingConfig.config?.port || 5432,
    },
    {
      type: "input",
      name: "filename",
      message: "SQLite file path:",
      when: (answers) => answers.type === "sqlite",
      default: existingConfig.config?.filename || "",
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

function saveConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf-8");
}

async function main() {
  const args = process.argv.slice(2);
  const paramType = await validateArguments(args);

  try {
    if (paramType === "no-params" || paramType === "single-param") {
      await manageConfig();
    } else if (paramType === "execute-query") {
      const connectionNameOrFile = args[0];
      const command = args.slice(1).join(" ");
      await processQuery(connectionNameOrFile, command);
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
