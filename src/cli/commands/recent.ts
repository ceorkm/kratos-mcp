import type { CLIContext } from '../core.js';
import { Output } from '../output.js';

export async function recentCommand(ctx: CLIContext, opts: {
  limit?: string;
  pathPrefix?: string;
}): Promise<void> {
  const k = opts.limit ? parseInt(opts.limit, 10) : 10;

  const memories = ctx.memoryDb.getRecent({
    k,
    path_prefix: opts.pathPrefix,
  });

  Output.header(`Recent memories (${ctx.project.name})`);
  Output.dim(`Showing ${memories.length} of last ${k} requested`);

  for (const m of memories) {
    Output.memoryCard({
      id: m.id,
      summary: m.summary,
      tags: m.tags,
      paths: m.paths,
      importance: m.importance,
      created_at: m.created_at,
    });
  }
}
