import { Ollama } from "ollama";

async function generateScript(prompt, ollamaUrl, ollamaModel) {
  try {
    const ollama = new Ollama({ host: ollamaUrl });
    const response = await ollama.chat({
      model: ollamaModel,
      messages: [{ role: "user", content: prompt }],
    });

    return response.message.content;
  } catch (error) {
    throw new Error("Failed to generate script: " + error.message);
  }
}

export { generateScript };
