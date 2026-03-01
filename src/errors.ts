export class BrowserbaseToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "BROWSERBASE_TOOL_ERROR", cause?: unknown) {
    super(message, { cause });
    this.name = "BrowserbaseToolError";
    this.code = code;
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function wrapToolError(action: string, error: unknown): BrowserbaseToolError {
  return new BrowserbaseToolError(`Failed to ${action}: ${toErrorMessage(error)}`, "BROWSERBASE_TOOL_ERROR", error);
}
