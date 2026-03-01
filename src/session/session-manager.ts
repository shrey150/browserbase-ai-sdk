import { Stagehand, type V3Options } from "@browserbasehq/stagehand";
import type { CreateBrowserbaseToolsOptions, SessionInfo, SessionStrategy } from "../types.js";

function noop(): void {
  // Intentionally empty.
}

export class StagehandSessionManager {
  private readonly strategy: SessionStrategy;
  private readonly closeOnExit: boolean;
  private readonly stagehandOptions: Partial<V3Options>;
  private sharedStagehand: Stagehand | null = null;
  private lastSessionInfo: SessionInfo | null = null;
  private lock: Promise<void> = Promise.resolve();
  private cleanupRegistered = false;

  constructor(options: CreateBrowserbaseToolsOptions) {
    this.strategy = options.session?.strategy ?? "shared";
    this.closeOnExit = options.session?.closeOnExit ?? true;
    this.stagehandOptions = options.stagehand ?? {};
  }

  async startSession(): Promise<SessionInfo> {
    return this.withLock(async () => {
      if (this.strategy === "per-call") {
        const stagehand = await this.createAndInitStagehand();
        const info = this.readSessionInfo(stagehand);
        await this.safeClose(stagehand);
        return info;
      }

      const stagehand = await this.getOrCreateSharedStagehand();
      this.lastSessionInfo = this.readSessionInfo(stagehand);
      return this.lastSessionInfo;
    });
  }

  async closeSession(): Promise<void> {
    await this.withLock(async () => {
      if (!this.sharedStagehand) {
        this.lastSessionInfo = null;
        return;
      }

      const stagehand = this.sharedStagehand;
      this.sharedStagehand = null;
      this.lastSessionInfo = null;
      await this.safeClose(stagehand);
    });
  }

  getSessionInfo(): SessionInfo | null {
    if (this.strategy === "per-call") {
      return null;
    }

    return this.lastSessionInfo;
  }

  async runWithStagehand<T>(task: (stagehand: Stagehand) => Promise<T>): Promise<T> {
    return this.withLock(async () => {
      if (this.strategy === "per-call") {
        const stagehand = await this.createAndInitStagehand();
        try {
          return await task(stagehand);
        } finally {
          await this.safeClose(stagehand);
        }
      }

      const stagehand = await this.getOrCreateSharedStagehand();
      this.lastSessionInfo = this.readSessionInfo(stagehand);
      return task(stagehand);
    });
  }

  private async getOrCreateSharedStagehand(): Promise<Stagehand> {
    if (this.sharedStagehand) {
      return this.sharedStagehand;
    }

    const stagehand = await this.createAndInitStagehand();
    this.sharedStagehand = stagehand;
    this.lastSessionInfo = this.readSessionInfo(stagehand);
    this.registerCleanupHandlers();
    return stagehand;
  }

  private async createAndInitStagehand(): Promise<Stagehand> {
    const options: V3Options = {
      env: "BROWSERBASE",
      ...this.stagehandOptions
    } as V3Options;

    const stagehand = new Stagehand(options);
    await stagehand.init();
    return stagehand;
  }

  private readSessionInfo(stagehand: Stagehand): SessionInfo {
    return {
      sessionId: stagehand.browserbaseSessionID,
      debugUrl: stagehand.browserbaseDebugURL
    };
  }

  private registerCleanupHandlers(): void {
    if (!this.closeOnExit || this.cleanupRegistered) {
      return;
    }

    this.cleanupRegistered = true;

    const onExit = (): void => {
      void this.closeSession().catch(noop);
    };

    process.once("beforeExit", onExit);
    process.once("SIGINT", onExit);
    process.once("SIGTERM", onExit);
  }

  private async safeClose(stagehand: Stagehand): Promise<void> {
    try {
      await stagehand.close();
    } catch {
      // Best-effort shutdown.
    }
  }

  private async withLock<T>(task: () => Promise<T>): Promise<T> {
    const run = this.lock.then(task, task);
    this.lock = run.then(noop, noop);
    return run;
  }
}
