import os from "os";

class AIClient {
  constructor(prompt) {
    this.prompt = prompt;
    this.osType = os.type(); // Get the operating system type
  }

  async generateScript(command) {
    throw new Error("generateScript() must be implemented in derived classes.");
  }

  formatPrompt(command) {
    return `I am at a command line on ${this.osType}. I need you to do the following ${command}  
  Format your response in the following json format. only return the json object.
    1. Structure: The JSON is an array of objects. Each object represents a step in the process.
    2. Command Execution: Each object can have a "cmd" field, which contains a command to be executed in the terminal.
    3. File Creation: Each object can also have a "file" field. The "file" field contains an object with two properties:
    • "name": The name of the file to be created, including a path if necessary (defaults to same directory)
    • "data": The content to be written into the file.
    4. Comments: Each object can have a "comment" field that provides a description or explanation of the step.
    5. Order: The steps are executed in the order they appear in the array, from top to bottom.
    `;
  }
}

export default AIClient;
