import { beforeEach, describe, expect, it, vi } from "vitest";

const stagehandMock = vi.hoisted(() => {
  const instances: Array<Record<string, unknown>> = [];
  return { instances };
});

vi.mock("@browserbasehq/stagehand", () => {
  const createPage = () => {
    let currentUrl = "about:blank";

    return {
      goto: vi.fn(async (url: string) => {
        currentUrl = url;
        return {
          status: () => 200,
          ok: () => true
        };
      }),
      url: vi.fn(() => currentUrl),
      title: vi.fn(async () => "Mock Title"),
      screenshot: vi.fn(async () => Buffer.from("mock-image"))
    };
  };

  class MockStagehand {
    readonly browserbaseSessionID: string;
    readonly browserbaseDebugURL: string;
    readonly context: { awaitActivePage: () => Promise<ReturnType<typeof createPage>> };

    private readonly page = createPage();

    constructor() {
      const sessionNumber = stagehandMock.instances.length + 1;
      this.browserbaseSessionID = `session-${sessionNumber}`;
      this.browserbaseDebugURL = `https://debug/${sessionNumber}`;
      this.context = {
        awaitActivePage: vi.fn(async () => this.page)
      };

      stagehandMock.instances.push(this as unknown as Record<string, unknown>);
    }

    async init(): Promise<void> {
      // no-op
    }

    async close(): Promise<void> {
      // no-op
    }

    async act(instruction: string): Promise<Record<string, unknown>> {
      return {
        success: true,
        message: instruction,
        actionDescription: "acted",
        actions: []
      };
    }

    async extract(instruction: string): Promise<Record<string, unknown>> {
      return { extraction: instruction };
    }

    async observe(): Promise<unknown[]> {
      return [];
    }

    agent(): { execute: (instruction: string | { instruction: string }) => Promise<Record<string, unknown>> } {
      return {
        execute: async (instructionOrOptions) => {
          const instruction =
            typeof instructionOrOptions === "string"
              ? instructionOrOptions
              : instructionOrOptions.instruction;

          return {
            success: true,
            message: instruction,
            actions: [],
            completed: true
          };
        }
      };
    }
  }

  return {
    Stagehand: MockStagehand,
    jsonSchemaToZod: vi.fn(() => ({
      parse: (value: unknown) => value,
      safeParse: (value: unknown) => ({ success: true, data: value })
    }))
  };
});

import { DEFAULT_TOOL_NAMES, createBrowserbaseTools } from "../../src/index.js";

describe("createBrowserbaseTools", () => {
  beforeEach(() => {
    stagehandMock.instances.length = 0;
  });

  it("returns tools with the default MCP-aligned names", () => {
    const sdk = createBrowserbaseTools();
    expect(Object.keys(sdk.tools).sort()).toEqual(Object.values(DEFAULT_TOOL_NAMES).sort());
  });

  it("supports custom tool name overrides", () => {
    const sdk = createBrowserbaseTools({
      names: {
        navigate: "custom_navigate"
      }
    });

    expect(sdk.tools.custom_navigate).toBeDefined();
    expect(sdk.tools[DEFAULT_TOOL_NAMES.navigate]).toBeUndefined();
  });

  it("exposes session lifecycle helpers", async () => {
    const sdk = createBrowserbaseTools();
    expect(sdk.getSessionInfo()).toBeNull();

    const session = await sdk.startSession();
    expect(session.sessionId).toBe("session-1");
    expect(sdk.getSessionInfo()).toEqual(session);

    await sdk.closeSession();
    expect(sdk.getSessionInfo()).toBeNull();
  });
});
