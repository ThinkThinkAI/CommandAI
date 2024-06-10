import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import os from "os";
import { OpenAI } from "openai";
import { Ollama } from "ollama";
import gradient from "gradient-string";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(os.homedir(), ".commandai", "config.json");
const defaultChatGPTModel = "gpt-4o";
const defaultOllamaUrl = "http://127.0.0.1:11434";

async function checkOllamaActive(url = defaultOllamaUrl) {
  try {
    const ollama = new Ollama(url);
    await ollama.list();
    return true;
  } catch (error) {
    return false;
  }
}

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
  console.log();
  console.log(gradient.cristal(`Config saved successfully at: ${configPath}`));
  console.log();
}

async function validateApiKey(apiKey) {
  try {
    const openai = new OpenAI({ apiKey: apiKey });
    await openai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}

async function fetchChatGPTModels(apiKey) {
  try {
    const openai = new OpenAI({ apiKey: apiKey });
    const response = await openai.models.list();
    return response.data.map((model) => model.id);
  } catch (error) {
    console.error("Failed to fetch models:", error.message);
    return [];
  }
}

async function validateOllamaUrl(url) {
  try {
    const ollama = new Ollama({ host: url });
    await ollama.list();
    return true;
  } catch (error) {
    console.error("Failed to connect to Ollama server:", error.message);
    return false;
  }
}

async function fetchOllamaModels(url) {
  try {
    const ollama = new Ollama({host: url});
    const response = await ollama.list();
    return response.models.map((model) => model.name);
  } catch (error) {
    console.error("Failed to fetch models from Ollama server:", error.message);
    return [];
  }
}

async function promptAiService(choices, defaultValue) {
  const aiService = await inquirer.prompt([
    {
      type: "list",
      name: "aiService",
      message: "Select the AI service:",
      choices: choices,
      default: defaultValue,
    },
  ]);
  return aiService.aiService;
}

async function promptOllamaConfig(defaultUrl) {
  const ollamaConfig = await inquirer.prompt([
    {
      type: "input",
      name: "ollamaUrl",
      message: "Enter the URL for the Ollama server:",
      default: defaultUrl,
    },
  ]);

  const isValidUrl = await validateOllamaUrl(ollamaConfig.ollamaUrl);
  if (!isValidUrl) {
    console.error("Invalid Ollama server URL. Please try again.");
    return null;
  }

  const models = await fetchOllamaModels(ollamaConfig.ollamaUrl);
  if (models.length === 0) {
    console.error("No models found on the Ollama server. Please try again.");
    return null;
  }

  const ollamaModel = await inquirer.prompt([
    {
      type: "list",
      name: "ollamaModel",
      message: "Select the Ollama model:",
      choices: models,
      default: defaultUrl,
    },
  ]);

  return {
    ollamaUrl: ollamaConfig.ollamaUrl,
    ollamaModel: ollamaModel.ollamaModel,
  };
}

async function promptChatGPTConfig(defaultApiKey, defaultModel) {
  const chatgptConfig = await inquirer.prompt([
    {
      type: "input",
      name: "chatgptApiKey",
      message: "Enter your OpenAI API key:",
      default: defaultApiKey,
    },
  ]);

  const isValidApiKey = await validateApiKey(chatgptConfig.chatgptApiKey);
  if (!isValidApiKey) {
    console.error("Invalid API key. Please try again.");
    return null;
  }

  const models = await fetchChatGPTModels(chatgptConfig.chatgptApiKey);
  if (models.length === 0) {
    console.error(
      "No models found for the provided API key. Please try again."
    );
    return null;
  }

  const chatgptModel = await inquirer.prompt([
    {
      type: "list",
      name: "chatgptModel",
      message: "Select the ChatGPT model:",
      choices: models,
      default: defaultModel,
    },
  ]);

  return {
    chatgptApiKey: chatgptConfig.chatgptApiKey,
    chatgptModel: chatgptModel.chatgptModel,
  };
}

async function configure(
  defaultConfig = {
    aiService: "",
    ollamaUrl: defaultOllamaUrl,
    ollamaModel: "",
    chatgptApiKey: "",
    chatgptModel: defaultChatGPTModel,
    showExecutionDescription: true,
    showExecutionPlan: true,
    enableLogging: false,
  }
) {
  let validConfig = false;
  let finalConfig = { ...defaultConfig };

  const isOllamaActive = await checkOllamaActive();
  const aiServiceChoices = [
    { name: isOllamaActive ? "Ollama (Running)" : "Ollama", value: "Ollama" },
    { name: "ChatGPT", value: "ChatGPT" }, 
  ];

  while (!validConfig) {
    finalConfig.aiService = await promptAiService(
      aiServiceChoices,
      finalConfig.aiService
    );

    if (finalConfig.aiService === "Ollama") {
      const ollamaConfig = await promptOllamaConfig(finalConfig.ollamaUrl);
      if (!ollamaConfig) continue;
      finalConfig.ollamaUrl = ollamaConfig.ollamaUrl;
      finalConfig.ollamaModel = ollamaConfig.ollamaModel;
    } else if (finalConfig.aiService === "ChatGPT") {
      const chatgptConfig = await promptChatGPTConfig(
        finalConfig.chatgptApiKey,
        finalConfig.chatgptModel
      );
      if (!chatgptConfig) continue;
      finalConfig.chatgptApiKey = chatgptConfig.chatgptApiKey;
      finalConfig.chatgptModel = chatgptConfig.chatgptModel;
    }

    validConfig = true;
    await saveConfig(finalConfig);

    return finalConfig;
  }
}

export { loadConfig, saveConfig, configure };
