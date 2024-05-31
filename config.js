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

const defaultConfig = {
  aiService: "",
  ollamaUrl: "",
  ollamaModel: "",
  chatgptApiKey: "",
  chatgptModel: "",
  showExecutionDescription: true,
  showExecutionPlan: true,
  enableLogging: false,
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
    //console.error("Failed to validate API key:", error.message);
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
    const ollama = new Ollama(url);
    await ollama.list();
    return true;
  } catch (error) {
    console.error("Failed to connect to Ollama server:", error.message);
    return false;
  }
}

async function fetchOllamaModels(url) {
  try {
    const ollama = new Ollama(url);
    const response = await ollama.list();

    return response.models.map((model) => model.name);
  } catch (error) {
    console.error("Failed to fetch models from Ollama server:", error.message);
    return [];
  }
}

async function configure() {
  let validConfig = false;
  let finalConfig = { ...defaultConfig };

  while (!validConfig) {
    const aiService = await inquirer.prompt([
      {
        type: "list",
        name: "aiService",
        message: "Select the AI service:",
        choices: ["Ollama", "ChatGPT"],
      },
    ]);

    finalConfig.aiService = aiService.aiService;

    if (aiService.aiService === "Ollama") {
      const ollamaConfig = await inquirer.prompt([
        {
          type: "input",
          name: "ollamaUrl",
          message: "Enter the URL for the Ollama server:",
        },
      ]);

      const isValidUrl = await validateOllamaUrl(ollamaConfig.ollamaUrl);
      if (!isValidUrl) {
        console.error("Invalid Ollama server URL. Please try again.");
        continue;
      }

      const models = await fetchOllamaModels(ollamaConfig.ollamaUrl);
      if (models.length === 0) {
        console.error(
          "Failed to fetch models from Ollama server. Please try again."
        );
        continue;
      }

      const modelSelection = await inquirer.prompt([
        {
          type: "list",
          name: "ollamaModel",
          message: "Select the model to use for Ollama:",
          choices: models,
        },
      ]);

      finalConfig.ollamaUrl = ollamaConfig.ollamaUrl;
      finalConfig.ollamaModel = modelSelection.ollamaModel;
      validConfig = true;
    } else {
      const chatGPTConfig = await inquirer.prompt([
        {
          type: "input",
          name: "chatgptApiKey",
          message: "Enter the API key for ChatGPT:",
        },
      ]);

      const isValidApiKey = await validateApiKey(chatGPTConfig.chatgptApiKey);
      if (!isValidApiKey) {
        console.log();
        console.log(
          "Invalid ChatGPT API key. You can find your API key at https://platform.openai.com/account/api-keys "
        );
        console.log();
        continue;
      }

      const models = await fetchChatGPTModels(chatGPTConfig.chatgptApiKey);
      if (models.length === 0) {
        console.log();
        console.log("Failed to fetch models from ChatGPT. Please try again.");
        console.log();
        continue;
      }

      const modelSelection = await inquirer.prompt([
        {
          type: "list",
          name: "chatgptModel",
          message: "Select the model to use for ChatGPT:",
          choices: models.sort(),
          default: defaultChatGPTModel,
        },
      ]);

      finalConfig.chatgptApiKey = chatGPTConfig.chatgptApiKey;
      finalConfig.chatgptModel = modelSelection.chatgptModel;
      validConfig = true;
    }
  }

  await saveConfig(finalConfig);

  return finalConfig;
}

export { loadConfig, saveConfig, configure, configPath, defaultConfig };
