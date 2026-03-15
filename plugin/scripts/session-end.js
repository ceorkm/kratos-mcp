#!/usr/bin/env node

/**
 * SessionEnd hook — cleanup.
 * Clears any remaining session buffer.
 * Timeout is 1.5s by default, so keep this fast.
 */

import path from 'path';
import fs from 'fs';

const kratosHome = path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
const projectsDir = path.join(kratosHome, 'projects');

try {
  if (fs.existsSync(projectsDir)) {
    const entries = fs.readdirSync(projectsDir);
    for (const entry of entries) {
      const bufferPath = path.join(projectsDir, entry, 'sessions', 'current.json');
      if (fs.existsSync(bufferPath)) {
        fs.unlinkSync(bufferPath);
      }
    }
  }
} catch {
  // Cleanup is best-effort
}
