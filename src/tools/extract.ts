import { tool } from "ai";
import { z } from "zod";
import { jsonSchemaToZod } from "@browserbasehq/stagehand";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const jsonSchemaNode: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
      format: z.string().optional(),
      enum: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      required: z.array(z.string()).optional(),
      properties: z.record(z.string(), jsonSchemaNode).optional(),
      items: jsonSchemaNode.optional()
    })
    .passthrough()
);

const extractSchema = z.object({
  instruction: z.string().min(1),
  schema: jsonSchemaNode.optional(),
  timeoutMs: z.number().int().positive().optional(),
  selector: z.string().optional()
});

export function createExtractTool(manager: StagehandSessionManager) {
  return tool({
    description:
      "Extract data from the active page using a natural-language instruction. Optionally provide a JSON schema for structured extraction.",
    inputSchema: extractSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand((stagehand) => {
          const options = {
            timeout: input.timeoutMs,
            selector: input.selector
          };

          if (input.schema) {
            const zodSchema = jsonSchemaToZod(input.schema);
            return stagehand.extract(input.instruction, zodSchema as any, options);
          }

          return stagehand.extract(input.instruction, options);
        });
      } catch (error) {
        throw wrapToolError("extract data", error);
      }
    }
  });
}
