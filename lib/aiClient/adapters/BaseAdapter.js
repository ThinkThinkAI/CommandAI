import CommandPrompt from "../../prompts/CommandPrompt.js";
import QueryPrompt from "../../prompts/QueryPrompt.js";
import Logger from "../../../lib/logger.js";
const logger = new Logger("command");

class BaseAdapter {
  constructor(config) {
    this.model = config.model;

    this.logger = logger;
    this.messages = [];
  }

  async generateQuery(request, dbAdapter) {
    if (this.messages.length == 0) {
      const formatedPrompt = await this.formatQueryPrompt(dbAdapter);

      this.messages.push({
        role: "system",
        content: formatedPrompt,
      });
    }

    const response = await this.generateResponse(request);

    return this.massage(response);
  }

  async generateScript(command) {
    try {
      if (this.messages.length > 0) {
        const response = await this.generateResponse(
          "Try a differnt solution.",
        );

        return this.massage(response);
      } else {
        const formatedPrompt = await this.formatCommandPrompt(command);
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

    const codeBlockMatch = response.match(
      /```(?:json|sql)?\s*([\s\S]*?)\s*```/,
    );
    if (codeBlockMatch && this.isJsonString(codeBlockMatch[1])) {
      return codeBlockMatch[1].trim();
    }

    return response;
  }

  async formatCommandPrompt(command) {
    const commandPrompt = new CommandPrompt(this.model);
    return await commandPrompt.out(command);
  }

  async formatQueryPrompt(dbAdapter) {
    const queryPrompt = new QueryPrompt(this.model, dbAdapter);
    return await queryPrompt.out();
  }
}

export default BaseAdapter;
