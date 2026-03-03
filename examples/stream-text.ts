import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "google/gemini-3-flash-preview"
    }
  });

  const result = streamText({
    model: google("gemini-2.5-flash"),
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
