import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

export function createGetUrlTool(manager: StagehandSessionManager) {
  return tool({
    description: "Get the current URL for the active browser page.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        return await manager.runWithStagehand(async (stagehand) => {
          const page = await stagehand.context.awaitActivePage();
          const title = await page.title().catch(() => undefined);

          return {
            url: page.url(),
            title
          };
        });
      } catch (error) {
        throw wrapToolError("get the current URL", error);
      }
    }
  });
}
