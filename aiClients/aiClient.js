import os from "os";
import logger from "../util/logger.js";

class AIClient {
  constructor(prompt) {
    this.prompt = prompt;
    this.osType = os.type();
    this.osVersion = os.release();
    this.cwd = process.cwd();
    this.shell = process.env.SHELL || "unknown shell";
    this.user = process.env.USER || "unknown user";
    this.logger = logger;

    this.logger.info(
      `AIClient initialized with user: ${this.user}, shell: ${this.shell}, OS: ${this.osType} ${this.osVersion}`
    );

    this.hasRootPermissions = this.checkRootPermissions();
  }

  checkRootPermissions() {
    try {
      return process.getuid && process.getuid() === 0;
    } catch (err) {
      return false;
    }
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

  formatPrompt(command) {
    return `I am at a command line on ${this.osType} (version ${
      this.osVersion
    }), using ${this.shell} shell, and logged in as ${
      this.user
    } in the directory '${this.cwd}'. 
    ${
      this.hasRootPermissions
        ? "I have root permissions."
        : "I do not have root permissions."
    }
    
    I would like to do the following: ${command}
    
    Format your response in the following JSON format. Only return the JSON object.
    1. Structure: The JSON is an array of objects. Each object represents a step in the process.
    2. Command Execution: Each object can have a "cmd" field, which contains a command to be executed in the terminal.
    3. File Creation: Each object can also have a "file" field. The "file" field contains an object with two properties:
    - "name": The name of the file to be created, including a path if necessary (defaults to the same directory).
    - "data": The content to be written into the file.
    4. Comments: Each object can have a "comment" field that provides a description or explanation of the step.
    5. Order: The steps are executed in the order they appear in the array, from top to bottom.
    `;
  }
}

export default AIClient;
