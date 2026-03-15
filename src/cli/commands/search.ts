import type { CLIContext } from '../core.js';
import { Output } from '../output.js';
import type { SearchResult } from '../../memory-server/database.js';

export async function searchCommand(ctx: CLIContext, query: string, opts: {
  limit?: string;
  tags?: string;
  debug?: boolean;
  pathMatch?: boolean;
}): Promise<void> {
  const k = opts.limit ? parseInt(opts.limit, 10) : 10;
  const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()) : undefined;

  if (opts.debug) {
    const enhanced = ctx.memoryDb.searchWithDebug({
      q: query,
      k,
      tags,
      require_path_match: opts.pathMatch,
    });

    Output.header(`Search results for "${query}"`);
    Output.dim(`Found ${enhanced.results.length} results in ${enhanced.debug_info.search_time_ms}ms`);
    if (enhanced.debug_info.fallback_used) {
      Output.warn(`Fallback used: ${enhanced.debug_info.fallback_used}`);
    }

    renderResults(enhanced.results);
  } else {
    const results = ctx.memoryDb.search({
      q: query,
      k,
      tags,
      require_path_match: opts.pathMatch,
    });

    Output.header(`Search results for "${query}"`);
    Output.dim(`Found ${results.length} results`);

    renderResults(results);
  }
}

function renderResults(results: SearchResult[]): void {
  for (const r of results) {
    Output.memoryCard({
      id: r.memory.id,
      summary: r.memory.summary,
      tags: r.memory.tags,
      paths: r.memory.paths,
      importance: r.memory.importance,
      created_at: r.memory.created_at,
      score: r.score,
      snippet: r.snippet,
    });
  }
}
