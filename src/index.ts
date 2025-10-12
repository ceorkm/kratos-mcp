#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';

import { MemoryDatabase } from './memory-server/database.js';
import { ProjectManager } from './project-manager.js';
import { MCPLogger as Logger } from './utils/mcp-logger.js';
import { PIIDetector } from './security/pii-detector.js';

import fs from 'fs-extra';
import path from 'path';

const logger = new Logger('Kratos');

class KratosProtocolServer {
  private server: Server;
  private projectManager: ProjectManager;
  private memoryDb: MemoryDatabase | null = null;
  private piiDetector: PIIDetector;

  constructor() {
    this.server = new Server(
      {
        name: 'kratos-protocol',
        version: '4.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.projectManager = new ProjectManager();
    this.piiDetector = new PIIDetector();

    this.setupHandlers();
  }

  private parseNaturalLanguageQuery(question: string): {
    searchTerms: string[];
    tags: string[];
    timeframe?: string;
    intent: 'search' | 'list' | 'explain' | 'find';
  } {
    const lowerQ = question.toLowerCase();

    // Extract search terms (remove common question words)
    const stopWords = new Set(['show', 'me', 'all', 'the', 'what', 'how', 'when', 'where', 'why', 'find', 'get', 'about', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from']);
    const words = question.split(/\s+/).filter(word =>
      word.length > 2 && !stopWords.has(word.toLowerCase())
    );

    // Detect intent
    let intent: 'search' | 'list' | 'explain' | 'find' = 'search';
    if (lowerQ.includes('show me') || lowerQ.includes('list')) {
      intent = 'list';
    } else if (lowerQ.includes('explain') || lowerQ.includes('what is')) {
      intent = 'explain';
    } else if (lowerQ.includes('find') || lowerQ.includes('where')) {
      intent = 'find';
    }

    // Extract timeframe
    let timeframe: string | undefined;
    if (lowerQ.includes('today')) timeframe = 'today';
    else if (lowerQ.includes('yesterday')) timeframe = 'yesterday';
    else if (lowerQ.includes('this week')) timeframe = 'week';
    else if (lowerQ.includes('last week')) timeframe = 'last_week';
    else if (lowerQ.includes('this month')) timeframe = 'month';

    // Extract potential tags from technical terms
    const tags: string[] = [];
    const techTerms = ['bug', 'error', 'fix', 'debug', 'feature', 'api', 'database', 'auth', 'ui', 'frontend', 'backend'];
    techTerms.forEach(term => {
      if (lowerQ.includes(term)) tags.push(term);
    });

    return {
      searchTerms: words,
      tags,
      timeframe,
      intent
    };
  }

  private generateSearchSuggestions(debugInfo: any): string[] {
    const suggestions: string[] = [];

    if (debugInfo.fallback_used === 'removed_special_chars') {
      suggestions.push('Try using spaces instead of hyphens or special characters');
      suggestions.push('Consider using simpler search terms');
    } else if (debugInfo.fallback_used === 'or_search') {
      suggestions.push('Your search was broadened to find individual words');
      suggestions.push('Try a more specific phrase for exact matches');
    } else if (debugInfo.fallback_used === 'broad_search') {
      suggestions.push('Search was narrowed to just the first word');
      suggestions.push('Consider using different keywords');
    } else if (debugInfo.fallback_used === 'all_failed') {
      suggestions.push('No memories found with those terms');
      suggestions.push('Try broader keywords or check spelling');
      suggestions.push('Use memory_get_recent() to see all recent memories');
    } else if (debugInfo.results?.length === 0) {
      suggestions.push('No results found - try broader search terms');
      suggestions.push('Check if memories exist with memory_get_recent()');
    }

    if (debugInfo.search_time_ms > 100) {
      suggestions.push('Search took longer than expected - consider using more specific terms');
    }

    return suggestions;
  }

  private async initializeProject(): Promise<void> {
    // Skip if already initialized
    if (this.memoryDb) return;

    try {
      // AUTO-DETECT project from current directory
      const workingDir = process.env.KRATOS_PROJECT_ROOT || process.cwd();
      const project = await this.projectManager.detectProject(workingDir);

      logger.debug(`Auto-detected project: ${project.name} at ${project.root}`);

      // Initialize memory database
      this.memoryDb = new MemoryDatabase(project.root, project.id);

      logger.debug(chalk.green(`✅ Project initialized: ${project.name}`));
      logger.debug(chalk.blue(`📁 Project root: ${project.root}`));
      logger.debug(chalk.yellow(`🔐 Isolated data: ~/.kratos/projects/${project.id}/`));
    } catch (error) {
      logger.error('Failed to initialize project:', error);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Memory Management (per-project)
        {
          name: 'memory_save',
          description: 'Save a memory document to the active project',
          inputSchema: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Short, 1-2 line summary' },
              text: { type: 'string', description: 'Full memory content' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
              paths: { type: 'array', items: { type: 'string' }, description: 'File/directory paths (globs)' },
              importance: { type: 'integer', minimum: 1, maximum: 5, description: 'Importance level' },
              ttl: { type: 'integer', description: 'Time to live in seconds' },
            },
            required: ['summary', 'text'],
          },
        },
        {
          name: 'memory_search',
          description: 'Search memory documents in the active project',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Search query' },
              k: { type: 'integer', description: 'Max results to return' },
              require_path_match: { type: 'boolean', description: 'Require path matching' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
              include_expired: { type: 'boolean', description: 'Include expired memories' },
              debug: { type: 'boolean', description: 'Include debug information about search process' },
              scope: { type: 'string', enum: ['project', 'global', 'all'], description: 'Search scope: project (default), global concepts, or all' },
            },
            required: ['q'],
          },
        },
        {
          name: 'memory_get_recent',
          description: 'Get recent memories from active project',
          inputSchema: {
            type: 'object',
            properties: {
              k: { type: 'integer', description: 'Max results' },
              path_prefix: { type: 'string', description: 'Filter by path prefix' },
              include_expired: { type: 'boolean', description: 'Include expired memories' },
            },
          },
        },
        {
          name: 'memory_get',
          description: 'Get a specific memory by ID with full text',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Memory ID to retrieve' },
            },
            required: ['id'],
          },
        },
        {
          name: 'memory_get_multiple',
          description: 'Get multiple memories by IDs with full text (bulk operation)',
          inputSchema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' }, description: 'Array of memory IDs to retrieve' },
            },
            required: ['ids'],
          },
        },
        {
          name: 'memory_ask',
          description: 'Ask questions about your memories using natural language',
          inputSchema: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'Natural language question about your memories' },
              limit: { type: 'integer', description: 'Max results to return (default: 10)' },
            },
            required: ['question'],
          },
        },
        {
          name: 'memory_forget',
          description: 'Delete a memory by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Memory ID to delete' },
            },
            required: ['id'],
          },
        },

        // Security Tools
        {
          name: 'security_scan',
          description: 'Scan text for PII and secrets',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to scan' },
              redact: { type: 'boolean', description: 'Return redacted version' },
            },
            required: ['text'],
          },
        },

        // Project Management
        {
          name: 'project_switch',
          description: 'Switch to a different project',
          inputSchema: {
            type: 'object',
            properties: {
              project_path: { type: 'string', description: 'Path to project directory' },
            },
            required: ['project_path'],
          },
        },
        {
          name: 'project_current',
          description: 'Get current active project',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'change_storage_path',
          description: 'Dynamically change where Kratos stores data (with automatic migration)',
          inputSchema: {
            type: 'object',
            properties: {
              newPath: { type: 'string', description: 'New storage path (e.g., "/opt/kratos" or ".kratos")' },
              migrate: { type: 'boolean', description: 'Migrate existing data to new location (default: true)' },
              backup: { type: 'boolean', description: 'Create backup before migration (default: true)' },
            },
            required: ['newPath'],
          },
        },

        // System Management
        {
          name: 'system_status',
          description: 'Get system status and statistics',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Ensure project is initialized for project-specific operations
      if (name.startsWith('memory_') || name.startsWith('context_') || name.startsWith('prd_')) {
        const project = this.projectManager.getCurrentProject();
        if (!project) {
          await this.initializeProject();
          if (!this.projectManager.getCurrentProject()) {
            return {
              content: [{
                type: 'text',
                text: 'Error: No active project. Set KRATOS_ACTIVE_PROJECT environment variable.'
              }]
            };
          }
        }
      }

      try {
        switch (name) {
          // Memory operations
          case 'memory_save':
            const saveResult = this.memoryDb!.save(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(saveResult, null, 2)
              }]
            };

          case 'memory_search':
            // Additional safety check for database
            if (!this.memoryDb) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    search_scope: 'project (no active project)',
                    count: 0,
                    results: [],
                    error: 'No memory database initialized. Try saving a memory first to initialize the project.'
                  }, null, 2)
                }]
              };
            }

            const scope = (args as any)?.scope || 'project';
            const projectInfo = await this.projectManager.detectProject(process.cwd());

            if ((args as any)?.debug) {
              // Use enhanced search with debug info
              const enhancedResults = this.memoryDb.searchWithDebug(args as any);
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    search_scope: `${scope} (${scope === 'project' ? projectInfo.name : 'global concepts'})`,
                    count: enhancedResults.results.length,
                    results: enhancedResults.results.map(r => ({
                      id: r.memory.id,
                      summary: r.memory.summary,
                      snippet: r.snippet,
                      score: r.score,
                      tags: r.memory.tags,
                      paths: r.memory.paths,
                      importance: r.memory.importance,
                      created_at: r.memory.created_at,
                      _hint: 'Use memory_get with id to retrieve full text'
                    })),
                    debug: {
                      ...enhancedResults.debug_info,
                      suggestions: this.generateSearchSuggestions(enhancedResults.debug_info)
                    }
                  }, null, 2)
                }]
              };
            } else {
              // Regular search
              const searchResults = this.memoryDb.search(args as any);
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    search_scope: `${scope} (${scope === 'project' ? projectInfo.name : 'global concepts'})`,
                    count: searchResults.length,
                    results: searchResults.map(r => ({
                      id: r.memory.id,
                      summary: r.memory.summary,
                      snippet: r.snippet,
                      score: r.score,
                      tags: r.memory.tags,
                      paths: r.memory.paths,
                      importance: r.memory.importance,
                      created_at: r.memory.created_at,
                      _hint: 'Use memory_get with id to retrieve full text'
                    }))
                  }, null, 2)
                }]
              };
            }

          case 'memory_get_recent':
            const recentResults = this.memoryDb!.getRecent(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  count: recentResults.length,
                  memories: recentResults.map(m => ({
                    id: m.id,
                    summary: m.summary,
                    // Return preview only, not full text
                    preview: m.text.substring(0, 150) + (m.text.length > 150 ? '...' : ''),
                    tags: m.tags,
                    paths: m.paths,
                    importance: m.importance,
                    created_at: m.created_at,
                    text_length: m.text.length,
                    _hint: 'Use memory_get with id to retrieve full text'
                  }))
                }, null, 2)
              }]
            };

          case 'memory_get':
            const memory = this.memoryDb!.get(args?.id as string);
            if (!memory) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    error: `Memory not found: ${args?.id}`
                  }, null, 2)
                }]
              };
            }
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(memory, null, 2)
              }]
            };

          case 'memory_get_multiple':
            const ids = (args as any)?.ids || [];
            const memories = this.memoryDb!.getMultiple(ids);
            const found = Object.values(memories).filter(m => m !== null).length;
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  requested: ids.length,
                  found: found,
                  not_found: ids.length - found,
                  memories: memories
                }, null, 2)
              }]
            };

          case 'memory_ask':
            const question = (args as any)?.question || '';
            const limit = (args as any)?.limit || 10;

            // Parse natural language query
            const parsed = this.parseNaturalLanguageQuery(question);
            const nlSearchQuery = parsed.searchTerms.join(' ');

            // Build search parameters
            const searchParams: any = {
              q: nlSearchQuery,
              k: limit,
              tags: parsed.tags.length > 0 ? parsed.tags : undefined,
              debug: true // Always use debug for natural language queries
            };

            // Execute search
            const nlResults = this.memoryDb!.searchWithDebug(searchParams);

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  question: question,
                  understood_as: {
                    search_terms: parsed.searchTerms,
                    intent: parsed.intent,
                    extracted_tags: parsed.tags,
                    timeframe: parsed.timeframe || 'any'
                  },
                  count: nlResults.results.length,
                  results: nlResults.results.map(r => ({
                    id: r.memory.id,
                    summary: r.memory.summary,
                    snippet: r.snippet,
                    score: r.score,
                    tags: r.memory.tags,
                    paths: r.memory.paths,
                    importance: r.memory.importance,
                    created_at: r.memory.created_at,
                    _hint: 'Use memory_get with id to retrieve full text'
                  })),
                  search_debug: {
                    ...nlResults.debug_info,
                    natural_language_parsing: 'Query was automatically converted to search parameters'
                  }
                }, null, 2)
              }]
            };

          case 'memory_forget':
            const forgetResult = this.memoryDb!.forget(args?.id as string);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(forgetResult, null, 2)
              }]
            };

          // Security operations
          case 'security_scan':
            const scanResult = this.piiDetector.detect(args?.text as string);
            if (args?.redact) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    hasPII: scanResult.hasPII,
                    hasSecrets: scanResult.hasSecrets,
                    redactedText: scanResult.redactedText,
                    findings: scanResult.findings
                  }, null, 2)
                }]
              };
            }
            const scanReport = this.piiDetector.scan(args?.text as string);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(scanReport, null, 2)
              }]
            };

          // Project Management
          case 'project_switch':
            const newProject = await this.projectManager.switchProject(args?.project_path as string);

            // Re-initialize memory database for new project
            this.memoryDb = new MemoryDatabase(newProject.root, newProject.id);

            return {
              content: [{
                type: 'text',
                text: `✅ Switched to project: ${newProject.name}\nRoot: ${newProject.root}\nIsolated data: ~/.kratos/projects/${newProject.id}/`
              }]
            };

          case 'project_current':
            const current = this.projectManager.getCurrentProject();
            return {
              content: [{
                type: 'text',
                text: current ? 
                  `Current project: ${current.name}\nRoot: ${current.root}\nID: ${current.id}` :
                  'No active project'
              }]
            };

          case 'change_storage_path':
            const { newPath, migrate = true, backup = true } = (args || {}) as {
              newPath: string;
              migrate?: boolean;
              backup?: boolean;
            };

            try {
              const result = await this.changeStoragePath(newPath, { migrate, backup });
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }]
              };
            } catch (error) {
              throw new McpError(
                ErrorCode.InternalError,
                `Failed to change storage path: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }

          // System operations
          case 'system_status':
            const status = await this.getSystemStatus();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(status, null, 2)
              }]
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Tool error (${name}):`, error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    });

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: 'kratos://system/status',
          name: 'System Status',
          description: 'Current system status and statistics',
          mimeType: 'application/json',
        }
      ];

      const currentProject = this.projectManager.getCurrentProject();
      if (currentProject) {
        resources.push({
          uri: `kratos://project/${currentProject.id}/memories`,
          name: 'Project Memories',
          description: `All memories for project ${currentProject.name}`,
          mimeType: 'application/json',
        });
      }

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === 'kratos://system/status') {
          const status = await this.getSystemStatus();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(status, null, 2)
            }]
          };
        }

        if (uri.includes('/memories')) {
          const memories = this.memoryDb!.search({ q: '*', k: 100 });
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(memories, null, 2)
            }]
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      } catch (error) {
        logger.error(`Resource error: ${error}`);
        throw error;
      }
    });
  }

  private async getSystemStatus(): Promise<any> {
    const status: any = {
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      activeProject: this.projectManager.getCurrentProject(),
      components: {
        memoryDb: !!this.memoryDb,
        piiDetector: true,
      },
      security: {
        piiDetection: 'enabled',
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        kratosProjectRoot: process.env.KRATOS_PROJECT_ROOT,
        kratosActiveProject: process.env.KRATOS_ACTIVE_PROJECT,
      }
    };

    if (this.memoryDb) {
      try {
        const recentMemories = this.memoryDb.getRecent({ k: 5 });
        status.stats = {
          recentMemoryCount: recentMemories.length,
          lastMemoryCreated: recentMemories[0]?.created_at || null,
        };
      } catch (error) {
        // Database might not be initialized yet or table doesn't exist
        status.stats = {
          recentMemoryCount: 0,
          lastMemoryCreated: null,
          error: 'Database not initialized or no memories table'
        };
      }
    }

    return status;
  }

  /**
   * Dynamically change storage path with automatic data migration
   */
  private async changeStoragePath(newPath: string, options: {
    migrate?: boolean;
    backup?: boolean;
  } = {}): Promise<any> {
    const { migrate = true, backup = true } = options;

    // Resolve the new path (handle relative paths)
    const resolvedNewPath = path.isAbsolute(newPath)
      ? newPath
      : path.resolve(process.cwd(), newPath);

    // Get current storage path
    const currentPath = this.projectManager.getKratosHome();

    if (currentPath === resolvedNewPath) {
      return {
        success: true,
        message: 'Already using the specified storage path',
        currentPath,
        newPath: resolvedNewPath
      };
    }

    logger.info(`Changing storage path from ${currentPath} to ${resolvedNewPath}`);

    try {
      // Step 1: Create new directory
      await fs.ensureDir(resolvedNewPath);

      let migratedData = null;

      if (migrate && await fs.pathExists(currentPath)) {
        // Step 2: Create backup if requested
        if (backup) {
          const backupPath = `${currentPath}.backup.${Date.now()}`;
          await fs.copy(currentPath, backupPath);
          logger.info(`Created backup at: ${backupPath}`);
        }

        // Step 3: Migrate data
        logger.info('Migrating data to new location...');
        await fs.copy(currentPath, resolvedNewPath);

        // Count migrated items
        const projects = await this.countProjectsInPath(resolvedNewPath);
        migratedData = { projects };

        logger.info(`Migrated ${projects} projects to new location`);
      }

      // Step 4: Update project manager to use new path
      await this.projectManager.updateKratosHome(resolvedNewPath);

      // Step 5: Reinitialize databases with new path
      await this.reinitializeDatabases();

      return {
        success: true,
        message: 'Storage path changed successfully',
        previousPath: currentPath,
        newPath: resolvedNewPath,
        migrated: migrate,
        backup: backup,
        migratedData
      };

    } catch (error) {
      logger.error('Failed to change storage path:', error);
      throw new Error(`Storage path change failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count projects in a storage path
   */
  private async countProjectsInPath(storagePath: string): Promise<number> {
    try {
      const projectsDir = path.join(storagePath, 'projects');
      if (!await fs.pathExists(projectsDir)) return 0;

      const entries = await fs.readdir(projectsDir);
      return entries.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Reinitialize databases after path change
   */
  private async reinitializeDatabases(): Promise<void> {
    // Close existing connections
    if (this.memoryDb) {
      this.memoryDb.close();
      this.memoryDb = null;
    }

    // Database will be re-initialized lazily on next use
    logger.info('Database reinitialized for new storage path');
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // DO NOT log anything here - it breaks JSON-RPC protocol!
    // Initialization will happen lazily on first tool use

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.memoryDb?.close();
      process.exit(0);
    });

    // Keep process alive
    process.stdin.resume();
  }
}

// Export for testing
export { KratosProtocolServer };

// Run server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new KratosProtocolServer();
  server.run().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}