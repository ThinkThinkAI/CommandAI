import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import os from "os";
import { OpenAI } from "openai";
import { Ollama } from "ollama";
import gradient from "gradient-string";

const configPath = path.join(os.homedir(), ".commandai", "config.json");
const defaultChatGPTModel = "gpt-4o";
const defaultChatGPTApiUrl = "https://api.openai.com/v1";
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
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath);
    const config = JSON.parse(configFile);
    config.model =
      config.aiService === "Ollama" ? config.ollamaModel : config.chatgptModel;
    return config;
  } else {
    return null;
  }
}

async function saveConfig(config) {
  config.model =
    config.aiService === "Ollama" ? config.ollamaModel : config.chatgptModel;
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log();
  console.log(gradient.cristal(`Config saved successfully at: ${configPath}`));
  console.log();
}

async function validateApiKey(apiKey, chatgptApiUrl) {
  try {
    const openai = new OpenAI({ baseURL: chatgptApiUrl, apiKey: apiKey });
    await openai.models.list();
    return true;
  } catch (error) {
    console.error("Invalid API key:", error.message);
    return false;
  }
}

async function fetchChatGPTModels(apiKey, chatgptApiUrl) {
  try {
    const openai = new OpenAI({ baseURL: chatgptApiUrl, apiKey: apiKey });
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
    ollamaModel: ollamaModel,
  };
}

async function promptChatGPTAPIKey(defaultApiKey, chatgptApiUrl) {
  const chatgptConfig = await inquirer.prompt([
    {
      type: "input",
      name: "chatgptApiKey",
      message: "Enter your OpenAI API key:",
      default: defaultApiKey,
    },
  ]);

  const isValidApiKey = await validateApiKey(chatgptConfig.chatgptApiKey, chatgptApiUrl);

  if (!isValidApiKey) {
    return null;
  }

  return chatgptConfig;
}


async function promptChatGPTModels(defaultModel, chatgptApiUrl) {
  const models = await fetchChatGPTModels(chatgptApiUrl);

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

async function promptChatGPTURL(defaultUrl) {
  const chatgptApiUrl = await inquirer.prompt([
    {
      type: "input",
      name: "chatgptApiUrl",
      message: "Enter the URL for the Ollama server:",
      default: defaultUrl,
    },
  ]);

  return chatgptApiUrl;
}

async function promptChatGPTConfig(config) {
  let chatgptApiUrl = { chatgptApiUrl: config.chatgptApiUrl || defaultChatGPTApiUrl };

  if (config.aiService === "OpenAI") {
    chatgptApiUrl = await promptChatGPTURL(config.chatgptApiUrl);
    if (!chatgptApiUrl) return null;
  } 

  const chatgptConfig = await promptChatGPTAPIKey(config.chatgptApiKey, chatgptApiUrl.chatgptApiUrl);

  if (!chatgptConfig) return null;

  const chatgptModel = await promptChatGPTModels(config.chatgptModel, chatgptApiUrl.chatgptApiUrl);

  if (!chatgptModel) return null;

  if (chatgptApiUrl) {
    return {
      chatgptApiKey: chatgptConfig.chatgptApiKey,
      chatgptModel: chatgptModel.chatgptModel,
      chatgptApiUrl: chatgptApiUrl.chatgptApiUrl,
    };
  } else {
    return {
      chatgptApiKey: chatgptConfig.chatgptApiKey,
      chatgptModel: chatgptModel.chatgptModel,
    };
  }
}

async function getAIServiceChoices() {
  const isOllamaActive = await checkOllamaActive();
  return [
    { name: isOllamaActive ? "Ollama (Running)" : "Ollama", value: "Ollama" },
    { name: "ChatGPT", value: "ChatGPT" },
    { name: "OpenAI", value: "OpenAI" },
  ];
}

async function configure(
  defaultConfig = {
    aiService: "",
    ollamaUrl: defaultOllamaUrl,
    ollamaModel: "",
    chatgptApiKey: "",
    chatgptModel: defaultChatGPTModel,
    chatgptApiUrl: defaultChatGPTApiUrl,
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

    finalConfig.model =
      finalConfig.aiService === "Ollama"
        ? finalConfig.ollamaModel
        : finalConfig.chatgptModel;

    validConfig = true;
  }

  return finalConfig;
}

async function configureSelectedAIService(finalConfig) {
  if (finalConfig.aiService === "Ollama") {
    return await configureOllamaService(finalConfig);
  } else if (finalConfig.aiService === "ChatGPT") {
    return await configureChatGPTService(finalConfig);
  } else if (finalConfig.aiService === "OpenAI") {
    return await configureChatGPTService(finalConfig);
  }
  return null;
}

async function configureOllamaService(finalConfig) {
  const ollamaConfig = await promptOllamaConfig(
    finalConfig.ollamaUrl,
    finalConfig.ollamaModel,
  );
  if (!ollamaConfig) return null;

  return {
    ollamaUrl: ollamaConfig.ollamaUrl,
    ollamaModel: ollamaConfig.ollamaModel,
  };
}

async function configureChatGPTService(finalConfig) {
  const chatgptConfig = await promptChatGPTConfig(finalConfig);
  if (!chatgptConfig) return null;

  if (finalConfig.aiService === "OpenAI") {
    return {
      chatgptApiKey: chatgptConfig.chatgptApiKey,
      chatgptModel: chatgptConfig.chatgptModel,
      chatgptApiUrl: chatgptConfig.chatgptApiUrl,
    };
  } else {
    return {
      chatgptApiKey: chatgptConfig.chatgptApiKey,
      chatgptModel: chatgptConfig.chatgptModel,
    };
  }
}

export { loadConfig, saveConfig, configure };
