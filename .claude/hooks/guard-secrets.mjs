// PreToolUse (Bash|PowerShell|Read): keep secret values out of tool output.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const t = input.tool_input ?? {};
const deny = (reason) => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  process.exit(0);
};

// .env, .env.local, apps/native/.env.production etc. Not .env.example.
const envFile = /(^|[\\/\s"'=])\.env(\.[\w-]+)?(?=$|[\s"'|;&)>])/;
const isExample = (s) => /\.env\.example\b/.test(s);

if (input.tool_name === "Read") {
  const p = t.file_path ?? "";
  if (envFile.test(p) && !isExample(p)) deny("Reading env files prints secrets. Pipe values file-to-file or check names only (e.g. grep -o '^[A-Z_]*=').");
  process.exit(0);
}

const cmd = t.command ?? "";
// A reader whose own arguments (same line and pipeline segment) name an env file.
const readsEnv = /\b(cat|head|tail|type|less|more|gc|Get-Content|bat|nl|sed|awk)\b[^|;&\n]*?(^|[\\/\s"'=])\.env(\.[\w-]+)?(?=$|[\s"'|;&)>])/m;
const m = cmd.match(readsEnv);
if (m && !isExample(m[0])) {
  deny("This command would print an env file. Read names only (grep -o '^[A-Z_]*=' FILE) or pipe file-to-file.");
}

// These print config values (OTP, keys) unless output goes to a file.
const leaky = /\bsupabase\s+config\s+push\b|\beas\s+env:(list|get|pull|exec)\b/;
if (leaky.test(cmd) && !/(>|\bOut-File\b)\s*\S/.test(cmd)) {
  deny("This command prints secret values. Redirect output to a scratchpad file (> file 2>&1) and grep only for status lines.");
}
