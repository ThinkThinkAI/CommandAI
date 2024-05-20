import OpenAI from "openai";

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
