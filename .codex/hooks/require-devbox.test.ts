/**
 * AI Agent の開発コマンドが標準の Devbox 実行経路を使うことを検証する。
 * Devbox の外側でシェル構文が評価されるコマンドも拒否する。
 */
import { describe, expect, it } from "vitest";
import claudeSettings from "../../.claude/settings.json";
import { DevboxGuard } from "../../.opencode/plugins/require-devbox.js";
import openCodeSettings from "../../opencode.json";
import { evaluatePreToolUse, isDevboxCommand } from "./require-devbox.mjs";

/**
 * テスト用の Bash PreToolUse 入力を作成する。
 *
 * @param command - Codex が実行しようとするコマンド。
 * @returns PreToolUse フックと同じ形の入力。
 */
function createPreToolUseInput(command: unknown): Record<string, unknown> {
  return {
    hook_event_name: "PreToolUse",
    tool_input: { command },
    tool_name: "Bash",
  };
}

describe("isDevboxCommand", () => {
  it.each([
    "devbox run -- pnpm verify",
    "devbox run -- node --version",
    "devbox shell",
    "  devbox run -- git status  ",
    "devbox run -- sh -lc 'pnpm typecheck; pnpm check'",
    'devbox run -- sh -lc \'printf "%s\\n" "$PATH"\'',
  ])("Devbox を最外層の実行経路とする開発コマンドを許可する: %s", (command) => {
    expect(isDevboxCommand(command)).toBe(true);
  });

  it("Devbox 内側で絶対パス指定されたコマンド内容は制限しない", () => {
    expect(isDevboxCommand("devbox run -- /usr/bin/node --version")).toBe(true);
  });

  it.each([
    "pnpm verify",
    "node --version",
    "devbox run pnpm verify",
    "devbox-helper run -- pnpm verify",
  ])("Devbox を経由しない開発コマンドを拒否する: %s", (command) => {
    expect(isDevboxCommand(command)).toBe(false);
  });

  it.each([
    "pnpm verify; devbox run -- pnpm check",
    "devbox run -- pnpm verify; pnpm build",
    "devbox run -- pnpm verify | tee verify.log",
    "devbox run -- pnpm verify > verify.log",
    'devbox run -- sh -lc "echo $PATH"',
    "devbox run -- pnpm $(printf verify)",
    "devbox run -- pnpm *",
  ])("Devbox の外側で評価されるシェル構文を拒否する: %s", (command) => {
    expect(isDevboxCommand(command)).toBe(false);
  });
});

describe("evaluatePreToolUse", () => {
  it("Devbox 経由のコマンドには拒否応答を返さない", () => {
    expect(
      evaluatePreToolUse(createPreToolUseInput("devbox run -- pnpm verify")),
    ).toBeNull();
  });

  it("Devbox を経由しないコマンドを実行前に拒否する", () => {
    expect(evaluatePreToolUse(createPreToolUseInput("pnpm verify"))).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: expect.stringContaining("devbox run"),
      },
    });
  });

  it("コマンドを特定できないフック入力を拒否する", () => {
    expect(evaluatePreToolUse(createPreToolUseInput(null))).not.toBeNull();
  });
});

describe("Claude Code configuration", () => {
  it("Bash の実行前に共有 Devbox ガードを起動する", () => {
    expect(claudeSettings.hooks.PreToolUse).toEqual([
      {
        hooks: [
          {
            args: [
              "run",
              "--",
              "node",
              `\${CLAUDE_PROJECT_DIR}/.codex/hooks/require-devbox.mjs`,
            ],
            command: "devbox",
            statusMessage: "Checking Devbox command policy",
            timeout: 30,
            type: "command",
          },
        ],
        matcher: "Bash",
      },
    ]);
  });
});

describe("OpenCode DevboxGuard", () => {
  it("権限設定で Devbox コマンドだけを許可する", () => {
    expect(openCodeSettings.permission.bash).toEqual({
      "*": "deny",
      "devbox run -- *": "allow",
      "devbox shell*": "allow",
    });
  });

  it("Devbox 経由の bash コマンドを許可する", async () => {
    const plugin = await DevboxGuard();
    await expect(
      plugin["tool.execute.before"](
        { tool: "bash" },
        { args: { command: "devbox run -- pnpm verify" } },
      ),
    ).resolves.toBeUndefined();
  });

  it("Devbox を経由しない bash コマンドを拒否する", async () => {
    const plugin = await DevboxGuard();
    await expect(
      plugin["tool.execute.before"](
        { tool: "bash" },
        { args: { command: "pnpm verify" } },
      ),
    ).rejects.toThrow("Devbox guard");
  });

  it("将来の shell ツール識別子でも同じガードを適用する", async () => {
    const plugin = await DevboxGuard();
    await expect(
      plugin["tool.execute.before"](
        { tool: "shell" },
        { args: { command: "pnpm verify" } },
      ),
    ).rejects.toThrow("Devbox guard");
  });

  it("シェル以外の OpenCode ツールには干渉しない", async () => {
    const plugin = await DevboxGuard();
    await expect(
      plugin["tool.execute.before"](
        { tool: "read" },
        { args: { filePath: "AGENTS.md" } },
      ),
    ).resolves.toBeUndefined();
  });
});
