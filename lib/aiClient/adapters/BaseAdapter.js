import CommandPrompt from "../../prompts/CommandPrompt.js";
import Logger from "../../../lib/logger.js";
const logger = new Logger("command");

class BaseAdapter {
  constructor(config) {
    this.commandPrompt = new CommandPrompt(config.model);

    this.logger = logger;
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
