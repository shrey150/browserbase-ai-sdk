import { ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "google/gemini-3-flash-preview"
    }
  });

  const agent = new ToolLoopAgent({
    model: google("gemini-2.5-flash"),
    tools: browserbase.tools,
    maxSteps: 10
  });

  const result = await agent.generate("Open https://example.com and summarize it.");
  console.log(result.text);

  await browserbase.closeSession();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
