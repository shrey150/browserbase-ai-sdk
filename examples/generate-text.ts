import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "openai/gpt-4.1"
    }
  });

  const result = await generateText({
    model: openai("gpt-4.1-mini"),
    tools: browserbase.tools,
    maxSteps: 10,
    prompt: "Open https://example.com and summarize the page."
  });

  console.log(result.text);
  await browserbase.closeSession();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
