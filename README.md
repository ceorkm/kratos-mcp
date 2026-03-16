<div align="center">

```
  ██╗  ██╗██████╗  █████╗ ████████╗ ██████╗ ███████╗
  ██║ ██╔╝██╔══██╗██╔══██╗╚══██╔══╝██╔═══██╗██╔════╝
  █████╔╝ ██████╔╝███████║   ██║   ██║   ██║███████╗
  ██╔═██╗ ██╔══██╗██╔══██║   ██║   ██║   ██║╚════██║
  ██║  ██╗██║  ██║██║  ██║   ██║   ╚██████╔╝███████║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝
```

### The God of War remembers everything.

[![npm version](https://img.shields.io/npm/v/kratos-mcp.svg)](https://www.npmjs.com/package/kratos-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

**Persistent memory for AI coding agents. Encrypted. Local. Zero network calls.**

</div>

---

> ## Kratos has migrated to a standalone CLI
>
> **MCP consumes too many tokens per tool call** (JSON-RPC schema overhead on every interaction). We've migrated to a lightweight CLI that any AI agent can use — Claude Code, Codex, Cursor, Cline, or anything that runs Bash. No protocol overhead, no vendor lock-in.
>
> ### Migrate now:
> ```bash
> npx kratos-memory
> ```
>
> - **New package**: [`kratos-memory`](https://www.npmjs.com/package/kratos-memory) on npm
> - **New repo**: [github.com/ceorkm/kratos-cli](https://github.com/ceorkm/kratos-cli)
> - **Same data**: Run `npx kratos-memory migrate` — your existing memories are already compatible
> - **Works with any agent**: Not tied to MCP, Claude, or any specific tool
>
> The MCP server below continues to work for existing users, but is no longer actively developed. All new features go to `kratos-memory`.

---

## What is Kratos?

AI coding tools forget everything between sessions. You explain your architecture, your patterns, your decisions — and next session, you explain it all again.

Kratos gives your AI agent **permanent memory**. Every observation is saved, searchable, and encrypted locally.

## Installation (MCP — Legacy)

That's it. Kratos is now active in **every Claude Code session**. Auto-captures observations, recalls context on session start, compresses summaries with Claude — all automatic.

### CLI (standalone)

```bash
npx kratos-mcp
```

Works with any AI coding tool that can run shell commands. Auto-detects your project from `.git`, `package.json`, `Cargo.toml`, `go.mod`, or `pyproject.toml`.

## Quick Start

```bash
# Save a memory
kratos save "Auth uses JWT with RS256, refresh tokens in httpOnly cookies" --tags auth,jwt --importance 5

# Search memories
kratos search "authentication"

# Ask in natural language
kratos ask "how does the auth system work?"

# See what Kratos knows
kratos status
```

**Output:**

```
  KRATOS — Memory System
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ACTIVE PROJECT
  ● my-app

  MEMORY STATS
    Total:       47
    Last saved:  3/15/2026, 2:16:21 PM
    Importance:
      5 ████████████████████ 12
      4 █████████████░░░░░░░ 8
      3 ████████░░░░░░░░░░░░ 5
      2 ██████░░░░░░░░░░░░░░ 4
      1 ░░░░░░░░░░░░░░░░░░░░ 0

  TOP TAGS
    #auth(5)  #database(4)  #api(3)  #frontend(2)

  FEATURES
    ● FTS5 Full-Text Search
    ● AES-256-GCM Encryption
    ● PII/Secret Detection
    ● Smart Compression
    ● Auto-Capture Hooks
```

## Commands

| Command | Description |
|---------|-------------|
| `kratos save <text>` | Save a memory (`--tags`, `--importance 1-5`, `--paths`, `--compress`) |
| `kratos search <query>` | Full-text search (`--limit`, `--tags`, `--debug`) |
| `kratos ask <question>` | Natural language query |
| `kratos recent` | Recent memories (`--limit`) |
| `kratos get <id>` | Full memory details |
| `kratos forget <id>` | Delete a memory |
| `kratos status` | System dashboard |
| `kratos switch <path>` | Switch project |
| `kratos scan <text>` | Detect PII/secrets (`--redact`) |
| `kratos migrate` | Verify existing data for CLI use |
| `kratos hooks install` | Install auto-capture hooks for Claude Code |
| `kratos hooks uninstall` | Remove hooks |

## Plugin Mode

Kratos works as a **Claude Code plugin** for fully automatic memory capture. No manual commands needed — everything happens in the background.

### Install as Plugin

```bash
/plugin marketplace add ceorkm/kratos-mcp
/plugin install kratos-memory
```

Installed to **user scope** by default — active in every Claude Code session, every project.

### What Happens Automatically

| Event | Action |
|-------|--------|
| **Session starts** | Loads recent memories into Claude's context |
| **You edit a file** | Captures what changed, saves as memory |
| **You run a command** | Captures the command and result |
| **Session ends** | Claude summarizes the session (using the host LLM — free, no API key) and saves it |

The plugin uses Claude Code's built-in `type: "prompt"` hook — Claude itself compresses your session memories. No external AI, no Ollama, no API keys, no network calls.

### Plugin Structure

```
plugin/
  .claude-plugin/plugin.json      # Manifest
  hooks/hooks.json                # Lifecycle hooks (PostToolUse, Stop, etc.)
  skills/kratos-memory/SKILL.md   # Teaches Claude how to use kratos
  scripts/                        # Hook handlers
  .mcp.json                       # MCP server (backward compat)
```

## Security

Kratos was built with security as a core feature, not an afterthought.

| Feature | Detail |
|---------|--------|
| **AES-256-GCM Encryption** | Memories encrypted at rest with per-project keys |
| **PII Detection** | Auto-detects SSN, credit cards, emails, phone numbers, IPs, DOB |
| **Secret Detection** | Catches API keys, AWS keys, GitHub tokens, JWTs, private keys, passwords |
| **Project Isolation** | Each project has its own SQLite database — zero cross-contamination |
| **Zero Network Calls** | Nothing leaves your machine. Ever. No telemetry, no analytics, no cloud. |
| **Key Rotation** | Rotate encryption keys without data loss |

```bash
# Scan text before saving
kratos scan "My API key is sk-1234abcd..." --redact

# Output:
# ✗ Secrets detected!
#   ● API Key (secret, confidence: 0.9)
# Redacted: My API key is sk-[REDACTED_SECRET]...
```

## How It Works

```
You code with Claude
        ↓
  PostToolUse hook fires (auto)
        ↓
  Observation captured + compressed
        ↓
  Saved to per-project SQLite + FTS5
        ↓
  Next session starts
        ↓
  SessionStart hook loads recent context
        ↓
  Claude knows what happened last time
```

**Performance:**

| Metric | Value |
|--------|-------|
| Memory retrieval | < 10ms |
| Project switch | < 100ms |
| Storage per project | ~2MB |
| Search engine | SQLite FTS5 (porter tokenizer) |

## Data Storage

```
~/.kratos/
├── projects/
│   ├── proj_abc123/
│   │   ├── databases/
│   │   │   └── memories.db        # SQLite + FTS5
│   │   ├── sessions/
│   │   │   └── current.json       # Active session buffer
│   │   └── project.json           # Project metadata
│   └── proj_def456/
│       └── ...
├── .keys/
│   └── proj_abc123.key            # AES-256 encryption key
└── projects.json                  # Project registry
```

Each project is completely isolated. Different database, different encryption key, different everything.

## MCP Support (Deprecated)

> **Note:** MCP support is deprecated and will be removed in a future version. The CLI and plugin are the recommended interfaces going forward. MCP consumed too much context per tool call.

If you still need MCP mode:

```bash
kratos mcp
```

Or in your MCP client config:
```json
{
  "mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["kratos-mcp"]
    }
  }
}
```

Existing MCP users: run `kratos migrate` to verify your data works with the CLI. No data copy needed — same database format.

## Contributing

```bash
git clone https://github.com/ceorkm/kratos-mcp.git
cd kratos-mcp
npm install
npm run build
npm run cli   # Run CLI in dev mode
```

## License

MIT

---

<div align="center">

**Built for developers who are tired of repeating themselves.**

[Report Bug](https://github.com/ceorkm/kratos-mcp/issues) · [Request Feature](https://github.com/ceorkm/kratos-mcp/issues)

</div>
