import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

export function createSessionCloseTool(manager: StagehandSessionManager) {
  return tool({
    description: "Close the active Browserbase Stagehand session.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        await manager.closeSession();
        return { closed: true };
      } catch (error) {
        throw wrapToolError("close the browser session", error);
      }
    }
  });
}
