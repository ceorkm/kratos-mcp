#!/usr/bin/env node

/**
 * SessionStart hook — injects recent memories as context.
 * On startup/resume, retrieves recent high-importance memories
 * and outputs them so Claude has project context.
 */

import { execFileSync } from 'child_process';

async function main() {
  let input = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  // Fetch recent memories via CLI
  try {
    const output = execFileSync('npx', ['kratos-mcp', 'recent', '--limit', '5'], {
      timeout: 5000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Output goes to stdout — Claude sees it as context
    if (output && output.trim()) {
      process.stdout.write(output);
    }
  } catch {
    // No memories or kratos not available — that's fine
  }
}

main();
