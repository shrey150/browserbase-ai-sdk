import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "google/gemini-3-flash-preview"
    }
  });

  const result = await generateText({
    model: google("gemini-2.5-flash"),
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
