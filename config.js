import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(os.homedir(), ".cmdlineai", "config.json");

const defaultConfig = {
  aiService: "",
  ollamaUrl: "",
  ollamaModel: "",
  chatgptApiKey: "",
  chatgptModel: "",
};

function loadConfig() {
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath);
    return JSON.parse(configFile);
  } else {
    return null;
  }
}

async function saveConfig(config) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function configure() {
  const aiService = await inquirer.prompt([
    {
      type: "list",
      name: "aiService",
      message: "Select the AI service:",
      choices: ["Ollama", "ChatGPT"],
    },
  ]);

  let config;
  if (aiService.aiService === "Ollama") {
    config = await inquirer.prompt([
      {
        type: "input",
        name: "ollamaUrl",
        message: "Enter the URL for the Ollama server:",
      },
      {
        type: "input",
        name: "ollamaModel",
        message: "Enter the model to use for Ollama:",
      },
    ]);
  } else {
    config = await inquirer.prompt([
      {
        type: "input",
        name: "chatgptApiKey",
        message: "Enter the API key for ChatGPT:",
      },
      {
        type: "input",
        name: "chatgptModel",
        message: "Enter the model to use for ChatGPT:",
      },
    ]);
  }

  config.aiService = aiService.aiService;

  await saveConfig(config);
  return config;
}

export { loadConfig, saveConfig, configure, configPath, defaultConfig };
