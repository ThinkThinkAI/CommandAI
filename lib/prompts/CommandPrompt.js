import Prompt from "./Prompt.js";
import os from "os";

class CommandPrompt extends Prompt {
  constructor(model_name) {
    super("command", model_name);
  }

  checkRootPermissions() {
    try {
      return process.getuid && process.getuid() === 0;
    } catch (err) {
      return false;
    }
  }

  context(command) {
    return {
      osType: os.type(),
      osVersion: os.release(),
      cwd: process.cwd(),
      shell: process.env.SHELL || "unknown shell",
      user: process.env.USER || "unknown user",
      hasRootPermissions: this.checkRootPermissions(),
      command: command,
    };
  }

  async out(command) {
    return await super.out(this.context(command));
  }
}

export default CommandPrompt;
