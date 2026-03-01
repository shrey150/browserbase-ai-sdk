import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

export function createSessionStartTool(manager: StagehandSessionManager) {
  return tool({
    description: "Start or initialize a Browserbase Stagehand session.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const session = await manager.startSession();
        return {
          started: true,
          ...session
        };
      } catch (error) {
        throw wrapToolError("start a browser session", error);
      }
    }
  });
}
