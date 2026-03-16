#!/usr/bin/env node

/**
 * Stop hook — saves session summary.
 * The "prompt" hook in hooks.json already asked Claude to summarize.
 * This command hook saves the session buffer as a high-importance memory.
 *
 * Note: prompt and command hooks on the same event run in parallel,
 * so this saves the raw session buffer. The prompt hook's summary
 * goes back to Claude as context — Claude can then call kratos save
 * with the compressed version via the skill.
 */

import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

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

  // Check stop_hook_active to prevent infinite loops
  if (input.stop_hook_active) {
    process.exit(0);
  }

  // Read session buffer if it exists
  const kratosHome = path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
  const cwd = input.cwd || process.cwd();

  // Try to find current project's session buffer
  // We look for any current.json in the sessions directories
  const projectsDir = path.join(kratosHome, 'projects');
  let sessionEvents = [];

  try {
    if (fs.existsSync(projectsDir)) {
      const entries = fs.readdirSync(projectsDir);
      for (const entry of entries) {
        const bufferPath = path.join(projectsDir, entry, 'sessions', 'current.json');
        if (fs.existsSync(bufferPath)) {
          const buffer = JSON.parse(fs.readFileSync(bufferPath, 'utf-8'));
          if (buffer.events && buffer.events.length > 0) {
            sessionEvents = buffer.events;
            // Clean up the buffer
            fs.unlinkSync(bufferPath);
            break;
          }
        }
      }
    }
  } catch {
    // No buffer, that's fine
  }

  if (sessionEvents.length === 0) {
    process.exit(0);
  }

  // Build session summary
  const fileEdits = sessionEvents.filter(e => e.tags?.includes('file-edit'));
  const commands = sessionEvents.filter(e => e.tags?.includes('command'));
  const uniqueFiles = [...new Set(fileEdits.flatMap(e => e.paths || []))];

  const summary = `Session: ${sessionEvents.length} actions, ${fileEdits.length} edits, ${commands.length} commands`;

  try {
    const args = [
      'save', summary,
      '--tags', 'auto-capture,session-summary',
      '--importance', '4',
    ];
    if (uniqueFiles.length > 0) {
      args.push('--paths', uniqueFiles.join(','));
    }

    execFileSync('npx', ['kratos-mcp', ...args], {
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    // Don't block
  }
}

main();
