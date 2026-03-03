import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const deterministicActionSchema = z.object({
  selector: z.string().min(1),
  description: z.string().min(1),
  method: z.string().min(1),
  arguments: z.array(z.string()).optional()
});

const actSchema = z
  .object({
    action: z.string().min(1).optional(),
    // Backward-compatible alias for prior versions.
    instruction: z.string().min(1).optional(),
    // Advanced deterministic path for callers who already resolved a target.
    deterministicAction: deterministicActionSchema.optional(),
    timeoutMs: z.number().int().positive().optional(),
    variables: z.record(z.string(), z.unknown()).optional()
  })
  .refine(
    (value) =>
      [value.action, value.instruction, value.deterministicAction].filter(Boolean).length === 1,
    {
      message: "Provide exactly one of `action`, `instruction`, or `deterministicAction`."
    }
  );

export function createActTool(manager: StagehandSessionManager) {
  return tool({
    description:
      "Perform a single action on the active page. Use `action` (natural language) by default, `instruction` as a compatibility alias, or `deterministicAction` for selector/method execution.",
    inputSchema: actSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand((stagehand) => {
          const options = {
            timeout: input.timeoutMs,
            variables: input.variables as any
          };

          if (input.deterministicAction) {
            return stagehand.act(input.deterministicAction, options);
          }

          const command = input.action ?? input.instruction;
          return stagehand.act(command as string, options);
        });
      } catch (error) {
        throw wrapToolError("run an act command", error);
      }
    }
  });
}
