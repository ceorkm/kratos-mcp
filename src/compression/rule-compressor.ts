import type { Compressor, CompressedResult } from './index.js';

/**
 * Rule-based compressor — always available, no external dependencies.
 * Extracts key information and truncates intelligently.
 */
export class RuleCompressor implements Compressor {
  async compress(text: string): Promise<CompressedResult> {
    const original_length = text.length;

    // Strategy:
    // 1. Extract first meaningful sentence
    // 2. Extract key technical terms (file paths, function names, etc.)
    // 3. Truncate to ~200 chars

    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // Get first meaningful line
    let firstLine = lines[0] || text.substring(0, 100);
    firstLine = firstLine.trim();

    // Extract file paths
    const pathMatches = text.match(/(?:\/[\w.-]+)+/g) || [];
    const uniquePaths = [...new Set(pathMatches)].slice(0, 3);

    // Extract technical terms (CamelCase, snake_case, function calls)
    const techTerms = text.match(/\b[A-Z][a-z]+[A-Z]\w+\b|\b\w+_\w+\b|\b\w+\(\)/g) || [];
    const uniqueTerms = [...new Set(techTerms)].slice(0, 5);

    // Build summary
    let summary = firstLine;

    // Add technical context if the first line is short
    if (summary.length < 100 && uniqueTerms.length > 0) {
      summary += ' [' + uniqueTerms.join(', ') + ']';
    }

    if (summary.length < 150 && uniquePaths.length > 0) {
      summary += ' (' + uniquePaths.join(', ') + ')';
    }

    // Truncate to 200 chars
    if (summary.length > 200) {
      summary = summary.substring(0, 197) + '...';
    }

    return {
      summary,
      original_length,
      compressed_length: summary.length,
      compression_ratio: 1 - summary.length / original_length,
    };
  }
}
