# @browserbasehq/ai-sdk

AI SDK tools for Browserbase, powered by `@browserbasehq/stagehand`.

## Install

```bash
npm install @browserbasehq/ai-sdk ai @ai-sdk/google
```

## Quickstart

```ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createBrowserbaseTools } from "@browserbasehq/ai-sdk";

const browserbase = createBrowserbaseTools({
  stagehand: {
    model: "google/gemini-3-flash-preview"
  }
});

const result = await generateText({
  model: google("gemini-2.5-flash"),
  tools: browserbase.tools,
  maxSteps: 10,
  prompt: "Open https://example.com and summarize what is on the page."
});

console.log(result.text);
await browserbase.closeSession();
```

## API

```ts
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

export type CreateBrowserbaseToolsOptions = {
  stagehand?: Partial<V3Options>;
  session?: {
    strategy?: "shared" | "per-call";
    closeOnExit?: boolean;
  };
  names?: Partial<BrowserbaseToolNames>;
};

export type BrowserbaseToolset = {
  tools: Record<string, Tool>;
  startSession(): Promise<{ sessionId?: string; debugUrl?: string }>;
  closeSession(): Promise<void>;
  getSessionInfo(): { sessionId?: string; debugUrl?: string } | null;
};
```

## Default tool names

1. `browserbase_stagehand_session_start`
2. `browserbase_stagehand_session_close`
3. `browserbase_stagehand_navigate`
4. `browserbase_stagehand_get_url`
5. `browserbase_screenshot`
6. `browserbase_stagehand_act`
7. `browserbase_stagehand_extract`
8. `browserbase_stagehand_observe`
9. `browserbase_stagehand_agent_execute`

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BROWSERBASE_API_KEY` | Yes (Browserbase env) | Browserbase API key |
| `BROWSERBASE_PROJECT_ID` | Yes (Browserbase env) | Browserbase project id |
| `GEMINI_API_KEY` | Needed for `act/extract/observe/agent` with Gemini models | LLM provider key |

You can pass explicit Stagehand config via `stagehand` options if you do not want to rely on environment defaults.

## Session strategy

- `shared` (default): one browser session reused across tool calls.
- `per-call`: creates and closes a fresh session for each tool execution.

## Act and extract behavior

- `act` supports two input styles:
  - `action` (recommended) for natural-language actions.
  - `instruction` as a backward-compatible alias for natural-language actions.
  - `deterministicAction` for selector/method execution when you already have a concrete target (for example from `observe`).
- `extract` supports optional `schema` (JSON Schema). When present, it is converted with Stagehand's built-in `jsonSchemaToZod` and passed to `stagehand.extract(instruction, schema, options)`.
- This package intentionally relies on Stagehand core self-heal and inference behavior, rather than re-implementing custom retry loops in this wrapper.

## Registry metadata target

- slug: `browserbase`
- package: `@browserbasehq/ai-sdk`
- tags: `browser`, `browser-automation`, `web`, `extraction`

## License

MIT
