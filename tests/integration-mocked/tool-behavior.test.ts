import { beforeEach, describe, expect, it, vi } from "vitest";

const stagehandMock = vi.hoisted(() => {
  const instances: Array<{ page: { url: () => string } }> = [];
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
      stagehandMock.instances.push({ page: this.page });
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

    async observe(): Promise<Array<Record<string, string>>> {
      return [
        {
          selector: "button#submit",
          description: "Click submit"
        }
      ];
    }

    agent(): { execute: (instructionOrOptions: { instruction: string }) => Promise<Record<string, unknown>> } {
      return {
        execute: async (instructionOrOptions) => ({
          success: true,
          message: instructionOrOptions.instruction,
          actions: [],
          completed: true
        })
      };
    }
  }

  return {
    Stagehand: MockStagehand
  };
});

import { DEFAULT_TOOL_NAMES, createBrowserbaseTools } from "../../src/index.js";

describe("mocked tool integration", () => {
  beforeEach(() => {
    stagehandMock.instances.length = 0;
  });

  it("shared strategy preserves page URL between tool calls", async () => {
    const sdk = createBrowserbaseTools({
      session: {
        strategy: "shared"
      }
    });

    const navigateTool = sdk.tools[DEFAULT_TOOL_NAMES.navigate] as { execute: (input: { url: string }) => Promise<unknown> };
    const getUrlTool = sdk.tools[DEFAULT_TOOL_NAMES.getUrl] as { execute: (input: Record<string, never>) => Promise<{ url: string }> };

    await navigateTool.execute({ url: "https://example.com" });
    const result = await getUrlTool.execute({});

    expect(result.url).toBe("https://example.com");
    expect(stagehandMock.instances).toHaveLength(1);
  });

  it("per-call strategy starts fresh state per tool execution", async () => {
    const sdk = createBrowserbaseTools({
      session: {
        strategy: "per-call"
      }
    });

    const navigateTool = sdk.tools[DEFAULT_TOOL_NAMES.navigate] as { execute: (input: { url: string }) => Promise<unknown> };
    const getUrlTool = sdk.tools[DEFAULT_TOOL_NAMES.getUrl] as { execute: (input: Record<string, never>) => Promise<{ url: string }> };

    await navigateTool.execute({ url: "https://example.com" });
    const result = await getUrlTool.execute({});

    expect(result.url).toBe("about:blank");
    expect(stagehandMock.instances).toHaveLength(2);
  });

  it("returns screenshot payload as base64 + mime type", async () => {
    const sdk = createBrowserbaseTools();
    const screenshotTool = sdk.tools[DEFAULT_TOOL_NAMES.screenshot] as {
      execute: (input: { type?: "png" | "jpeg" | "webp" }) => Promise<{ mimeType: string; base64: string }>;
    };

    const result = await screenshotTool.execute({ type: "png" });

    expect(result.mimeType).toBe("image/png");
    expect(Buffer.from(result.base64, "base64").toString()).toBe("mock-image");
  });

  it("executes act, extract, observe, and agent tools", async () => {
    const sdk = createBrowserbaseTools();

    const actTool = sdk.tools[DEFAULT_TOOL_NAMES.act] as {
      execute: (input: { instruction: string }) => Promise<{ success: boolean }>;
    };
    const extractTool = sdk.tools[DEFAULT_TOOL_NAMES.extract] as {
      execute: (input: { instruction: string }) => Promise<{ extraction: string }>;
    };
    const observeTool = sdk.tools[DEFAULT_TOOL_NAMES.observe] as {
      execute: (input: Record<string, never>) => Promise<Array<{ selector: string }>>;
    };
    const agentTool = sdk.tools[DEFAULT_TOOL_NAMES.agentExecute] as {
      execute: (input: { instruction: string }) => Promise<{ success: boolean; completed: boolean }>;
    };

    const actResult = await actTool.execute({ instruction: "click the button" });
    const extractResult = await extractTool.execute({ instruction: "extract headline" });
    const observeResult = await observeTool.execute({});
    const agentResult = await agentTool.execute({ instruction: "complete checkout" });

    expect(actResult.success).toBe(true);
    expect(extractResult.extraction).toBe("extract headline");
    expect(observeResult[0]?.selector).toBe("button#submit");
    expect(agentResult.success).toBe(true);
    expect(agentResult.completed).toBe(true);
  });
});
