import { Ollama } from "ollama";
import AIClient from "./aiClient.js";

class OllamaClient extends AIClient {
  constructor(baseURL, model, prompt) {
    super(prompt);
    this.baseURL = baseURL;
    this.model = model;
  }

  async generateScript(command) {
    try {
      const ollama = new Ollama({ host: this.baseURL });
      
      
      const response = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: this.formatPrompt(command) }],
      });

      return response.message.content;
    } catch (error) {
      throw new Error("Failed to generate script: " + error.message);
    }
  }
}

export default OllamaClient;
