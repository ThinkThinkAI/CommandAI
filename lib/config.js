import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import os from "os";
import { OpenAI } from "openai";
import { Ollama } from "ollama";
import gradient from "gradient-string";
import { continueActive, getContinueModels } from "./continue/continue.js";

const configPath = path.join(os.homedir(), ".commandai", "config.json");
const defaultChatGPTModel = "gpt-4o";
const defaultOllamaUrl = "http://127.0.0.1:11434";

async function checkOllamaActive(url = defaultOllamaUrl) {
  try {
    const ollama = new Ollama(url);
    await ollama.list();
    return true;
  } catch (error) {
    console.error("Ollama is not active:", error.message);
    return false;
  }
}

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile);

  config.model = getModel(config);

  return config;
}

async function saveConfig(config) {
  config.model = getModel(config);

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  logConfigSaved(configPath);
}

function getModel(config) {
  switch (config.aiService) {
    case "Ollama":
      return config.ollamaModel;
    case "ChatGPT":
      return config.chatgptModel;
    default:
      return config.continueModel;
  }
}

function logConfigSaved(configPath) {
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
    console.error("Invalid API key:", error.message);
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
    const ollama = new Ollama({ host: url });
    const response = await ollama.list();
    return response.models.map((model) => model.name);
  } catch (error) {
    console.error("Failed to fetch models from Ollama server:", error.message);
    return [];
  }
}

async function fetchContinueModels() {
  try {
    return await getContinueModels();
  } catch (error) {
    console.error(
      "Failed to fetch models from Continue service:",
      error.message,
    );
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

async function promptOllamaURL(defaultUrl) {
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

  return ollamaConfig;
}

async function promptOllamaModel(defaultModel) {
  const models = await fetchOllamaModels(defaultOllamaUrl);
  if (models.length === 0) {
    console.error(
      "No models found on the Ollama server.",
      "Please ensure that models are installed and the server is properly configured.",
    );

    return null;
  }

  const ollamaModel = await inquirer.prompt([
    {
      type: "list",
      name: "ollamaModel",
      message: "Select the Ollama model:",
      choices: models,
      default: defaultModel,
    },
  ]);

  return ollamaModel;
}

async function promptOllamaConfig(defaultUrl, defaultModel) {
  const ollamaConfig = await promptOllamaURL(defaultUrl);

  if (!ollamaConfig) return null;

  const ollamaModel = await promptOllamaModel(defaultModel);

  if (!ollamaModel) return null;

  return {
    ollamaUrl: ollamaConfig.ollamaUrl,
    ollamaModel: ollamaModel.ollamaModel,
  };
}

async function promptChatGPTAPIKey(defaultApiKey) {
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
    return null;
  }

  return chatgptConfig;
}

async function promptChatGPTModels(defaultModel, apiKey) {
  const models = await fetchChatGPTModels(apiKey);
  if (models.length === 0) {
    console.error(
      "No models found for the provided API key. Please try again.",
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

  return chatgptModel;
}

async function promptChatGPTConfig(defaultApiKey, defaultModel) {
  const chatgptConfig = await promptChatGPTAPIKey(defaultApiKey);

  if (!chatgptConfig) return null;

  const chatgptModel = await promptChatGPTModels(
    defaultModel,
    chatgptConfig.chatgptApiKey,
  );

  if (!chatgptModel) return null;

  return {
    chatgptApiKey: chatgptConfig.chatgptApiKey,
    chatgptModel: chatgptModel.chatgptModel,
  };
}

async function promptContinueModel(defaultModel) {
  const models = await fetchContinueModels();
  if (models.length === 0) {
    console.error(
      "No models found for the Continue service. Please try again.",
    );
    return null;
  }

  const continueModel = await inquirer.prompt([
    {
      type: "list",
      name: "continueModel",
      message: "Select the Continue model:",
      choices: models,
      default: defaultModel,
    },
  ]);

  return continueModel.continueModel;
}

async function getAIServiceChoices() {
  const isOllamaActive = await checkOllamaActive();
  const isContinueActive = await continueActive();

  return [
    { name: isOllamaActive ? "Ollama (Running)" : "Ollama", value: "Ollama" },
    { name: "ChatGPT", value: "ChatGPT" },
    {
      name: isContinueActive ? "Continue (Running)" : "Continue",
      value: "Continue",
    },
  ];
}

async function configure(
  defaultConfig = {
    aiService: "",
    ollamaUrl: defaultOllamaUrl,
    ollamaModel: "",
    chatgptApiKey: "",
    chatgptModel: defaultChatGPTModel,
    continueModel: "",
    showExecutionDescription: true,
    showExecutionPlan: true,
    enableLogging: false,
  },
) {
  let finalConfig = { ...defaultConfig };
  const aiServiceChoices = await getAIServiceChoices();

  finalConfig = await promptAndConfigureAIService(
    finalConfig,
    aiServiceChoices,
  );

  if (finalConfig) await saveConfig(finalConfig);

  return finalConfig;
}

async function promptAndConfigureAIService(finalConfig, aiServiceChoices) {
  let validConfig = false;

  while (!validConfig) {
    finalConfig.aiService = await promptAiService(
      aiServiceChoices,
      finalConfig.aiService,
    );

    const serviceConfig = await configureSelectedAIService(finalConfig);
    if (!serviceConfig) continue;
    Object.assign(finalConfig, serviceConfig);

    finalConfig.model = getModel(finalConfig);

    validConfig = true;
  }

  return finalConfig;
}

async function configureSelectedAIService(finalConfig) {
  switch (finalConfig.aiService) {
    case "Ollama":
      return await promptOllamaConfig(
        finalConfig.ollamaUrl,
        finalConfig.ollamaModel,
      );
    case "ChatGPT":
      return await promptChatGPTConfig(
        finalConfig.chatgptApiKey,
        finalConfig.chatgptModel,
      );
    case "Continue":
      return {
        continueModel: await promptContinueModel(finalConfig.continueModel),
      };
    default:
      console.error("Unknown AI service selected.");
      return null;
  }
}

export { configure, loadConfig, saveConfig };
