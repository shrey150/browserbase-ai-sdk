import { tool } from "ai";
import { z } from "zod";
import { wrapToolError } from "../errors.js";
import type { StagehandSessionManager } from "../session/session-manager.js";

const navigateSchema = z.object({
  url: z.url(),
  waitUntil: z.enum(["load", "domcontentloaded", "networkidle"]).optional(),
  timeoutMs: z.number().int().positive().optional()
});

export function createNavigateTool(manager: StagehandSessionManager) {
  return tool({
    description: "Navigate the active browser page to a URL.",
    inputSchema: navigateSchema,
    execute: async (input) => {
      try {
        return await manager.runWithStagehand(async (stagehand) => {
          const page = await stagehand.context.awaitActivePage();
          const response = await page.goto(input.url, {
            waitUntil: input.waitUntil,
            timeoutMs: input.timeoutMs
          });

          const currentUrl = page.url();
          const title = await page.title().catch(() => undefined);

          return {
            navigated: true,
            url: currentUrl,
            title,
            status: response?.status(),
            ok: response?.ok()
          };
        });
      } catch (error) {
        throw wrapToolError("navigate", error);
      }
    }
  });
}
