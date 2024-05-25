import OpenAI from "openai";
import AIClient from "./aiClient.js";


class ChatGPTClient extends AIClient {
  constructor(apiKey, model, prompt) {
    super(prompt);
    this.apiKey = apiKey;
    this.model = model;
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

      content = content.split("\n");
      content = content.slice(1);
      content.pop();
      content = content.join("\n");

      return content;
    } catch (error) {
      throw new Error("Failed to generate script: " + error.message);
    }
  }
}

export default ChatGPTClient;

async function generateScript(prompt, apiKey, model) {
  const openai = new OpenAI({
    apiKey: apiKey, 
  });

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });

    let content = response.choices[0].message.content;
    
    content = content.split("\n");
    content = content.slice(1);
    content.pop();
    content =content.join("\n");

    return content;
  } catch (error) {
    throw new Error("Failed to generate script: " + error.message);
  }
}

export { generateScript };
