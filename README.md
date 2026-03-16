<div align="center">

# Kratos MCP

### Ultra-Lean Memory System for AI Coding Tools

[![npm version](https://img.shields.io/npm/v/kratos-mcp.svg)](https://www.npmjs.com/package/kratos-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

**Never explain your codebase again. Let AI remember everything.**

</div>

---

> **Looking for a lighter alternative?** Check out [`kratos-memory`](https://www.npmjs.com/package/kratos-memory) — a CLI-first version that works with any AI agent (Claude Code, Codex, Cursor, Cline) without MCP overhead. Same data format, same `~/.kratos/` storage — just run `npx kratos-memory status`.

---

## Why Kratos?

After building 30+ production apps with AI, we discovered a critical problem: **AI tools forget everything between sessions**. You explain your architecture, your patterns, your decisions—and tomorrow, you explain it all again.

Kratos MCP solves this with an **ultra-lean memory system** that gives AI perfect recall of your project—with minimal context overhead.

## Features

<table>
<tr>
<td width="50%">

### 100% Project Isolation
Each project gets its own SQLite database. No cross-contamination. Ever.

</td>
<td width="50%">

### Zero Configuration
Auto-detects projects via git, package.json, or directory structure. Just install and code.

</td>
</tr>
<tr>
<td width="50%">

### Ultra-Lean Architecture
Just 12 essential tools. 64% smaller context footprint than competitors.

</td>
<td width="50%">

### Universal Protocol
Works with Claude, Cursor, Windsurf, Continue—any MCP-compatible tool.

</td>
</tr>
</table>

## Installation

```bash
# Install globally
npm install -g kratos-mcp

# Or run directly with npx (no installation required)
npx kratos-mcp

# Or install as a dependency
npm install kratos-mcp
```

## Quick Start

### 1. Configure Your AI Tool

<details>
<summary><b>Claude Desktop</b></summary>

Add to your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["--yes", "kratos-mcp@latest"]
    }
  }
}
```

Or if you have it installed globally:
```json
{
  "mcpServers": {
    "kratos": {
      "command": "kratos-mcp",
      "args": []
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code</b></summary>

Run this command in your terminal:

```bash
claude mcp add kratos -- npx --yes kratos-mcp@latest
```

Or for global installation:

```bash
# First install globally
npm install -g kratos-mcp@latest

# Then add to Claude Code
claude mcp add kratos -- kratos-mcp
```
</details>

<details>
<summary><b>Cursor</b></summary>

Add to `.cursor/mcp_config.json` in your project root:

```json
{
  "mcpServers": {
    "kratos": {
      "command": "npx",
      "args": ["--yes", "kratos-mcp@latest"]
    }
  }
}
```
</details>

<details>
<summary><b>Other MCP Tools</b></summary>

Kratos works with any tool supporting the Model Context Protocol. The general format is:

```json
{
  "command": "npx",
  "args": ["kratos-mcp"]
}
```

**Compatible with:** Windsurf, Cline, BoltAI, Augment Code, Roo Code, Zencoder, Amazon Q, Qodo Gen, JetBrains AI, Warp, Opencode, Continue.dev, Zed, and more!

Check your tool's documentation for specific MCP server configuration location.

</details>

### 2. Start Using Kratos

```typescript
// Your AI now remembers:
// - Your authentication patterns
// - Your API structure
// - Your component architecture
// - Your coding standards
// - Every decision you've made
```

## Available Tools

Kratos provides **12 ultra-lean tools** optimized for minimal context consumption:

### Memory Management (7 tools)

| Tool | Description |
|------|-------------|
| `memory_save` | Store important project knowledge with tags, paths, and importance levels |
| `memory_search` | Smart semantic search with debug mode and path matching |
| `memory_ask` | Natural language queries about your memories |
| `memory_get_recent` | Get recently created memories with filtering |
| `memory_get` | Retrieve a specific memory by ID |
| `memory_get_multiple` | Bulk retrieve multiple memories |
| `memory_forget` | Delete a memory by ID |

### Security (1 tool)

| Tool | Description |
|------|-------------|
| `security_scan` | Scan text for PII and secrets before saving |

### Project Management (3 tools)

| Tool | Description |
|------|-------------|
| `project_switch` | Switch between different projects |
| `project_current` | Get current active project info |
| `change_storage_path` | Dynamically change storage location with automatic data migration |

### System (1 tool)

| Tool | Description |
|------|-------------|
| `system_status` | Get system status and memory statistics |

## How It Works

```
AI Tool ──► Kratos MCP ──► Project Detection ──► SQLite + FTS5 ──► Perfect Context
```

- **SQLite + FTS5**: Lightning-fast full-text search
- **Smart Scoring**: Path matching + recency + importance
- **Auto-detection**: Git, package.json, or directory-based
- **Secure**: All data stays local, no external calls
- **Lean**: Only 4 core components, minimal memory footprint

## Performance

| Metric | Value |
|--------|-------|
| Context Overhead | 64% smaller than v3 |
| Memory Retrieval | < 10ms |
| Project Switch | < 100ms |
| Storage Overhead | ~2MB per project |

## Data Storage

```
~/.kratos/
├── projects/
│   ├── project-id-1/
│   │   └── memories.db          # SQLite database with FTS5
│   └── project-id-2/
│       └── memories.db
└── global/
    └── global.db                # Shared knowledge (optional)
```

Use `change_storage_path` to move data to custom locations like `/opt/kratos` or `.kratos` for per-project storage.

## Example Usage

```typescript
// Save a memory
await memory_save({
  summary: "JWT auth implementation",
  text: "We use httpOnly cookies with refresh tokens...",
  tags: ["auth", "security"],
  paths: ["src/middleware/auth.ts"],
  importance: 5
});

// Search memories
await memory_search({
  q: "authentication",
  k: 5,
  debug: true
});

// Ask natural language questions
await memory_ask({
  question: "How does our auth system work?",
  limit: 10
});
```

## Contributing

```bash
git clone https://github.com/ceorkm/kratos-mcp.git
npm install
npm run build
npm run dev
```

## License

MIT

---

<div align="center">

**Built for developers who value their time.**

[Report Bug](https://github.com/ceorkm/kratos-mcp/issues) · [Request Feature](https://github.com/ceorkm/kratos-mcp/issues)

</div>
