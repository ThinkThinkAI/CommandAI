import { Ollama } from "ollama";
import BaseAdapter from "./BaseAdapter.js";

class OllamaAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.baseURL = config.ollamaUrl;
    this.model = config.ollamaModel;
  } 

  async generateScript(command) {
    try {
      const ollama = new Ollama({ host: this.baseURL });

      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: await this.formatPrompt(command) }],
      });

      this.logger.info(`SERVER RESPONSE ${response.message.content}`);

      return this.massage(response.message.content);
    } catch (error) {
      throw new Error("Failed to generate script: " + error.message);
    }
  }
}

export default OllamaAdapter;
