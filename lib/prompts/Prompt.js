import PromptFormatter from "./PromptFormatter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Prompt {
  constructor(task, model_name) {
    this.task = task;
    this.model_name = model_name;

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
    } else if (this.templateExists(this.defaultTemplatePath)) {
      this.promptFormatter = new PromptFormatter(this.defaultTemplatePath);
    } else {
      throw new Error(`No template found for task: ${this.task}`);
    }
  }

  async out(context) {
    return await this.promptFormatter.format(context);
  }
}

export default Prompt;
