import PromptFormatter from "./PromptFormatter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Logger from "../../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Prompt {
  constructor(task, model_name) {
    this.task = task;
    this.model_name = model_name;
    this.logger = new Logger(task);

    this.modelTemplatePath = path.join(
      __dirname,
      `../../prompts/${task}/${model_name}.hbs`
    );
    this.defaultTemplatePath = path.join(
      __dirname,
      `../../prompts/${task}/default.hbs`
    );

    this.loadAppropriateTemplate();
  }

  templateExists(filePath) {
    return fs.existsSync(filePath);
  }

  loadAppropriateTemplate() {
    if (this.templateExists(this.modelTemplatePath)) {
      this.promptFormatter = new PromptFormatter(this.modelTemplatePath);
      this.logger.info(`Prompt Template: ${this.modelTemplatePath}`);
    } else if (this.templateExists(this.defaultTemplatePath)) {
      this.promptFormatter = new PromptFormatter(this.defaultTemplatePath);
      this.logger.info(`Prompt Template: ${this.defaultTemplatePath}`);
    } else {
      this.logger.error(`No template found for task: ${this.task}`);
      throw new Error(`No template found for task: ${this.task}`);
    }
  }

  async out(context) {
    const prompt = await this.promptFormatter.format(context);
    this.logger.info(`PROMPT: ${prompt}`);
    return await this.promptFormatter.format(context);
  }
}

export default Prompt;
