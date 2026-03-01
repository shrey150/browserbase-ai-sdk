import { ToolLoopAgent } from "ai";
import { openai } from "@ai-sdk/openai";
import { createBrowserbaseTools } from "../src/index.js";

async function main(): Promise<void> {
  const browserbase = createBrowserbaseTools({
    stagehand: {
      model: "openai/gpt-4.1"
    }
  });

  const agent = new ToolLoopAgent({
    model: openai("gpt-4.1-mini"),
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
