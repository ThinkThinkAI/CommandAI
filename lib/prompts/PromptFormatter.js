import Handlebars from "handlebars";
import { promises as fs } from "fs";

class PromptFormatter {
  constructor(templatePath) {
    this.templatePath = templatePath;
    this.template = null;
  }

  async loadTemplate() {
    try {
      const templateContent = await fs.readFile(this.templatePath, "utf-8");
      this.template = Handlebars.compile(
        templateContent.trim().replace(/\s\s+/g, " "),
      );
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  async format(context) {
    if (!this.template) {
      await this.loadTemplate();
    }
    return this.template(context);
  }
}

export default PromptFormatter;
