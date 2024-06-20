import OllamaAdapter from "./adapters/OllamaAdapter.js";
import ChatGPTAdapter from "./adapters/ChatGPTAdapter.js";
import ContinueAdapter from "./adapters/ContinueAdapter.js";

class AIClient {
  constructor(config) {
    this.adapter =
      config.aiService === "ChatGPT"
        ? new ChatGPTAdapter(config)
        : config.aiService === "Continue"
          ? new ContinueAdapter(config)
          : new OllamaAdapter(config);
  }

  async generateScript(command) {
    return await this.adapter.generateScript(command);
  }

  async generateResponse(command) {
    return await this.adapter.generateResponse(command);
  }
}

export default AIClient;
