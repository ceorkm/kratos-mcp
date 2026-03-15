export interface Compressor {
  compress(text: string, context?: string): Promise<CompressedResult>;
}

export interface CompressedResult {
  summary: string;
  original_length: number;
  compressed_length: number;
  compression_ratio: number;
}
