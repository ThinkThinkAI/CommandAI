import os from "os";
import logger from "../util/logger.js";
import OllamaAdapter from "./adapters/OllamaAdapter.js";
import ChatGPTAdapter from "./adapters/ChatGPTAdapter.js";

class AIClient {
  constructor(config) {
    this.adapter = config.aiService === "ChatGPT" ? new ChatGPTAdapter() : new OllamaAdapter();
  }


  async generateScript(command) {
    this.adapter.generateScript(command);
  }
}

export default AIClient;
