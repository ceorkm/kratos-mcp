#!/usr/bin/env node

/**
 * PostToolUse hook — captures file edits and commands as memories.
 * Receives tool use data on stdin from Claude Code.
 * Runs after Edit, Write, MultiEdit, Bash tools.
 */

import { execFileSync } from 'child_process';
import path from 'path';

const MAX_SUMMARY = 200;

async function main() {
  let input = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    process.exit(0); // bad input, skip silently
  }

  const toolName = input.tool_name || '';
  const toolInput = input.tool_input || {};

  let summary = '';
  let tags = 'auto-capture';
  let paths = '';

  if (['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
    const filePath = toolInput.file_path || '';
    const fileName = path.basename(filePath);
    summary = `Edited ${fileName}`;
    if (toolInput.old_string && toolInput.new_string) {
      summary += `: ${toolInput.new_string.substring(0, 80).replace(/\n/g, ' ')}`;
    }
    tags = 'auto-capture,file-edit';
    paths = filePath;
  } else if (toolName === 'Bash') {
    const cmd = toolInput.command || '';
    summary = `Ran: ${cmd.substring(0, 120)}`;
    tags = 'auto-capture,command';
  }

  if (!summary) process.exit(0);

  // Truncate summary
  if (summary.length > MAX_SUMMARY) {
    summary = summary.substring(0, MAX_SUMMARY - 3) + '...';
  }

  // Save via kratos CLI
  try {
    const args = ['save', summary, '--tags', tags, '--importance', '2'];
    if (paths) args.push('--paths', paths);

    execFileSync('kratos', args, {
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    // Don't block Claude if save fails
  }
}

main();
