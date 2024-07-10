import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import os from "os";
import { OpenAI } from "openai";
import { Ollama } from "ollama";
import gradient from "gradient-string";

const configPath = path.join(os.homedir(), ".commandai", "config.json");
const defaultOpenAIModel = "gpt-4o";
const defaultOpenAIApiUrl = "https://api.openai.com/v1";
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

    if (!config.openAIApiUrl) {
      config.openAIApiUrl = config.chatgptApiUrl;
     
      delete config.chatgptApiUrl;
    }

    if (!config.openAIModel) {
      config.openAIModel = config.chatgptModel;
     
      delete config.chatgptModel;
    }

    if (!config.openAIApiKey) {
      config.openAIApiKey = config.chatgptApiKey;
     
      delete config.chatgptApiKey;
    }

    config.model =
      config.aiService === "Ollama" ? config.ollamaModel : config.openAIModel;

    if (config.aiService === "ChatGPT") {
      config.openAIApiUrl = defaultOpenAIApiUrl;
    }

    return config;
  } else {
    return null;
  }
}

async function saveConfig(config) {
  config.model =
    config.aiService === "Ollama" ? config.ollamaModel : config.openAIModel;
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log();
  console.log(gradient.cristal(`Config saved successfully at: ${configPath}`));
  console.log();
}

async function validateApiKey(apiKey, openAIApiUrl) {
  try {
    const openai = new OpenAI({ baseURL: openAIApiUrl, apiKey: apiKey });
    await openai.models.list();
    return true;
  } catch (error) {
    console.error("Invalid API key:", error.message);
    return false;
  }
}

async function fetchOpenAIModels(openAIApiUrl, apiKey) {
  try {
    const openai = new OpenAI({ baseURL: openAIApiUrl, apiKey: apiKey });
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

async function promptOpenAIAPIKey(defaultApiKey, openAIApiUrl) {
  const openAIConfig = await inquirer.prompt([
    {
      type: "input",
      name: "openAIApiKey",
      message: "Enter your OpenAI API key:",
      default: defaultApiKey,
    },
  ]);

  const isValidApiKey = await validateApiKey(openAIConfig.openAIApiKey, openAIApiUrl);

  if (!isValidApiKey) {
    return null;
  }

  return openAIConfig;
}


async function promptOpenAIModels(defaultModel, openAIApiUrl, openAIApiKey) {
  const models = await fetchOpenAIModels(openAIApiUrl, openAIApiKey);

  if (models.length === 0) {
    console.error(
      "No models found for the provided API key. Please try again.",
    );
    return null;
  }

  const openAIModel = await inquirer.prompt([
    {
      type: "list",
      name: "openAIModel",
      message: "Select the OpenAI model:",
      choices: models,
      default: defaultModel,
    },
  ]);

  return openAIModel;
}

async function promptOpenAIURL(defaultUrl) {
  const openAIApiUrl = await inquirer.prompt([
    {
      type: "input",
      name: "openAIApiUrl",
      message: "Enter the URL for the OpenAI server:",
      default: defaultUrl,
    },
  ]);

  return openAIApiUrl;
}

async function promptOpenAIConfig(config) {
  let openAIApiUrl = { openAIApiUrl: config.openAIApiUrl || defaultOpenAIApiUrl };

  if (config.aiService === "OpenAI") {
    openAIApiUrl = await promptOpenAIURL(config.openAIApiUrl);
    if (!openAIApiUrl) return null;
  } else {
    openAIApiUrl = { openAIApiUrl: defaultOpenAIApiUrl };
  } 

  const openAIConfig = await promptOpenAIAPIKey(config.openAIApiKey, openAIApiUrl.openAIApiUrl);

  if (!openAIConfig) return null;

  const openAIModel = await promptOpenAIModels(config.openAIModel, openAIApiUrl.openAIApiUrl, config.openAIApiKey);

  if (!openAIModel) return null;

  if (openAIApiUrl) {
    return {
      openAIApiKey: openAIConfig.openAIApiKey,
      openAIModel: openAIModel.openAIModel,
      openAIApiUrl: openAIApiUrl.openAIApiUrl,
    };
  } else {
    return {
      openAIApiKey: openAIConfig.openAIApiKey,
      openAIModel: openAIModel.openAIModel,
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
    openAIApiKey: "",
    openAIModel: defaultOpenAIModel,
    openAIApiUrl: defaultOpenAIApiUrl,
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
        : finalConfig.openAIModel;

    validConfig = true;
  }

  return finalConfig;
}

async function configureSelectedAIService(finalConfig) {
  if (finalConfig.aiService === "Ollama") {
    return await configureOllamaService(finalConfig);
  } else if (finalConfig.aiService === "ChatGPT") {
    return await configureOpenAIService(finalConfig);
  } else if (finalConfig.aiService === "OpenAI") {
    return await configureOpenAIService(finalConfig);
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

async function configureOpenAIService(finalConfig) {
  const openAIConfig = await promptOpenAIConfig(finalConfig);
  if (!openAIConfig) return null;

  if (finalConfig.aiService === "OpenAI") {
    return {
      openAIApiKey: openAIConfig.openAIApiKey,
      openAIModel: openAIConfig.openAIModel,
      openAIApiUrl: openAIConfig.openAIApiUrl,
    };
  } else {
    return {
      openAIApiKey: openAIConfig.openAIApiKey,
      openAIModel: openAIConfig.openAIModel,
    };
  }
}

export { loadConfig, saveConfig, configure };
