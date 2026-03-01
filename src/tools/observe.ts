import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const observeSchema = z.object({
  instruction: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
  selector: z.string().optional()
});

export function createObserveTool(manager: StagehandSessionManager) {
  return tool({
    description: "Observe the active page and return suggested browser actions.",
    inputSchema: observeSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand(async (stagehand) => {
          const options = {
            timeout: input.timeoutMs,
            selector: input.selector
          };

          if (input.instruction) {
            return stagehand.observe(input.instruction, options);
          }

          if (input.timeoutMs || input.selector) {
            return stagehand.observe(options);
          }

          return stagehand.observe();
        });
      } catch (error) {
        throw wrapToolError("observe the page", error);
      }
    }
  });
}
