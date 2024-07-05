import { Ollama } from "ollama";
import BaseAdapter from "./BaseAdapter.js";

class OllamaAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.baseURL = config.ollamaUrl;
    this.model = config.ollamaModel;
  }

  async generateResponse(command) {
    try {
      const ollama = new Ollama({ host: this.baseURL });

      this.messages.push({ role: "user", content: command });

      const response = await ollama.chat({
        model: this.model,
        messages: this.messages,
      });

      this.messages.push(response.message);

      this.logger.info(`SERVER RESPONSE ${response.message.content}`);

      return response.message.content;
    } catch (error) {
      this.logger.error("Failed to chat: " + error.message);
    }
  }
}

export default OllamaAdapter;
