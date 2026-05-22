import { stdin, stdout } from "node:process";

const WRITE_TOOL_PATTERNS = [
  "apply_patch",
  "create_file",
  "edit_notebook_file",
  "vscode_renameSymbol",
];

function shouldGate(payload) {
  const lower = payload.toLowerCase();
  const isWriteTool = WRITE_TOOL_PATTERNS.some((tool) =>
    lower.includes(tool.toLowerCase()),
  );
  const targetsScaffold = lower.includes(".scaffold");
  return isWriteTool && targetsScaffold;
}

function emitAskDecision() {
  const response = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        "This tool call touches a .scaffold path. Confirm explicitly before editing scaffold references.",
    },
    systemMessage:
      "Scaffold protection: this operation targets a .scaffold path. Approve only if the user explicitly requested scaffold changes.",
  };

  stdout.write(JSON.stringify(response));
}

let raw = "";

stdin.setEncoding("utf8");
stdin.on("data", (chunk) => {
  raw += chunk;
});
stdin.on("end", () => {
  if (shouldGate(raw)) {
    emitAskDecision();
  }
});
