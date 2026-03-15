import type { CLIContext } from '../core.js';
import { CaptureHandler } from '../capture-handler.js';

export async function captureCommand(ctx: CLIContext, opts: {
  event?: string;
}): Promise<void> {
  const handler = new CaptureHandler(ctx);

  // Read event data from stdin
  let inputData: any = {};
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) {
      inputData = JSON.parse(raw);
    }
  } catch {
    // No stdin data or invalid JSON — that's okay
  }

  switch (opts.event) {
    case 'post-tool-use':
      await handler.handlePostToolUse(inputData);
      break;
    case 'session-end':
      await handler.handleSessionEnd(inputData);
      break;
    default:
      // Unknown event type — ignore silently (hooks should not produce errors)
      break;
  }
}
