import { MCPLogger as Logger } from '../utils/mcp-logger.js';

const logger = new Logger('PIIDetector');

export interface DetectionResult {
  hasPII: boolean;
  hasSecrets: boolean;
  redactedText: string;
  findings: Finding[];
}

export interface Finding {
  type: 'pii' | 'secret' | 'high-entropy';
  pattern: string;
  confidence: number;
  redacted: string;
}

/**
 * PII and Secret Detection with entropy analysis
 */
export class PIIDetector {
  // PII Patterns
  private piiPatterns = [
    // SSN
    { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'pii' },
    // Credit Card
    { name: 'Credit Card', regex: /\b(?:\d[ -]*?){13,16}\b/g, type: 'pii' },
    // Email
    { name: 'Email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'pii' },
    // Phone
    { name: 'Phone', regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, type: 'pii' },
    // IP Address
    { name: 'IP Address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, type: 'pii' },
    // Date of Birth (various formats)
    { name: 'DOB', regex: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g, type: 'pii' },
  ];

  // Secret Patterns
  private secretPatterns = [
    // API Keys (generic)
    { name: 'API Key', regex: /\b[A-Za-z0-9]{32,}\b/g, type: 'secret' },
    // AWS Keys
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, type: 'secret' },
    { name: 'AWS Secret Key', regex: /[0-9a-zA-Z/+=]{40}/g, type: 'secret', entropyCheck: true },
    // GitHub Token
    { name: 'GitHub Token', regex: /ghp_[0-9a-zA-Z]{36}/g, type: 'secret' },
    { name: 'GitHub Token', regex: /gho_[0-9a-zA-Z]{36}/g, type: 'secret' },
    // JWT
    { name: 'JWT', regex: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, type: 'secret' },
    // Private Key
    { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, type: 'secret' },
    // Password in config
    { name: 'Password', regex: /(?:password|passwd|pwd|pass)[\s]*[:=][\s]*["']?([^"'\s]+)["']?/gi, type: 'secret' },
    // Bearer Token
    { name: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9-._~+/]+=*/g, type: 'secret' },
    // Slack Token
    { name: 'Slack Token', regex: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, type: 'secret' },
    // Stripe Key
    { name: 'Stripe Key', regex: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}/g, type: 'secret' },
  ];

  private allowlist: Set<string> = new Set();

  constructor(allowlist?: string[]) {
    if (allowlist) {
      this.allowlist = new Set(allowlist);
    }
  }

  /**
   * Detect PII and secrets in text
   */
  detect(text: string): DetectionResult {
    const findings: Finding[] = [];
    let redactedText = text;

    // Check PII patterns
    for (const pattern of this.piiPatterns) {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        const value = match[0];
        
        // Skip if in allowlist
        if (this.allowlist.has(value)) continue;

        const redacted = this.redact(value, pattern.type as 'pii' | 'secret');
        findings.push({
          type: pattern.type as 'pii' | 'secret',
          pattern: pattern.name,
          confidence: 0.9,
          redacted
        });

        redactedText = redactedText.replace(value, redacted);
      }
    }

    // Check secret patterns
    for (const pattern of this.secretPatterns) {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        const value = match[0];
        
        // Skip if in allowlist
        if (this.allowlist.has(value)) continue;

        // Check entropy if required
        if (pattern.entropyCheck && !this.hasHighEntropy(value)) {
          continue;
        }

        const redacted = this.redact(value, pattern.type as 'pii' | 'secret');
        findings.push({
          type: pattern.type as 'pii' | 'secret',
          pattern: pattern.name,
          confidence: pattern.entropyCheck ? 0.7 : 0.9,
          redacted
        });

        redactedText = redactedText.replace(value, redacted);
      }
    }

    // Entropy-based detection for unknown secrets
    const highEntropyStrings = this.findHighEntropyStrings(text);
    for (const str of highEntropyStrings) {
      if (this.allowlist.has(str)) continue;
      
      const redacted = this.redact(str, 'secret');
      findings.push({
        type: 'high-entropy',
        pattern: 'High Entropy String',
        confidence: 0.6,
        redacted
      });

      redactedText = redactedText.replace(str, redacted);
    }

    return {
      hasPII: findings.some(f => f.type === 'pii'),
      hasSecrets: findings.some(f => f.type === 'secret' || f.type === 'high-entropy'),
      redactedText,
      findings
    };
  }

  /**
   * Calculate Shannon entropy
   */
  private calculateEntropy(str: string): number {
    const frequencies = new Map<string, number>();
    
    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    const len = str.length;

    for (const freq of frequencies.values()) {
      const p = freq / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Check if string has high entropy (likely random/secret)
   */
  private hasHighEntropy(str: string, threshold: number = 4.5): boolean {
    if (str.length < 10) return false;
    return this.calculateEntropy(str) > threshold;
  }

  /**
   * Find high entropy strings in text
   */
  private findHighEntropyStrings(text: string): string[] {
    const results: string[] = [];
    
    // Find continuous alphanumeric strings
    const candidates = text.match(/[A-Za-z0-9+/=_-]{20,}/g) || [];
    
    for (const candidate of candidates) {
      if (this.hasHighEntropy(candidate)) {
        results.push(candidate);
      }
    }

    return results;
  }

  /**
   * Redact sensitive information
   */
  private redact(value: string, type: 'pii' | 'secret' | 'high-entropy'): string {
    if (type === 'pii') {
      // Show partial for PII
      if (value.includes('@')) {
        // Email - show domain
        const parts = value.split('@');
        return `[REDACTED_EMAIL]@${parts[1]}`;
      }
      if (value.length > 4) {
        // Show last 4 chars
        return `[REDACTED_${type.toUpperCase()}...${value.slice(-4)}]`;
      }
    }
    
    // Complete redaction for secrets
    return `[REDACTED_${type.toUpperCase()}]`;
  }

  /**
   * Add items to allowlist
   */
  addToAllowlist(items: string[]): void {
    for (const item of items) {
      this.allowlist.add(item);
    }
    logger.info(`Added ${items.length} items to allowlist`);
  }

  /**
   * Remove items from allowlist
   */
  removeFromAllowlist(items: string[]): void {
    for (const item of items) {
      this.allowlist.delete(item);
    }
    logger.info(`Removed ${items.length} items from allowlist`);
  }

  /**
   * Get current allowlist
   */
  getAllowlist(): string[] {
    return Array.from(this.allowlist);
  }

  /**
   * Scan and report (without redaction)
   */
  scan(text: string): { findings: Finding[]; riskScore: number } {
    const result = this.detect(text);
    
    // Calculate risk score
    let riskScore = 0;
    for (const finding of result.findings) {
      if (finding.type === 'secret' || finding.type === 'high-entropy') {
        riskScore += finding.confidence * 10;
      } else if (finding.type === 'pii') {
        riskScore += finding.confidence * 5;
      }
    }

    return {
      findings: result.findings,
      riskScore: Math.min(riskScore, 100)
    };
  }
}