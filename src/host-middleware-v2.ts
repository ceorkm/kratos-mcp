#!/usr/bin/env node
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { Logger } from './utils/logger.js';

const logger = new Logger('KratosMiddlewareV2');

interface ProjectConfig {
  project_id: string;
  name: string;
  root: string;
  repo_hash?: string;
}

interface KratosConfig {
  mode: 'hard' | 'soft' | 'smart';
  autosave: boolean;
  confirm_on_save: boolean;
  budget_bytes: number;
  top_k: number;
  ttl_days_low: number;
  allowlist_concepts: string[];
  triggers: string[];
  redact: string[];
}

interface ExtractionCandidate {
  summary: string;
  text: string;
  tags: string[];
  paths: string[];
  importance: number;
  pattern: string;
}

interface TurnContext {
  cwd: string;
  openFiles: string[];
  userMessage?: string;
  assistantMessage?: string;
  toolCalls: Array<{ name: string; args: any; result?: any }>;
  timestamp: Date;
}

class KratosMiddlewareV2 {
  private mcpProcess: any;
  private currentTurn: TurnContext;
  private activeProject: ProjectConfig | null = null;
  private config: KratosConfig;
  private redactPatterns: RegExp[];
  private triggerPatterns: RegExp[];

  constructor() {
    this.currentTurn = {
      cwd: process.cwd(),
      openFiles: [],
      toolCalls: [],
      timestamp: new Date(),
    };
    
    this.config = this.loadConfig();
    this.redactPatterns = this.config.redact.map(pattern => new RegExp(pattern, 'gi'));
    this.triggerPatterns = this.config.triggers.map(pattern => new RegExp(pattern, 'i'));
  }

  async start(mcpServerPath: string) {
    // Detect and load active project
    await this.detectActiveProject();
    
    // Start MCP server
    this.mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        KRATOS_ACTIVE_PROJECT: this.activeProject?.project_id || '',
        KRATOS_PROJECT_ROOT: this.activeProject?.root || process.cwd(),
      },
    });

    this.setupCommunication();
    
    logger.info('🔱 Kratos Middleware V2 - Production Ready');
    logger.info(`📁 Active Project: ${this.activeProject?.name || 'None'}`);
    logger.info(`🎯 Mode: ${this.config.mode.toUpperCase()}`);
    logger.info(`💾 Auto-save: ${this.config.autosave ? 'ON' : 'OFF'}`);
    logger.info(`💰 Budget: ${this.config.budget_bytes} bytes, Top-K: ${this.config.top_k}`);
  }

  private loadConfig(): KratosConfig {
    const defaultConfig: KratosConfig = {
      mode: 'hard',
      autosave: true,
      confirm_on_save: false,
      budget_bytes: 1024,
      top_k: 5,
      ttl_days_low: 21,
      allowlist_concepts: [],
      triggers: [
        '(decision:|we chose|we\'ll use)',
        '(fixed:|bugfix|root cause)',
        '(feature shipped|progress:)',
        '(path:|routes:|endpoint:)',
        '(call me \\w+)',
        '(remind me|todo:)',
        '(prefer(s)? .+)',
        '(always .+|never .+)',
      ],
      redact: [
        '(sk_live_[A-Za-z0-9]+)',
        '(sk_test_[A-Za-z0-9]+)',
        '([A-Fa-f0-9]{64})', // SHA256 hashes
        '(api[_-]?key[s]?\\s*[:=]\\s*["\']?([^"\'\\s]+))',
        '(password[s]?\\s*[:=]\\s*["\']?([^"\'\\s]+))',
        '(secret[s]?\\s*[:=]\\s*["\']?([^"\'\\s]+))',
        '(token[s]?\\s*[:=]\\s*["\']?([^"\'\\s]+))',
      ],
    };

    // Try to load project-specific config
    const configPath = path.join(process.cwd(), '.kratos', 'config.yaml');
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as Partial<KratosConfig>;
        return { ...defaultConfig, ...fileConfig };
      } catch (error) {
        logger.warn('Failed to load config, using defaults:', error);
      }
    }

    return defaultConfig;
  }

  private async detectActiveProject(): Promise<void> {
    const projectJsonPath = path.join(process.cwd(), '.kratos', 'project.json');
    
    if (fs.existsSync(projectJsonPath)) {
      try {
        this.activeProject = await fs.readJson(projectJsonPath);
        logger.info(`Loaded project: ${this.activeProject?.name}`);
      } catch (error) {
        logger.warn('Failed to load project.json:', error);
      }
    } else {
      // Create default project
      const projectId = this.generateProjectId();
      this.activeProject = {
        project_id: projectId,
        name: path.basename(process.cwd()),
        root: process.cwd(),
        repo_hash: await this.getRepoHash(),
      };
      
      await fs.ensureDir(path.dirname(projectJsonPath));
      await fs.writeJson(projectJsonPath, this.activeProject, { spaces: 2 });
      logger.info(`Created new project: ${this.activeProject.name}`);
    }
  }

  private async getRepoHash(): Promise<string | undefined> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const git = spawn('git', ['rev-parse', 'HEAD'], { stdio: 'pipe' });
        let hash = '';
        git.stdout.on('data', (data) => { hash += data.toString(); });
        git.on('close', () => resolve(hash.trim() || undefined));
        git.on('error', () => resolve(undefined));
      });
    } catch {
      return undefined;
    }
  }

  private generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private setupCommunication() {
    // Host → MCP
    const stdinReader = createInterface({ input: process.stdin });
    stdinReader.on('line', (line) => {
      try {
        const message = JSON.parse(line);
        this.interceptHostToMcp(message);
        this.mcpProcess.stdin.write(line + '\n');
      } catch (e) {
        // Forward non-JSON lines as-is
        this.mcpProcess.stdin.write(line + '\n');
      }
    });

    // MCP → Host  
    const mcpReader = createInterface({ input: this.mcpProcess.stdout });
    mcpReader.on('line', (line) => {
      try {
        const message = JSON.parse(line);
        this.interceptMcpToHost(message);
        process.stdout.write(line + '\n');
      } catch (e) {
        // Forward non-JSON lines as-is
        process.stdout.write(line + '\n');
      }
    });

    // Error handling
    this.mcpProcess.stderr.on('data', (data: Buffer) => {
      logger.error('MCP stderr:', data.toString());
    });
  }

  private interceptHostToMcp(message: any) {
    // Track tool calls and context
    if (message.method === 'tools/call') {
      this.currentTurn.toolCalls.push({
        name: message.params?.name,
        args: message.params?.arguments,
      });
    }

    // Update context from host
    if (message.params?.context) {
      this.currentTurn.openFiles = message.params.context.openFiles || [];
      this.currentTurn.cwd = message.params.context.cwd || this.currentTurn.cwd;
    }

    // Track user messages
    if (message.method === 'conversation/user' || message.params?.role === 'user') {
      this.currentTurn.userMessage = message.params?.content || message.params?.message;
    }
  }

  private interceptMcpToHost(message: any) {
    // Track tool results
    if (message.id && this.currentTurn.toolCalls.length > 0) {
      const lastTool = this.currentTurn.toolCalls[this.currentTurn.toolCalls.length - 1];
      if (!lastTool.result) {
        lastTool.result = message.result;
      }
    }

    // Track assistant responses
    if (message.params?.role === 'assistant' || message.method === 'conversation/assistant') {
      this.currentTurn.assistantMessage = message.params?.content || message.params?.message;
    }

    // Detect turn completion and trigger processing
    if (this.isTurnComplete(message)) {
      setImmediate(() => this.processTurnEnd());
    }
  }

  private isTurnComplete(message: any): boolean {
    // Multiple heuristics for turn detection
    return (
      message.method === 'turn/complete' ||
      message.method === 'conversation/complete' ||
      (message.result && this.currentTurn.assistantMessage) ||
      (this.currentTurn.toolCalls.length > 0 && message.result)
    );
  }

  private async processTurnEnd() {
    if (!this.config.autosave || !this.activeProject) return;

    try {
      // Extract important facts from the dialogue
      const candidates = this.extractImportantFacts();
      
      for (const candidate of candidates) {
        if (this.config.confirm_on_save) {
          // In production, this would integrate with the host's confirmation system
          logger.info(`Would save: ${candidate.summary} (confirmation required)`);
        } else {
          await this.autoSaveMemory(candidate);
        }
      }

      // Inject context for next turn if needed
      if (this.currentTurn.openFiles.length > 0) {
        await this.injectContext();
      }

    } catch (error) {
      logger.error('Turn processing failed:', error);
    } finally {
      // Reset turn state
      this.resetTurn();
    }
  }

  private extractImportantFacts(): ExtractionCandidate[] {
    const candidates: ExtractionCandidate[] = [];
    const dialogue = this.buildDialogue();

    // Pattern-based extraction
    for (const [index, pattern] of this.triggerPatterns.entries()) {
      const match = dialogue.match(pattern);
      if (match) {
        const candidate = this.buildCandidate(match, this.config.triggers[index], dialogue);
        if (candidate) {
          candidates.push(candidate);
        }
      }
    }

    // Tool-based pattern detection
    const toolPatterns = this.detectToolPatterns();
    candidates.push(...toolPatterns);

    // Deduplicate by summary
    return this.deduplicateCandidates(candidates);
  }

  private buildCandidate(
    match: RegExpMatchArray, 
    pattern: string, 
    dialogue: string
  ): ExtractionCandidate | null {
    const matchedText = match[0];
    const summary = this.generateSummary(matchedText, pattern);
    const text = this.redactSecrets(this.extractContext(dialogue, match.index || 0));
    
    // Classify and tag
    const { type, tags, importance } = this.classifyContent(pattern, text);
    const paths = this.extractPaths(text);

    return {
      summary,
      text,
      tags: [...tags, type],
      paths,
      importance,
      pattern
    };
  }

  private detectToolPatterns(): ExtractionCandidate[] {
    const candidates: ExtractionCandidate[] = [];
    
    // Bug fix detection
    if (this.hasBugFixPattern()) {
      candidates.push({
        summary: 'Bug fix documented',
        text: this.buildDialogue(),
        tags: ['bugfix', 'auto-detected'],
        paths: this.inferPathsFromFiles(),
        importance: 4,
        pattern: 'tool-pattern-bugfix'
      });
    }

    // Architecture decision detection
    if (this.hasArchitecturePattern()) {
      candidates.push({
        summary: 'Architecture decision made',
        text: this.buildDialogue(),
        tags: ['architecture', 'decision', 'auto-detected'],
        paths: this.inferPathsFromFiles(),
        importance: 5,
        pattern: 'tool-pattern-architecture'
      });
    }

    return candidates;
  }

  private hasBugFixPattern(): boolean {
    const hasErrorSearch = this.currentTurn.toolCalls.some(t => 
      t.name === 'memory.search' && 
      JSON.stringify(t.args).toLowerCase().includes('error')
    );
    
    const hasCodeChanges = this.currentTurn.toolCalls.some(t =>
      ['memory.save', 'prd.update'].includes(t.name)
    );
    
    return hasErrorSearch && hasCodeChanges;
  }

  private hasArchitecturePattern(): boolean {
    const hasPRDAccess = this.currentTurn.toolCalls.some(t => t.name === 'prd.fetch');
    const hasContextCheck = this.currentTurn.toolCalls.some(t => t.name === 'context.preview');
    
    return hasPRDAccess && hasContextCheck;
  }

  private async autoSaveMemory(candidate: ExtractionCandidate) {
    const saveRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'memory.save',
        arguments: {
          summary: candidate.summary,
          text: candidate.text,
          tags: candidate.tags,
          paths: candidate.paths,
          importance: candidate.importance,
          ttl: this.calculateTTL(candidate.importance),
        }
      }
    };

    this.mcpProcess.stdin.write(JSON.stringify(saveRequest) + '\n');
    logger.info(`Auto-saved: ${candidate.summary}`);
  }

  private async injectContext() {
    const previewRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'context.preview',
        arguments: {
          open_files: this.currentTurn.openFiles,
          task: this.currentTurn.userMessage || 'Current task',
          budget_bytes: this.config.budget_bytes,
          top_k: this.config.top_k
        }
      }
    };

    this.mcpProcess.stdin.write(JSON.stringify(previewRequest) + '\n');
  }

  private buildDialogue(): string {
    const parts: string[] = [];
    
    if (this.currentTurn.userMessage) {
      parts.push(`User: ${this.currentTurn.userMessage}`);
    }
    
    if (this.currentTurn.assistantMessage) {
      parts.push(`Assistant: ${this.currentTurn.assistantMessage}`);
    }
    
    // Include relevant tool calls
    for (const tool of this.currentTurn.toolCalls) {
      if (this.isRelevantTool(tool.name)) {
        parts.push(`Tool: ${tool.name}(${JSON.stringify(tool.args)})`);
        if (tool.result) {
          const resultStr = JSON.stringify(tool.result).substring(0, 200);
          parts.push(`Result: ${resultStr}...`);
        }
      }
    }
    
    return parts.join('\n\n');
  }

  private isRelevantTool(toolName: string): boolean {
    const relevantTools = ['memory.save', 'prd.update', 'concept.search', 'memory.search'];
    return relevantTools.includes(toolName);
  }

  private redactSecrets(text: string): string {
    let redacted = text;
    for (const pattern of this.redactPatterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  private generateSummary(matchedText: string, pattern: string): string {
    // Smart summary generation based on pattern type
    if (pattern.includes('decision')) {
      return `Decision: ${matchedText.substring(0, 60)}...`;
    }
    if (pattern.includes('bugfix|fixed')) {
      return `Fix: ${matchedText.substring(0, 60)}...`;
    }
    if (pattern.includes('call me')) {
      const nameMatch = matchedText.match(/call me (\w+)/i);
      return `Preference: Call user "${nameMatch?.[1] || 'Unknown'}"`;
    }
    if (pattern.includes('remind me')) {
      return `TODO: ${matchedText.replace(/remind me to?/i, '').trim()}`;
    }
    
    return `Auto-captured: ${matchedText.substring(0, 60)}...`;
  }

  private extractContext(dialogue: string, matchIndex: number): string {
    // Extract surrounding context (±200 chars)
    const start = Math.max(0, matchIndex - 200);
    const end = Math.min(dialogue.length, matchIndex + 400);
    return dialogue.substring(start, end);
  }

  private classifyContent(pattern: string, text: string): { 
    type: string; 
    tags: string[]; 
    importance: number; 
  } {
    if (pattern.includes('decision')) {
      return { type: 'architecture', tags: ['decision'], importance: 5 };
    }
    if (pattern.includes('bugfix|fixed')) {
      return { type: 'fixed-guide', tags: ['bug', 'fix'], importance: 4 };
    }
    if (pattern.includes('call me|prefer')) {
      return { type: 'reference', tags: ['preference'], importance: 3 };
    }
    if (pattern.includes('remind|todo')) {
      return { type: 'open-issue', tags: ['todo'], importance: 3 };
    }
    if (pattern.includes('feature|progress')) {
      return { type: 'progress', tags: ['feature'], importance: 4 };
    }
    
    return { type: 'reference', tags: ['general'], importance: 2 };
  }

  private extractPaths(text: string): string[] {
    const pathPatterns = [
      /(?:^|\s)([a-zA-Z0-9_-]+\/[a-zA-Z0-9_\/-]+\.(?:js|ts|py|go|java|cpp|h))/g,
      /(?:path|route|endpoint):\s*([^\s]+)/gi,
      /(?:file|dir):\s*([^\s]+)/gi,
    ];
    
    const paths = new Set<string>();
    
    for (const pattern of pathPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        paths.add(match[1]);
      }
    }
    
    return Array.from(paths);
  }

  private inferPathsFromFiles(): string[] {
    return this.currentTurn.openFiles
      .map(file => path.relative(this.activeProject?.root || process.cwd(), file))
      .filter(p => !p.startsWith('..')) // Only include files within project
      .map(p => path.dirname(p) + '/*'); // Convert to glob patterns
  }

  private calculateTTL(importance: number): number {
    // TTL in seconds based on importance
    const baseDays = this.config.ttl_days_low;
    const multiplier = Math.max(1, importance - 1);
    return baseDays * multiplier * 24 * 60 * 60;
  }

  private deduplicateCandidates(candidates: ExtractionCandidate[]): ExtractionCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = candidate.summary.toLowerCase().replace(/[^\w]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private resetTurn() {
    this.currentTurn = {
      cwd: this.currentTurn.cwd,
      openFiles: [],
      toolCalls: [],
      timestamp: new Date(),
    };
  }
}

// CLI Entry Point
const mcpServerPath = process.argv[2] || './dist/index-v4.js';
const middleware = new KratosMiddlewareV2();

process.on('SIGINT', () => {
  logger.info('Shutting down middleware...');
  process.exit(0);
});

middleware.start(mcpServerPath).catch(error => {
  logger.error('Middleware failed:', error);
  process.exit(1);
});