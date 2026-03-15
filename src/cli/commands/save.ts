import type { CLIContext } from '../core.js';
import { Output } from '../output.js';

export async function saveCommand(ctx: CLIContext, text: string, opts: {
  tags?: string;
  paths?: string;
  importance?: string;
  compress?: boolean;
}): Promise<void> {
  const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()) : [];
  const paths = opts.paths ? opts.paths.split(',').map(p => p.trim()) : [];
  const importance = opts.importance ? parseInt(opts.importance, 10) : 3;

  let summary = text.substring(0, 100);
  let fullText = text;

  // If compress flag is set, use rule-based compression (pure logic, no AI)
  if (opts.compress) {
    try {
      const { createCompressor } = await import('../../compression/factory.js');
      const compressor = createCompressor();
      const result = await compressor.compress(text);
      summary = result.summary;
      Output.dim(`Compressed: ${result.original_length} → ${result.compressed_length} chars (${Math.round(result.compression_ratio * 100)}% reduction)`);
    } catch {
      Output.warn('Compression failed, using raw text');
    }
  }

  const result = ctx.memoryDb.save({
    summary,
    text: fullText,
    tags,
    paths,
    importance,
  });

  Output.success(`Memory saved: ${(result as any).id}`);
  Output.dim(`Project: ${ctx.project.name} | Tags: ${tags.join(', ') || 'none'} | Importance: ${importance}`);
}
