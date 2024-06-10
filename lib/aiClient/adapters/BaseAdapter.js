import os from "os";
import logger from "../../logger.js";
import CommandPrompt from "../../prompts/CommandPrompt.js";

class BaseAdapter {
  constructor(config) {
    this.commandPrompt =
      config.aiService === "ChatGPT"
        ? new CommandPrompt(config.chatgptModel)
        : new CommandPrompt(config.ollamaModel);

    this.logger = logger;
    this.logger.info(
      `AIClient initialized with user: ${this.user}, shell: ${this.shell}, OS: ${this.osType} ${this.osVersion}`
    );
  }

  async generateScript(command) {
    throw new Error("generateScript() must be implemented in derived classes.");
  }

  isJsonString(str) {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === "object" && parsed !== null;
    } catch {
      return false;
    }
  }

  massage(response) {
    if (this.isJsonString(response)) {
      return response;
    }

    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && this.isJsonString(jsonMatch[1])) {
      return jsonMatch[1].trim();
    }

    return response;
  }

  async formatPrompt(command) {
    return await this.commandPrompt.out(command);
  }
}

export default BaseAdapter;
