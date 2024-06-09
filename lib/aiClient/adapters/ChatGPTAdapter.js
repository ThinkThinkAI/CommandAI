import OpenAI from "openai";
import BaseAdapter from "./BaseAdapter.js";

class ChatGPTAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.chatgptApiKey;
    this.model = config.chatgptModel;
  }

  async generateScript(command) {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    try {
      const response = await openai.chat.completions.create({
        messages: [{ role: "user", content: this.formatPrompt(command) }],
        model: this.model,
      });

      let content = response.choices[0].message.content;

      this.logger.info(`SERVER RESPONSE ${content}`);

      return this.massage(content);
    } catch (error) {
      throw new Error("Failed to generate script: " + error.message);
    }
  }
}

export default ChatGPTAdapter;