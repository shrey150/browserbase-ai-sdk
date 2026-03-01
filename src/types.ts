import type { Tool } from "ai";
import type { V3Options } from "@browserbasehq/stagehand";

export type BrowserbaseToolNames = {
  sessionStart: string;
  sessionClose: string;
  navigate: string;
  getUrl: string;
  screenshot: string;
  act: string;
  extract: string;
  observe: string;
  agentExecute: string;
};

export const DEFAULT_TOOL_NAMES: BrowserbaseToolNames = {
  sessionStart: "browserbase_stagehand_session_start",
  sessionClose: "browserbase_stagehand_session_close",
  navigate: "browserbase_stagehand_navigate",
  getUrl: "browserbase_stagehand_get_url",
  screenshot: "browserbase_screenshot",
  act: "browserbase_stagehand_act",
  extract: "browserbase_stagehand_extract",
  observe: "browserbase_stagehand_observe",
  agentExecute: "browserbase_stagehand_agent_execute"
};

export type SessionStrategy = "shared" | "per-call";

export type SessionInfo = {
  sessionId?: string;
  debugUrl?: string;
};

export type CreateBrowserbaseToolsOptions = {
  stagehand?: Partial<V3Options>;
  session?: {
    strategy?: SessionStrategy;
    closeOnExit?: boolean;
  };
  names?: Partial<BrowserbaseToolNames>;
};

export type BrowserbaseToolset = {
  tools: Record<string, Tool>;
  startSession(): Promise<SessionInfo>;
  closeSession(): Promise<void>;
  getSessionInfo(): SessionInfo | null;
};
