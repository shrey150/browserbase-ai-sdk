import {
  DEFAULT_TOOL_NAMES,
  type BrowserbaseToolNames,
  type BrowserbaseToolset,
  type CreateBrowserbaseToolsOptions
} from "./types.js";
import { StagehandSessionManager } from "./session/session-manager.js";
import { createSessionStartTool } from "./tools/session-start.js";
import { createSessionCloseTool } from "./tools/session-close.js";
import { createNavigateTool } from "./tools/navigate.js";
import { createGetUrlTool } from "./tools/get-url.js";
import { createScreenshotTool } from "./tools/screenshot.js";
import { createActTool } from "./tools/act.js";
import { createExtractTool } from "./tools/extract.js";
import { createObserveTool } from "./tools/observe.js";
import { createAgentExecuteTool } from "./tools/agent-execute.js";

function resolveToolNames(overrides?: Partial<BrowserbaseToolNames>): BrowserbaseToolNames {
  return {
    ...DEFAULT_TOOL_NAMES,
    ...overrides
  };
}

export function createBrowserbaseTools(options: CreateBrowserbaseToolsOptions = {}): BrowserbaseToolset {
  const names = resolveToolNames(options.names);
  const manager = new StagehandSessionManager(options);

  const tools = {
    [names.sessionStart]: createSessionStartTool(manager),
    [names.sessionClose]: createSessionCloseTool(manager),
    [names.navigate]: createNavigateTool(manager),
    [names.getUrl]: createGetUrlTool(manager),
    [names.screenshot]: createScreenshotTool(manager),
    [names.act]: createActTool(manager),
    [names.extract]: createExtractTool(manager),
    [names.observe]: createObserveTool(manager),
    [names.agentExecute]: createAgentExecuteTool(manager)
  };

  return {
    tools,
    startSession: () => manager.startSession(),
    closeSession: () => manager.closeSession(),
    getSessionInfo: () => manager.getSessionInfo()
  };
}
