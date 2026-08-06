/**
 * Codex と Claude Code の開発コマンドを、標準の Devbox 実行経路へ統一する。
 * Devbox の外側でシェル構文が評価されるコマンドは、実行前に拒否する。
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * @typedef {object} DenyDecision
 * @property {{
 *   hookEventName: "PreToolUse";
 *   permissionDecision: "deny";
 *   permissionDecisionReason: string;
 * }} hookSpecificOutput PreToolUse でツール実行を拒否するための応答。
 */

/**
 * 値がキー参照可能なオブジェクトかを判定する。
 *
 * @param {unknown} value - 判定対象の値。
 * @returns {value is Record<string, unknown>} null ではないオブジェクトの場合は true。
 */
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

/**
 * Bash 用 PreToolUse 入力からコマンド文字列を取得する。
 *
 * @param {unknown} input - Codex または Claude Code のフックから渡された未検証の入力。
 * @returns {string | null} Bash コマンドが妥当な場合は文字列、それ以外は null。
 */
function getBashCommand(input) {
  if (
    !isRecord(input) ||
    input.hook_event_name !== "PreToolUse" ||
    input.tool_name !== "Bash" ||
    !isRecord(input.tool_input)
  ) {
    return null;
  }

  const command = input.tool_input.command;
  return typeof command === "string" ? command : null;
}

/**
 * コマンド全体が Devbox を最外層の実行経路としているか判定する。
 *
 * @param {string} command - Codex が実行しようとしているシェルコマンド。
 * @returns {boolean} `devbox run` または `devbox shell` の単一呼び出しなら true。
 */
export function isDevboxCommand(command) {
  const normalizedCommand = command.trim();
  if (
    !/^devbox\s+(?:run\s+--(?:\s|$)|shell(?:\s|$))/u.test(normalizedCommand)
  ) {
    return false;
  }

  /** @type {"double" | "none" | "single"} */
  let quoteState = "none";
  let escaped = false;

  for (const character of normalizedCommand) {
    if (quoteState === "single") {
      if (character === "'") {
        quoteState = "none";
      }
      continue;
    }

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (quoteState === "double") {
      if (character === '"') {
        quoteState = "none";
        continue;
      }

      if (character === "$" || character === "`") {
        return false;
      }
      continue;
    }

    if (character === "'") {
      quoteState = "single";
      continue;
    }

    if (character === '"') {
      quoteState = "double";
      continue;
    }

    if (";&|<>$`()\n\r*?[]{}#~".includes(character)) {
      return false;
    }
  }

  return quoteState === "none" && !escaped;
}

/**
 * PreToolUse 入力を評価し、必要なら拒否応答を生成する。
 *
 * @param {unknown} input - Codex または Claude Code のフックから渡された未検証の入力。
 * @returns {DenyDecision | null} Devbox 経由なら null、不正または非 Devbox 実行なら拒否応答。
 */
export function evaluatePreToolUse(input) {
  const command = getBashCommand(input);
  if (command !== null && isDevboxCommand(command)) {
    return null;
  }

  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "Devbox guard: development commands must use the project toolchain through `devbox run -- <command>` or `devbox shell`. Keep shell composition and expansion inside Devbox.",
    },
  };
}

/**
 * 標準入力からフック入力を読み、拒否が必要な場合だけ JSON を出力する。
 *
 * @returns {void} なし。
 */
function main() {
  try {
    /** @type {unknown} */
    const input = JSON.parse(readFileSync(0, "utf8"));
    const decision = evaluatePreToolUse(input);
    if (decision !== null) {
      process.stdout.write(JSON.stringify(decision));
    }
  } catch {
    console.error("Devbox guard: invalid PreToolUse input; command blocked.");
    process.exitCode = 2;
  }
}

const entryPoint = process.argv[1];
if (
  entryPoint !== undefined &&
  import.meta.url === pathToFileURL(entryPoint).href
) {
  main();
}
