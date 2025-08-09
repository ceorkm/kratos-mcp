#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import { MemoryDatabase } from '../memory-server/database.js';
import { ConceptStore } from '../memory-server/concept-store.js';
import { Logger } from '../utils/logger.js';
import crypto from 'crypto';

const logger = new Logger('Migration');

interface LegacyMemory {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  projectContext?: {
    projectName: string;
    files: string[];
    dependencies: string[];
  };
  metadata: {
    createdAt: string | Date;
    updatedAt: string | Date;
    sessionId?: string;
    [key: string]: any;
  };
}

interface MigrationStats {
  totalFound: number;
  migrated: number;
  skipped: number;
  errors: number;
  conceptsCreated: number;
}

class KratosMigrationTool {
  private stats: MigrationStats = {
    totalFound: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    conceptsCreated: 0
  };

  async migrateProject(projectRoot: string, options: {
    dryRun?: boolean;
    createBackup?: boolean;
    extractConcepts?: boolean;
  } = {}): Promise<MigrationStats> {
    logger.info(`Starting migration for project: ${projectRoot}`);
    
    // 1. Detect legacy memory files
    const legacyMemories = await this.findLegacyMemories(projectRoot);
    this.stats.totalFound = legacyMemories.length;
    
    if (this.stats.totalFound === 0) {
      logger.info('No legacy memories found to migrate');
      return this.stats;
    }

    // 2. Create backup if requested
    if (options.createBackup !== false && !options.dryRun) {
      await this.createBackup(projectRoot);
    }

    // 3. Initialize project if needed
    const { projectId, projectConfig } = await this.initializeProject(projectRoot, options.dryRun || false);
    
    // 4. Create SQLite database
    let memoryDb: MemoryDatabase | null = null;
    if (!options.dryRun) {
      memoryDb = new MemoryDatabase(projectRoot, projectId);
    }

    const conceptStore = ConceptStore.getInstance();
    const conceptCandidates = new Map<string, any>();

    // 5. Migrate each memory
    for (const legacyPath of legacyMemories) {
      try {
        const memory = await this.loadLegacyMemory(legacyPath);
        
        if (options.dryRun) {
          logger.info(`[DRY RUN] Would migrate: ${memory.title}`);
          this.stats.migrated++;
          continue;
        }

        // Convert to new format
        const newMemory = this.convertMemory(memory, projectId);
        
        // Check if it should become a concept
        if (options.extractConcepts !== false && this.shouldBeConcept(memory)) {
          conceptCandidates.set(memory.id, {
            id: this.generateConceptId(memory.title),
            title: memory.title,
            body: this.extractConceptBody(memory.content),
            tags: this.extractConceptTags(memory.tags),
            importance: this.inferImportance(memory)
          });
        } else {
          // Save as regular memory
          memoryDb!.save(newMemory);
          this.stats.migrated++;
        }

      } catch (error) {
        logger.error(`Failed to migrate ${legacyPath}:`, error);
        this.stats.errors++;
      }
    }

    // 6. Create concepts
    if (options.extractConcepts !== false && !options.dryRun) {
      for (const concept of conceptCandidates.values()) {
        try {
          conceptStore.save(concept);
          this.stats.conceptsCreated++;
        } catch (error) {
          logger.error(`Failed to create concept ${concept.id}:`, error);
        }
      }
    }

    // 7. Create migration log
    if (!options.dryRun) {
      await this.createMigrationLog(projectRoot);
    }

    // 8. Cleanup
    if (memoryDb) {
      memoryDb.close();
    }

    logger.info('Migration completed:', this.stats);
    return this.stats;
  }

  private async findLegacyMemories(projectRoot: string): Promise<string[]> {
    const legacyPaths = [
      path.join(projectRoot, '.kratos', 'projects'),
      path.join(projectRoot, '.kratos', 'memory'),
      path.join(projectRoot, 'docs', 'MemoryDocs'),
    ];

    const memoryFiles: string[] = [];

    for (const basePath of legacyPaths) {
      if (await fs.pathExists(basePath)) {
        const files = await this.findJsonFiles(basePath);
        memoryFiles.push(...files);
      }
    }

    return memoryFiles;
  }

  private async findJsonFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        const subFiles = await this.findJsonFiles(fullPath);
        files.push(...subFiles);
      } else if (item.isFile() && item.name.endsWith('.json') && item.name !== 'index.json') {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async loadLegacyMemory(filePath: string): Promise<LegacyMemory> {
    const data = await fs.readJson(filePath);
    
    // Handle different legacy formats
    if (data.memories && Array.isArray(data.memories)) {
      // V1 format: multiple memories in one file
      return data.memories[0]; // Take first one for now
    }
    
    if (data.id && data.title && data.content) {
      // V2 format: single memory per file
      return data;
    }
    
    throw new Error(`Unrecognized memory format in ${filePath}`);
  }

  private convertMemory(legacy: LegacyMemory, projectId: string): {
    summary: string;
    text: string;
    tags?: string[];
    paths?: string[];
    importance?: number;
    ttl?: number;
  } {
    // Map legacy types to new types
    const typeMapping: Record<string, string> = {
      'fixed-guide': 'fixed-guide',
      'architecture': 'architecture', 
      'open-issue': 'open-issue',
      'audit': 'audit',
      'reference': 'reference',
      'progress': 'progress',
      'feature': 'feature',
    };

    const mappedType = typeMapping[legacy.type] || 'reference';
    
    // Extract paths from legacy project context
    const paths = legacy.projectContext?.files?.map(f => 
      path.dirname(f) + '/*'
    ) || [];

    // Add unique project paths
    const uniquePaths = [...new Set(paths)];

    return {
      summary: legacy.title,
      text: legacy.content,
      tags: [...(legacy.tags || []), mappedType],
      paths: uniquePaths,
      importance: this.inferImportance(legacy),
      ttl: this.calculateTTL(legacy)
    };
  }

  private inferImportance(memory: LegacyMemory): number {
    // Infer importance based on type and content
    if (memory.type === 'architecture') return 5;
    if (memory.type === 'fixed-guide') return 4;
    if (memory.type === 'feature') return 4;
    if (memory.type === 'audit') return 3;
    if (memory.type === 'progress') return 3;
    if (memory.type === 'open-issue') return 2;
    return 2; // reference
  }

  private calculateTTL(memory: LegacyMemory): number | undefined {
    // Only set TTL for low-importance memories
    const importance = this.inferImportance(memory);
    if (importance <= 2) {
      return 21 * 24 * 60 * 60; // 21 days in seconds
    }
    return undefined; // No TTL for important memories
  }

  private shouldBeConcept(memory: LegacyMemory): boolean {
    // Heuristics for concept extraction
    const conceptKeywords = [
      'pattern', 'template', 'checklist', 'guide', 'best practice',
      'algorithm', 'formula', 'standard', 'convention', 'protocol'
    ];

    const content = `${memory.title} ${memory.content}`.toLowerCase();
    const hasConceptKeywords = conceptKeywords.some(keyword => content.includes(keyword));
    
    // Path-free content (good for reusability)
    const hasSpecificPaths = (memory.projectContext?.files?.length || 0) > 0;
    
    // High value content
    const isHighImportance = this.inferImportance(memory) >= 4;
    
    return hasConceptKeywords && !hasSpecificPaths && isHighImportance;
  }

  private extractConceptBody(content: string): string {
    // Clean and truncate for concept format (600-900 chars recommended)
    let cleaned = content
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic
      .replace(/`([^`]+)`/g, '$1') // Remove code ticks
      .trim();

    if (cleaned.length > 900) {
      // Truncate at sentence boundary
      const sentences = cleaned.split(/[.!?]+/);
      cleaned = '';
      for (const sentence of sentences) {
        if (cleaned.length + sentence.length > 850) break;
        cleaned += sentence + '.';
      }
    }

    return cleaned;
  }

  private extractConceptTags(originalTags: string[]): string[] {
    // Filter and enhance tags for concepts
    const technicalTags = originalTags.filter(tag => 
      !['open-issue', 'progress', 'audit'].includes(tag)
    );
    
    return [...technicalTags, 'pattern'];
  }

  private generateConceptId(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    return `${base}-migrated`;
  }

  private async initializeProject(projectRoot: string, dryRun: boolean): Promise<{
    projectId: string;
    projectConfig: any;
  }> {
    const projectJsonPath = path.join(projectRoot, '.kratos', 'project.json');
    
    let projectConfig;
    if (await fs.pathExists(projectJsonPath)) {
      projectConfig = await fs.readJson(projectJsonPath);
    } else {
      // Create new project config
      projectConfig = {
        project_id: `proj_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        name: path.basename(projectRoot),
        root: projectRoot,
        repo_hash: await this.getGitHash(projectRoot),
        migrated_at: new Date().toISOString(),
        migration_version: '2.0'
      };

      if (!dryRun) {
        await fs.ensureDir(path.dirname(projectJsonPath));
        await fs.writeJson(projectJsonPath, projectConfig, { spaces: 2 });
      }
    }

    return {
      projectId: projectConfig.project_id,
      projectConfig
    };
  }

  private async getGitHash(projectRoot: string): Promise<string | undefined> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const git = spawn('git', ['rev-parse', 'HEAD'], { 
          cwd: projectRoot, 
          stdio: 'pipe' 
        });
        let hash = '';
        git.stdout.on('data', (data) => { hash += data.toString(); });
        git.on('close', () => resolve(hash.trim() || undefined));
        git.on('error', () => resolve(undefined));
      });
    } catch {
      return undefined;
    }
  }

  private async createBackup(projectRoot: string): Promise<void> {
    const backupDir = path.join(projectRoot, '.kratos', 'backup', `pre-migration-${Date.now()}`);
    const sourceDir = path.join(projectRoot, '.kratos');
    
    await fs.ensureDir(backupDir);
    await fs.copy(sourceDir, backupDir, {
      filter: (src) => !src.includes('backup') && !src.includes('memory.db')
    });
    
    logger.info(`Backup created: ${backupDir}`);
  }

  private async createMigrationLog(projectRoot: string): Promise<void> {
    const logPath = path.join(projectRoot, '.kratos', 'migration.log');
    const log = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      stats: this.stats,
      notes: 'Migrated from JSON-based to SQLite-based memory storage'
    };
    
    await fs.writeJson(logPath, log, { spaces: 2 });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const projectRoot = args[0] || process.cwd();
  
  const options = {
    dryRun: args.includes('--dry-run'),
    createBackup: !args.includes('--no-backup'),
    extractConcepts: !args.includes('--no-concepts')
  };

  if (options.dryRun) {
    logger.info('🔍 DRY RUN MODE - No changes will be made');
  }

  const migrationTool = new KratosMigrationTool();
  
  try {
    const stats = await migrationTool.migrateProject(projectRoot, options);
    
    console.log('\n📊 Migration Summary:');
    console.log(`├─ Total found: ${stats.totalFound}`);
    console.log(`├─ Migrated: ${stats.migrated}`);
    console.log(`├─ Concepts created: ${stats.conceptsCreated}`);
    console.log(`├─ Errors: ${stats.errors}`);
    console.log(`└─ Skipped: ${stats.skipped}`);
    
    if (stats.errors > 0) {
      console.log('\n⚠️  Some migrations failed. Check logs for details.');
      process.exit(1);
    } else {
      console.log('\n✅ Migration completed successfully!');
      if (!options.dryRun) {
        console.log(`\n🎯 Next steps:`);
        console.log(`1. Test the new system: npm run start:v4`);
        console.log(`2. Update your MCP config to use the new server`);
        console.log(`3. Verify memories: > memory.search q="test"`);
      }
    }
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { KratosMigrationTool };