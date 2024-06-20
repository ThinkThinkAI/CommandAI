import { continueChat } from "../../continue/continue.js";
import BaseAdapter from "./BaseAdapter.js";

class ContinueAdapter extends BaseAdapter {
  constructor(config) {
    super(config);

    this.model = config.continueModel;
  }

  async generateResponse(command) {
    try {
      this.messages.push({ role: "user", content: command });

      let data = {
        title: this.model,
        messages: this.messages,
        completionOptions: {},
      };

      const response = await continueChat(data);
      const message = { role: "assistant", content: response };
      this.messages.push(message);

      this.logger.info(`SERVER RESPONSE ${message.content}`);

      return message.content;
    } catch (error) {
      this.logger.error("Failed to chat: " + error.message);
    }
  }
}

export default ContinueAdapter;
