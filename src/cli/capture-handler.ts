import type { CLIContext } from './core.js';
import { createCompressor } from '../compression/factory.js';
import path from 'path';
import fs from 'fs-extra';

const MAX_STDIN_SIZE = 1024 * 1024; // 1MB limit on captured data

interface SessionBuffer {
  sessionId: string;
  startedAt: number;
  events: CapturedEvent[];
}

interface CapturedEvent {
  timestamp: number;
  type: string;
  summary: string;
  paths: string[];
  tags: string[];
}

export class CaptureHandler {
  private ctx: CLIContext;
  private bufferPath: string;
  private compressor = createCompressor();

  constructor(ctx: CLIContext) {
    this.ctx = ctx;
    const kratosHome = path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
    this.bufferPath = path.join(kratosHome, 'projects', ctx.project.id, 'sessions', 'current.json');
  }

  async handlePostToolUse(data: any): Promise<void> {
    const toolName = data?.tool_name || data?.toolName || 'unknown';
    const toolInput = data?.tool_input || data?.input || {};

    let summary = '';
    let filePaths: string[] = [];
    let tags = ['auto-capture'];

    if (['Edit', 'Write', 'MultiEdit'].includes(toolName)) {
      const filePath = toolInput.file_path || toolInput.path || '';
      summary = `Edited file: ${path.basename(filePath)}`;
      filePaths = filePath ? [filePath] : [];
      tags.push('file-edit');
    } else if (toolName === 'Bash') {
      const cmd = toolInput.command || '';
      summary = `Ran command: ${cmd.substring(0, 80)}`;
      tags.push('command');
    } else {
      summary = `Used tool: ${toolName}`;
      tags.push('tool-use');
    }

    // Compress with rule-based compressor
    const compressed = await this.compressor.compress(summary);

    // Truncate raw data to prevent DB bloat
    const rawText = JSON.stringify(data, null, 2);
    const text = rawText.length > MAX_STDIN_SIZE
      ? rawText.substring(0, MAX_STDIN_SIZE) + '\n... (truncated)'
      : rawText;

    this.ctx.memoryDb.save({
      summary: compressed.summary,
      text,
      tags,
      paths: filePaths,
      importance: 2,
    });

    await this.appendToBuffer({
      timestamp: Date.now(),
      type: toolName,
      summary,
      paths: filePaths,
      tags,
    });
  }

  async handleSessionEnd(_data: any): Promise<void> {
    const buffer = await this.loadBuffer();
    if (!buffer || buffer.events.length === 0) return;

    const duration = Math.round((Date.now() - buffer.startedAt) / 1000 / 60);
    const fileEdits = buffer.events.filter(e => e.tags.includes('file-edit'));
    const commands = buffer.events.filter(e => e.tags.includes('command'));
    const uniqueFiles = [...new Set(fileEdits.flatMap(e => e.paths))];

    let summaryText = `Session (${duration}min): ${buffer.events.length} actions, ${fileEdits.length} edits, ${commands.length} commands`;

    let detailText = summaryText + '\n\n';
    detailText += `Files modified:\n${uniqueFiles.map(f => `  - ${f}`).join('\n')}\n\n`;
    detailText += `Actions:\n${buffer.events.map(e => `  - ${e.summary}`).join('\n')}`;

    const compressed = await this.compressor.compress(detailText);

    this.ctx.memoryDb.save({
      summary: compressed.summary,
      text: detailText,
      tags: ['auto-capture', 'session-summary'],
      paths: uniqueFiles,
      importance: 4,
    });

    await this.clearBuffer();
  }

  private async appendToBuffer(event: CapturedEvent): Promise<void> {
    let buffer = await this.loadBuffer();

    if (!buffer) {
      buffer = {
        sessionId: `sess_${Date.now()}`,
        startedAt: Date.now(),
        events: [],
      };
    }

    buffer.events.push(event);
    await fs.ensureDir(path.dirname(this.bufferPath));
    await fs.writeJson(this.bufferPath, buffer, { spaces: 2 });
  }

  private async loadBuffer(): Promise<SessionBuffer | null> {
    try {
      if (await fs.pathExists(this.bufferPath)) {
        return await fs.readJson(this.bufferPath);
      }
    } catch {
      // Corrupted buffer
    }
    return null;
  }

  private async clearBuffer(): Promise<void> {
    try {
      await fs.remove(this.bufferPath);
    } catch {
      // Ignore
    }
  }
}
