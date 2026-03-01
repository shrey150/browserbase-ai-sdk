import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const screenshotSchema = z.object({
  fullPage: z.boolean().optional(),
  type: z.enum(["png", "jpeg"]).optional(),
  quality: z.number().int().min(1).max(100).optional()
});

const MIME_TYPE_BY_FORMAT: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg"
};

export function createScreenshotTool(manager: StagehandSessionManager) {
  return tool({
    description: "Capture a screenshot of the active browser page.",
    inputSchema: screenshotSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand(async (stagehand) => {
          const page = await stagehand.context.awaitActivePage();
          const format = input.type ?? "png";
          const buffer = await page.screenshot({
            fullPage: input.fullPage,
            type: format,
            quality: input.quality
          });

          return {
            mimeType: MIME_TYPE_BY_FORMAT[format] ?? "application/octet-stream",
            base64: buffer.toString("base64")
          };
        });
      } catch (error) {
        throw wrapToolError("capture a screenshot", error);
      }
    }
  });
}
