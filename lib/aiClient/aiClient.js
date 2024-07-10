import OllamaAdapter from "./adapters/OllamaAdapter.js";
import OpenAIAdapter from "./adapters/OpenAIAdapter.js";

class AIClient {
  constructor(config) {
    this.adapter =
      config.aiService === "ChatGPT" || "OpenAI"
        ? new OpenAIAdapter(config)
        : new OllamaAdapter(config);
  }

  async generateQuery(request, dbAdapter) {
    return await this.adapter.generateQuery(request, dbAdapter);
  }

  async generateScript(command) {
    return await this.adapter.generateScript(command);
  }

  async generateResponse(command) {
    return await this.adapter.generateResponse(command);
  }
}

export default AIClient;
