import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const actSchema = z.object({
  instruction: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
  variables: z.record(z.string(), z.unknown()).optional()
});

export function createActTool(manager: StagehandSessionManager) {
  return tool({
    description: "Run a Stagehand act instruction against the active browser page.",
    inputSchema: actSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand((stagehand) =>
          stagehand.act(input.instruction, {
            timeout: input.timeoutMs,
            variables: input.variables as any
          })
        );
      } catch (error) {
        throw wrapToolError("run an act instruction", error);
      }
    }
  });
}
