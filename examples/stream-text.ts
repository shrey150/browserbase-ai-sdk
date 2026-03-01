import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "openai/gpt-4.1"
    }
  });

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    tools: browserbase.tools,
    maxSteps: 10,
    prompt: "Navigate to https://example.com and describe what you see."
  });

  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }

  process.stdout.write("\n");
  await browserbase.closeSession();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
