import type { CLIContext } from '../core.js';
import { Output } from '../output.js';

export async function forgetCommand(ctx: CLIContext, id: string): Promise<void> {
  const result = ctx.memoryDb.forget(id);

  if (result && (result as any).deleted) {
    Output.success(`Memory deleted: ${id}`);
  } else {
    Output.error(`Memory not found or already deleted: ${id}`);
    process.exit(1);
  }
}
