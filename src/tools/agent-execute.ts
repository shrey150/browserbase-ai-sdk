import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const agentExecuteSchema = z.object({
  instruction: z.string().min(1),
  maxSteps: z.number().int().positive().optional(),
  highlightCursor: z.boolean().optional()
});

export function createAgentExecuteTool(manager: StagehandSessionManager) {
  return tool({
    description: "Execute a Stagehand agent run against the active session.",
    inputSchema: agentExecuteSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand(async (stagehand) => {
          const agent = stagehand.agent();
          return agent.execute({
            instruction: input.instruction,
            maxSteps: input.maxSteps,
            highlightCursor: input.highlightCursor
          });
        });
      } catch (error) {
        throw wrapToolError("execute an agent instruction", error);
      }
    }
  });
}
