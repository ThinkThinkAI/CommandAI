import { exec } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import getStdin from "get-stdin";
import inquirer from "inquirer";
import gradient from "gradient-string";

import { loadConfig, configure } from "./config.js";

export async function getCommandInput(defaultValue = "") {
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

export async function getCommand() {
  let command = process.argv.slice(2).join(" ");

  if (!command) {
    const stdinInput = await getStdin();
    if (stdinInput.trim()) {
      command = stdinInput.trim();
    } else {
      command = await getCommandInput();
    }
  }

  return command;
}

export async function cliCommands(command) {
  if (command.toLowerCase() === "upgrade") {
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

  if (command.toLowerCase() === "version" || command.toLowerCase() === "-v") {
    const packageJsonPath = join(__dirname, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    console.log(`Version: ${packageJson.version}`);
    return;
  }
}

export async function getConfig(command) {
  let config = loadConfig();
  if (!config) {
    console.log();
    console.log(LOGO);
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
  return config;
}

const raw_logo = [
  " ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗ ███╗   ██╗██████╗  █████╗ ██╗",
  "██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔══██╗██║",
  "██║     ██║   ██║██╔████╔██║██╔████╔██║███████║██╔██╗ ██║██║  ██║███████║██║",
  "██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚██╗██║██║  ██║██╔══██║██║",
  "╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║██████╔╝██║  ██║██║",
  " ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝",
];

export const LOGO = gradient.atlas.multiline(raw_logo.join("\n"));
