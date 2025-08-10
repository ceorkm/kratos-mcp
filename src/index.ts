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
import { ConceptStore } from './memory-server/concept-store.js';
import { ContextBroker } from './memory-server/context-broker.js';
// Evidence Guard removed - was flaky and not useful
import { PRDManager } from './modules/prd/index.js';
import { PromptManager } from './modules/prompt/index.js';
import { ProjectManager } from './project-manager.js';
import { MCPLogger as Logger } from './utils/mcp-logger.js';
import { EncryptionManager } from './security/encryption.js';
import { PIIDetector } from './security/pii-detector.js';
import { DataRetentionManager } from './security/data-retention.js';

import fs from 'fs-extra';
import path from 'path';

const logger = new Logger('Kratos');

class KratosProtocolServer {
  private server: Server;
  private projectManager: ProjectManager;
  private memoryDb: MemoryDatabase | null = null;
  private conceptStore: ConceptStore | null = null;
  private contextBroker: ContextBroker | null = null;
  // Evidence Guard removed - was flaky and not delivering value
  private prdManager: PRDManager;
  private promptManager: PromptManager;
  
  // Security components
  private encryption: EncryptionManager | null = null;
  private piiDetector: PIIDetector;
  private dataRetention: DataRetentionManager | null = null;

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
    this.prdManager = new PRDManager();
    this.promptManager = new PromptManager();
    this.piiDetector = new PIIDetector();

    this.setupHandlers();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.memoryDb || !this.conceptStore || !this.contextBroker) {
      await this.initializeProject();
      if (!this.memoryDb || !this.conceptStore || !this.contextBroker) {
        throw new Error('Failed to initialize project. Check project configuration.');
      }
    }
  }

  private async initializeProject(): Promise<void> {
    // Skip if already initialized
    if (this.memoryDb) return;
    
    try {
      // AUTO-DETECT project from current directory
      // No more manual project ID needed!
      const workingDir = process.env.KRATOS_PROJECT_ROOT || process.cwd();
      const project = await this.projectManager.detectProject(workingDir);
      
      logger.info(`Auto-detected project: ${project.name} at ${project.root}`);
      
      // Initialize components with ISOLATED project
      this.memoryDb = new MemoryDatabase(project.root, project.id);
      this.conceptStore = ConceptStore.getInstance(project.id);
      this.contextBroker = new ContextBroker(project.root, project.id);
      
      // Initialize security components
      this.encryption = new EncryptionManager(project.root, project.id);
      this.dataRetention = new DataRetentionManager(project.root, project.id);

      logger.info(chalk.green(`✅ Project initialized: ${project.name}`));
      logger.info(chalk.blue(`📁 Project root: ${project.root}`));
      logger.info(chalk.yellow(`🔐 Isolated data: ~/.kratos/projects/${project.id}/`));
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
        {
          name: 'memory_link',
          description: 'Link a global concept to the current project',
          inputSchema: {
            type: 'object',
            properties: {
              concept_id: { type: 'string', description: 'Global concept ID to link' },
              local_tags: { type: 'array', items: { type: 'string' }, description: 'Additional local tags' },
            },
            required: ['concept_id'],
          },
        },

        // Global Concept Store
        {
          name: 'concept_search',
          description: 'Search global concept store',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Search query' },
              k: { type: 'integer', description: 'Max results' },
              allowlist: { type: 'array', items: { type: 'string' }, description: 'Concept ID allowlist' },
            },
            required: ['q'],
          },
        },
        {
          name: 'concept_get',
          description: 'Get a specific concept by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Concept ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'concept_save',
          description: 'Save a concept to global store',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Optional concept ID' },
              title: { type: 'string', description: 'Concept title' },
              body: { type: 'string', description: 'Concept body (600-900 chars recommended)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Concept tags' },
              importance: { type: 'integer', minimum: 1, maximum: 5, description: 'Importance level' },
            },
            required: ['title', 'body'],
          },
        },
        {
          name: 'concept_allowlist',
          description: 'Manage project concept allowlist',
          inputSchema: {
            type: 'object',
            properties: {
              add: { type: 'array', items: { type: 'string' }, description: 'Concept IDs to add' },
              remove: { type: 'array', items: { type: 'string' }, description: 'Concept IDs to remove' },
              list: { type: 'boolean', description: 'List current allowlist' },
            },
          },
        },

        // Context Management
        {
          name: 'context_preview',
          description: 'Preview context injection for current task',
          inputSchema: {
            type: 'object',
            properties: {
              open_files: { type: 'array', items: { type: 'string' }, description: 'Currently open files' },
              task: { type: 'string', description: 'Current task description' },
              budget_bytes: { type: 'integer', description: 'Maximum context size in bytes' },
              top_k: { type: 'integer', description: 'Maximum number of injections' },
              mode: { type: 'string', enum: ['hard', 'soft', 'smart'], description: 'Injection mode' },
            },
            required: ['task'],
          },
        },
        {
          name: 'context_rules_get',
          description: 'Get current context injection rules',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'context_rules_set',
          description: 'Update context injection rules',
          inputSchema: {
            type: 'object',
            properties: {
              maxMemoryAge: { type: 'integer', description: 'Max memory age in milliseconds' },
              minImportance: { type: 'integer', description: 'Minimum importance threshold' },
              pathBoostMultiplier: { type: 'number', description: 'Path matching boost multiplier' },
              conceptImportanceThreshold: { type: 'integer', description: 'Concept importance threshold' },
              dedupeThreshold: { type: 'number', description: 'Deduplication threshold' },
            },
          },
        },

        // PRD Management (Pillar 1)
        {
          name: 'prd_fetch',
          description: 'Fetch PRD content for feature or path',
          inputSchema: {
            type: 'object',
            properties: {
              feature: { type: 'string', description: 'Feature name' },
              path: { type: 'string', description: 'File path' },
            },
          },
        },
        {
          name: 'prd_update',
          description: 'Update PRD content',
          inputSchema: {
            type: 'object',
            properties: {
              feature: { type: 'string', description: 'Feature name' },
              content: { type: 'string', description: 'Updated content' },
              section: { type: 'string', description: 'PRD section to update' },
            },
            required: ['feature', 'content'],
          },
        },

        // Prompt Engineering (Pillar 2)
        {
          name: 'prompt_build',
          description: 'Build a structured prompt using best practices',
          inputSchema: {
            type: 'object',
            properties: {
              role: { type: 'string', description: 'AI role/persona' },
              goal: { type: 'string', description: 'Task goal' },
              scope: { type: 'string', description: 'Task scope' },
              files: { type: 'array', items: { type: 'string' }, description: 'Relevant files' },
              plan: { type: 'string', description: 'Execution plan' },
              verify: { type: 'string', description: 'Verification criteria' },
              memory_refs: { type: 'array', items: { type: 'string' }, description: 'Memory references to include' },
            },
            required: ['goal'],
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
        {
          name: 'security_encrypt',
          description: 'Encrypt sensitive data for storage',
          inputSchema: {
            type: 'object',
            properties: {
              data: { type: 'object', description: 'Data to encrypt' },
            },
            required: ['data'],
          },
        },
        {
          name: 'security_rbac_check',
          description: 'Check user access permission',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: { type: 'string', description: 'User ID' },
              action: { type: 'string', enum: ['read', 'write', 'search', 'delete', 'admin'], description: 'Action to check' },
              resource: { type: 'string', description: 'Optional resource identifier' },
            },
            required: ['user_id', 'action'],
          },
        },
        {
          name: 'security_rbac_grant',
          description: 'Grant user permission to project',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: { type: 'string', description: 'User ID' },
              permissions: { type: 'array', items: { type: 'string' }, description: 'Permissions to grant' },
            },
            required: ['user_id', 'permissions'],
          },
        },
        {
          name: 'security_retention_apply',
          description: 'Apply retention policy to memory',
          inputSchema: {
            type: 'object',
            properties: {
              memory_id: { type: 'string', description: 'Memory ID' },
              policy: { type: 'string', enum: ['default', 'temporary', 'important', 'permanent'], description: 'Retention policy' },
            },
            required: ['memory_id', 'policy'],
          },
        },
        {
          name: 'security_gdpr_delete',
          description: 'Delete data (GDPR right to erasure)',
          inputSchema: {
            type: 'object',
            properties: {
              target_type: { type: 'string', enum: ['memory', 'project', 'user'], description: 'Type of data to delete' },
              target_id: { type: 'string', description: 'ID of target to delete' },
              user_id: { type: 'string', description: 'User requesting deletion' },
              reason: { type: 'string', description: 'Reason for deletion' },
            },
            required: ['target_type', 'target_id', 'user_id', 'reason'],
          },
        },
        {
          name: 'security_gdpr_export',
          description: 'Export user data (GDPR compliance)',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: { type: 'string', description: 'User ID to export data for' },
            },
            required: ['user_id'],
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
          name: 'project_list',
          description: 'List all known projects',
          inputSchema: {
            type: 'object',
            properties: {},
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
        
        // System Management
        {
          name: 'system_status',
          description: 'Get system status and statistics',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'system_migrate',
          description: 'Migrate from legacy JSON format to SQLite',
          inputSchema: {
            type: 'object',
            properties: {
              dry_run: { type: 'boolean', description: 'Perform dry run without changes' },
              create_backup: { type: 'boolean', description: 'Create backup before migration' },
              extract_concepts: { type: 'boolean', description: 'Extract concepts during migration' },
            },
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
            const searchResults = this.memoryDb!.search(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  count: searchResults.length,
                  results: searchResults.map(r => ({
                    id: r.memory.id,
                    summary: r.memory.summary,
                    text: r.memory.text.substring(0, 200) + '...',
                    score: r.score,
                    tags: r.memory.tags,
                    paths: r.memory.paths,
                    importance: r.memory.importance,
                    created_at: r.memory.created_at,
                    snippet: r.snippet
                  }))
                }, null, 2)
              }]
            };

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
                    tags: m.tags,
                    paths: m.paths,
                    importance: m.importance,
                    created_at: m.created_at
                  }))
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

          case 'memory_link':
            await this.ensureInitialized();
            const concept = this.conceptStore!.get(args?.concept_id as string);
            if (!concept) {
              throw new Error(`Concept not found: ${args?.concept_id}`);
            }
            
            const linkedMemory = this.memoryDb!.save({
              summary: `Linked: ${concept.title}`,
              text: concept.body,
              tags: [...concept.tags, ...(args?.local_tags as string[] || []), 'linked-concept'],
              importance: concept.importance
            });
            
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ ...linkedMemory, concept_id: concept.id }, null, 2)
              }]
            };

          // Concept operations
          case 'concept_search':
            if (!this.conceptStore) {
              throw new McpError(
                ErrorCode.InternalError,
                'Concept store not initialized'
              );
            }
            // Handle empty query or missing query by returning all concepts
            const searchQuery = (args?.q as string) || '*';
            const conceptSearchResults = this.conceptStore.search({
              q: searchQuery.trim() || '*',  // Default to wildcard if empty
              k: args?.k as number || 10,
              allowlist: args?.allowlist as string[],
              projectId: undefined  // Don't filter by project to show all global concepts
            });
            
            // If no results and query wasn't wildcard, try wildcard as fallback
            let finalConceptResults = conceptSearchResults;
            if (conceptSearchResults.length === 0 && searchQuery !== '*') {
              finalConceptResults = this.conceptStore.search({
                q: '*',
                k: args?.k as number || 10,
                allowlist: args?.allowlist as string[]
              });
            }
            
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  query: searchQuery,
                  count: finalConceptResults.length,
                  concepts: finalConceptResults.map(c => ({
                    id: c.concept.id,
                    title: c.concept.title,
                    body: c.concept.body.substring(0, 200) + '...',
                    tags: c.concept.tags,
                    importance: c.concept.importance,
                    score: c.score
                  })),
                  note: finalConceptResults.length === 0 ? 
                    'No concepts found. Concepts need to be created first with concept_save.' : 
                    searchQuery === '*' ? 
                    'Showing all available global concepts' : 
                    `Found ${finalConceptResults.length} concepts matching "${searchQuery}"`
                }, null, 2)
              }]
            };

          case 'concept_get':
            if (!this.conceptStore) {
              throw new McpError(
                ErrorCode.InternalError,
                'Concept store not initialized'
              );
            }
            const conceptResult = this.conceptStore.get(args?.id as string);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(conceptResult, null, 2)
              }]
            };

          case 'concept_save':
            if (!this.conceptStore) {
              throw new McpError(
                ErrorCode.InternalError,
                'Concept store not initialized'
              );
            }
            const conceptSaveResult = this.conceptStore.save(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(conceptSaveResult, null, 2)
              }]
            };

          case 'concept_allowlist':
            if (!this.conceptStore) {
              throw new Error('Concept store not initialized');
            }
            const currentProj = this.projectManager.getCurrentProject();
            const allowlistResult = this.conceptStore.updateAllowlist({
              projectId: currentProj?.id || 'global',
              ...args
            } as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(allowlistResult, null, 2)
              }]
            };

          // Evidence Guard operations
          // Context operations
          case 'context_preview':
            const preview = await this.contextBroker!.preview(args as any);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(preview, null, 2)
              }]
            };

          case 'context_rules_get':
            const rules = this.contextBroker!.getRules();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(rules, null, 2)
              }]
            };

          case 'context_rules_set':
            this.contextBroker!.setRules(args as any);
            return {
              content: [{
                type: 'text',
                text: 'Context rules updated successfully'
              }]
            };

          // PRD operations
          case 'prd_fetch':
            const prdResult = await this.prdManager.getPRD((args?.feature as string) || (args?.path as string));
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(prdResult, null, 2)
              }]
            };

          case 'prd_update':
            const updateResult = await this.prdManager.updatePRD(
              args?.section as string,
              args?.content
            );
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(updateResult, null, 2)
              }]
            };

          // Prompt operations
          case 'prompt_build':
            const promptArgs = {
              task: args?.goal as string,
              role: args?.role as string,
              stack: args?.files as string[],
              fileContext: args?.files as string[],
              templateId: args?.templateId as string
            };
            const promptResult = await this.promptManager.generatePrompt(promptArgs);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(promptResult, null, 2)
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

          case 'security_encrypt':
            if (!this.encryption) {
              throw new Error('Encryption not initialized. Initialize project first.');
            }
            const encrypted = this.encryption.encryptJSON(args?.data);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ encrypted, projectId: this.projectManager.getCurrentProject()?.id }, null, 2)
              }]
            };


          case 'security_retention_apply':
            if (!this.dataRetention) {
              throw new Error('Data retention not initialized. Initialize project first.');
            }
            this.dataRetention.applyPolicy(
              args?.memory_id as string,
              args?.policy as string
            );
            return {
              content: [{
                type: 'text',
                text: `Applied ${args?.policy} retention policy to memory ${args?.memory_id}`
              }]
            };

          case 'security_gdpr_delete':
            if (!this.dataRetention) {
              throw new Error('Data retention not initialized. Initialize project first.');
            }
            await this.dataRetention.deleteData({
              targetType: args?.target_type as any,
              targetId: args?.target_id as string,
              userId: args?.user_id as string,
              reason: args?.reason as string
            });
            return {
              content: [{
                type: 'text',
                text: `Deleted ${args?.target_type} ${args?.target_id} per GDPR request`
              }]
            };

          case 'security_gdpr_export':
            if (!this.dataRetention) {
              throw new Error('Data retention not initialized. Initialize project first.');
            }
            const exportData = await this.dataRetention.exportUserData(args?.user_id as string);
            return {
              content: [{
                type: 'text',
                text: exportData
              }]
            };

          // Project Management
          case 'project_switch':
            const newProject = await this.projectManager.switchProject(args?.project_path as string);
            
            // Re-initialize components for new project
            this.memoryDb = new MemoryDatabase(newProject.root, newProject.id);
            this.conceptStore = ConceptStore.getInstance(newProject.id);
            this.contextBroker = new ContextBroker(newProject.root, newProject.id);
            
            return {
              content: [{
                type: 'text',
                text: `✅ Switched to project: ${newProject.name}\nRoot: ${newProject.root}\nIsolated data: ~/.kratos/projects/${newProject.id}/`
              }]
            };
            
          case 'project_list':
            const projects = this.projectManager.listProjects();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(projects.map(p => ({
                  name: p.name,
                  root: p.root,
                  lastAccessed: p.lastAccessed,
                  id: p.id
                })), null, 2)
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

          // System operations
          case 'system_status':
            const status = await this.getSystemStatus();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(status, null, 2)
              }]
            };

          case 'system_migrate':
            // Import migration tool
            const { KratosMigrationTool } = await import('./tools/migrate-to-sqlite.js');
            const migrationTool = new KratosMigrationTool();
            const migrationResult = await migrationTool.migrateProject(
              this.projectManager.getCurrentProject()?.root || process.cwd(),
              args as any
            );
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(migrationResult, null, 2)
              }]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
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
        },
        {
          uri: 'kratos://concepts/all',
          name: 'All Concepts',
          description: 'Global concept store contents',
          mimeType: 'application/json',
        }
      ];

      const currentProject = this.projectManager.getCurrentProject();
      if (currentProject) {
        resources.push(
          {
            uri: `kratos://project/${currentProject.id}/memories`,
            name: 'Project Memories',
            description: `All memories for project ${currentProject.name}`,
            mimeType: 'application/json',
          },
          {
            uri: `kratos://project/${currentProject.id}/prd`,
            name: 'Project PRD',
            description: `PRD for project ${currentProject.name}`,
            mimeType: 'application/json',
          }
        );
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

        if (uri === 'kratos://concepts/all') {
          if (!this.conceptStore) {
            throw new McpError(
              ErrorCode.InternalError,
              'Concept store not initialized'
            );
          }
          const concepts = this.conceptStore.search({ q: '*', k: 100 });
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(concepts, null, 2)
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
        conceptStore: !!this.conceptStore,
        contextBroker: !!this.contextBroker,
        prdManager: !!this.prdManager,
        promptManager: !!this.promptManager,
        encryption: !!this.encryption,
        dataRetention: !!this.dataRetention,
      },
      security: {
        encryption: this.encryption ? 'AES-256-GCM' : 'disabled',
        piiDetection: 'enabled',
        dataRetention: this.dataRetention ? 'enabled' : 'disabled',
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
      const recentMemories = this.memoryDb.getRecent({ k: 5 });
      status.stats = {
        recentMemoryCount: recentMemories.length,
        lastMemoryCreated: recentMemories[0]?.created_at || null,
      };
    }

    if (this.dataRetention) {
      status.retentionStats = this.dataRetention.getStats();
    }

    return status;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // DO NOT log anything here - it breaks JSON-RPC protocol!
    // Initialization will happen lazily on first tool use
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      this.memoryDb?.close();
      this.contextBroker?.close();
      this.conceptStore?.close();
      this.dataRetention?.close();
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