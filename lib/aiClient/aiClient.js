import OllamaAdapter from "./adapters/OllamaAdapter.js";
import ChatGPTAdapter from "./adapters/ChatGPTAdapter.js";

class AIClient {
  constructor(config) {
    this.adapter =
      config.aiService === "ChatGPT"
        ? new ChatGPTAdapter(config)
        : new OllamaAdapter(config);
  }

  let;

  async generateScript(command) {
    return await this.adapter.generateScript(command);
  }
}

export default AIClient;
