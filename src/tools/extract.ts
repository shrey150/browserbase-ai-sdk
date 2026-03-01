import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const extractSchema = z.object({
  instruction: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
  selector: z.string().optional()
});

export function createExtractTool(manager: StagehandSessionManager) {
  return tool({
    description: "Extract data from the active page using a natural-language instruction.",
    inputSchema: extractSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand((stagehand) =>
          stagehand.extract(input.instruction, {
            timeout: input.timeoutMs,
            selector: input.selector
          })
        );
      } catch (error) {
        throw wrapToolError("extract data", error);
      }
    }
  });
}
