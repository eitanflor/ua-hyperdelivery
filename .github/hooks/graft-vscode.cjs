#!/usr/bin/env node
// graft 0.20 ships hooks for Claude Code and Cursor only; this maps VS Code's Local hook
// payload onto the Claude-format runner in .claude/helpers so the graph stays fresh here too.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const mode = process.argv[2];

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw || "{}");
  } catch {
    return;
  }

  if (mode === "post-edit") {
    // VS Code edit tools name the file `filePath`; graft reads Claude's `file_path`.
    const args = input.tool_input ?? {};
    const file = args.filePath ?? args.replacements?.[0]?.filePath;
    if (typeof file !== "string") return;
    // PostToolUse also fires for reads, including failed ones; graft treats a path that
    // is not a file as a project root and creates a cache directory there.
    if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return;
    input = { ...input, tool_input: { ...args, file_path: file } };
  }

  const result = spawnSync(
    process.execPath,
    [path.join(root, ".claude", "helpers", "graft-hooks.cjs"), mode],
    {
      input: JSON.stringify(input),
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      encoding: "utf8",
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
});
