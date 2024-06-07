import { Ollama } from "ollama";
import BaseAdapter from "./BaseAdapter.js";

class OllamaAdapter extends BaseAdapter {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.model = config.model;
  }

  async generateScript(command) {
    try {
      const ollama = new Ollama({ host: this.baseURL });

      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: this.formatPrompt(command) }],
      });

      this.logger.info(`SERVER RESPONSE ${response.message.content}`);

      return this.massage(response.message.content);
    } catch (error) {
      throw new Error("Failed to generate script: " + error.message);
    }
  }
}

export default OllamaAdapter;
