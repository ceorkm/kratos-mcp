import type { CLIContext } from '../core.js';
import { Output } from '../output.js';

export async function askCommand(ctx: CLIContext, question: string, opts: {
  limit?: string;
}): Promise<void> {
  const limit = opts.limit ? parseInt(opts.limit, 10) : 10;

  // Parse natural language query (same logic as MCP server)
  const parsed = parseNaturalLanguageQuery(question);
  const searchQuery = parsed.searchTerms.join(' ');

  if (!searchQuery) {
    Output.warn('Could not extract search terms from your question. Try rephrasing.');
    return;
  }

  const enhanced = ctx.memoryDb.searchWithDebug({
    q: searchQuery,
    k: limit,
    tags: parsed.tags.length > 0 ? parsed.tags : undefined,
  });

  Output.header(`Answer for: "${question}"`);
  Output.dim(`Understood as: ${parsed.intent} → "${searchQuery}"${parsed.tags.length > 0 ? ` [tags: ${parsed.tags.join(', ')}]` : ''}`);
  Output.dim(`Found ${enhanced.results.length} relevant memories`);

  for (const r of enhanced.results) {
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

function parseNaturalLanguageQuery(question: string): {
  searchTerms: string[];
  tags: string[];
  timeframe?: string;
  intent: 'search' | 'list' | 'explain' | 'find';
} {
  const lowerQ = question.toLowerCase();

  const stopWords = new Set([
    'show', 'me', 'all', 'the', 'what', 'how', 'when', 'where', 'why',
    'find', 'get', 'about', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'from', 'did', 'do', 'does', 'is', 'are', 'was', 'were',
    'have', 'has', 'had', 'can', 'could', 'would', 'should', 'will',
    'know', 'tell', 'give', 'learned', 'remember', 'recall',
  ]);
  const words = question.split(/\s+/).filter(
    word => word.length > 2 && !stopWords.has(word.toLowerCase())
  );

  let intent: 'search' | 'list' | 'explain' | 'find' = 'search';
  if (lowerQ.includes('show me') || lowerQ.includes('list')) intent = 'list';
  else if (lowerQ.includes('explain') || lowerQ.includes('what is')) intent = 'explain';
  else if (lowerQ.includes('find') || lowerQ.includes('where')) intent = 'find';

  let timeframe: string | undefined;
  if (lowerQ.includes('today')) timeframe = 'today';
  else if (lowerQ.includes('yesterday')) timeframe = 'yesterday';
  else if (lowerQ.includes('this week')) timeframe = 'week';

  const tags: string[] = [];
  const techTerms = ['bug', 'error', 'fix', 'debug', 'feature', 'api', 'database', 'auth', 'ui', 'frontend', 'backend'];
  for (const term of techTerms) {
    if (lowerQ.includes(term)) tags.push(term);
  }

  return { searchTerms: words, tags, timeframe, intent };
}
