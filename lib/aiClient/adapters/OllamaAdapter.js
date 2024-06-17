import { Ollama } from "ollama";
import BaseAdapter from "./BaseAdapter.js";

class OllamaAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.baseURL = config.ollamaUrl;
    this.model = config.ollamaModel;
    this.messages = [];
  }

  async generateScript(command) {
    try {
      if (this.messages.length > 0) {
        const response = await this.generateResponse(
          "Try a differnt solution.",
        );

        return this.massage(response);
      } else {
        const formatedPrompt = await this.formatPrompt(command);
        const response = await this.generateResponse(formatedPrompt);

        return this.massage(response);
      }
    } catch (error) {
      this.logger.error("Failed to generate script: " + error.message);
    }
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
