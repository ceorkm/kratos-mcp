import type { Compressor } from './index.js';
import { RuleCompressor } from './rule-compressor.js';

/**
 * Returns the compressor. Pure logic, no AI, no network calls.
 */
export function createCompressor(): Compressor {
  return new RuleCompressor();
}
