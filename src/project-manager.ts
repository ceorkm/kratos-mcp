import { MCPLogger as Logger } from './utils/mcp-logger.js';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';

const logger = new Logger('ProjectManager');

export interface Project {
  id: string;
  name: string;
  root: string;
  createdAt: Date;
  lastAccessed: Date;
}

/**
 * Smart Project Manager - Handles project isolation and auto-detection
 * 
 * KEY FEATURES:
 * - Each project gets COMPLETELY ISOLATED database
 * - Auto-detects project from working directory
 * - No memory pollution between projects
 * - Clean project switching
 */
export class ProjectManager {
  private kratosHome: string;
  private currentProject: Project | null = null;
  private projectsCache: Map<string, Project> = new Map();
  
  constructor() {
    // All Kratos data lives in user home, organized by project
    this.kratosHome = path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
    fs.ensureDirSync(this.kratosHome);
    this.loadProjectsCache();
  }
  
  /**
   * Auto-detect project from current working directory
   * Creates a project ID based on the directory path
   */
  async detectProject(workingDir?: string): Promise<Project> {
    const dir = workingDir || process.cwd();
    
    // Look for project markers in order of preference
    const markers = [
      '.git',           // Git repo
      'package.json',   // Node project
      'Cargo.toml',     // Rust project
      'go.mod',         // Go project
      'pyproject.toml', // Python project
      '.kratos',        // Existing Kratos project
    ];
    
    let projectRoot = dir;
    let found = false;
    
    // Walk up directory tree to find project root
    let currentDir = dir;
    while (currentDir !== path.dirname(currentDir)) {
      for (const marker of markers) {
        if (await fs.pathExists(path.join(currentDir, marker))) {
          projectRoot = currentDir;
          found = true;
          break;
        }
      }
      if (found) break;
      currentDir = path.dirname(currentDir);
    }
    
    // Generate stable project ID from path
    const projectId = this.generateProjectId(projectRoot);
    const projectName = path.basename(projectRoot);
    
    // Check if we already know this project
    let project = this.projectsCache.get(projectId);
    
    if (!project) {
      // New project - create it
      project = {
        id: projectId,
        name: projectName,
        root: projectRoot,
        createdAt: new Date(),
        lastAccessed: new Date()
      };
      
      // Create isolated project directory
      const projectDir = this.getProjectDir(projectId);
      await fs.ensureDir(projectDir);
      
      // Save project metadata
      await fs.writeJson(
        path.join(projectDir, 'project.json'),
        project,
        { spaces: 2 }
      );
      
      this.projectsCache.set(projectId, project);
      logger.info(`Created new project: ${projectName} (${projectId})`);
    } else {
      // Update last accessed
      project.lastAccessed = new Date();
    }
    
    this.currentProject = project;
    this.saveProjectsCache();
    
    return project;
  }
  
  /**
   * Switch to a different project
   */
  async switchProject(projectIdOrPath: string): Promise<Project> {
    // Check if it's a project ID
    let project = this.projectsCache.get(projectIdOrPath);
    
    if (!project) {
      // Maybe it's a path - detect project from it
      if (await fs.pathExists(projectIdOrPath)) {
        project = await this.detectProject(projectIdOrPath);
      } else {
        throw new Error(`Project not found: ${projectIdOrPath}`);
      }
    }
    
    this.currentProject = project;
    project.lastAccessed = new Date();
    this.saveProjectsCache();
    
    logger.info(`Switched to project: ${project.name}`);
    return project;
  }
  
  /**
   * Get the isolated directory for a project
   * This is where ALL project data lives - memories, concepts, etc.
   */
  getProjectDir(projectId?: string): string {
    const id = projectId || this.currentProject?.id;
    if (!id) {
      throw new Error('No active project');
    }
    return path.join(this.kratosHome, 'projects', id);
  }
  
  /**
   * Get database path for current project
   * COMPLETELY ISOLATED - no cross-contamination possible
   */
  getDatabasePath(dbName: string): string {
    const projectDir = this.getProjectDir();
    return path.join(projectDir, 'databases', `${dbName}.db`);
  }
  
  /**
   * List all known projects
   */
  listProjects(): Project[] {
    return Array.from(this.projectsCache.values())
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
  }
  
  /**
   * Get current active project
   */
  getCurrentProject(): Project | null {
    return this.currentProject;
  }
  
  /**
   * Clean up old project data (optional)
   */
  async cleanupProject(projectId: string, options: {
    keepMemories?: boolean;
    keepConcepts?: boolean;
  } = {}): Promise<void> {
    const projectDir = this.getProjectDir(projectId);
    
    if (!options.keepMemories) {
      const memoriesDb = path.join(projectDir, 'databases', 'memories.db');
      if (await fs.pathExists(memoriesDb)) {
        await fs.remove(memoriesDb);
        logger.info(`Cleaned up memories for project ${projectId}`);
      }
    }
    
    if (!options.keepConcepts) {
      const conceptsDb = path.join(projectDir, 'databases', 'concepts.db');
      if (await fs.pathExists(conceptsDb)) {
        await fs.remove(conceptsDb);
        logger.info(`Cleaned up concepts for project ${projectId}`);
      }
    }
  }
  
  /**
   * Generate stable project ID from path
   */
  private generateProjectId(projectPath: string): string {
    // Use hash of normalized path for stable ID
    const normalized = path.resolve(projectPath).toLowerCase();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return `proj_${hash.substring(0, 12)}`;
  }
  
  /**
   * Load projects cache from disk
   */
  private loadProjectsCache(): void {
    const cacheFile = path.join(this.kratosHome, 'projects.json');
    
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = fs.readJsonSync(cacheFile);
        for (const project of cache.projects || []) {
          this.projectsCache.set(project.id, {
            ...project,
            createdAt: new Date(project.createdAt),
            lastAccessed: new Date(project.lastAccessed)
          });
        }
        logger.info(`Loaded ${this.projectsCache.size} projects from cache`);
      } catch (error) {
        logger.error('Failed to load projects cache:', error);
      }
    }
  }
  
  /**
   * Save projects cache to disk
   */
  private saveProjectsCache(): void {
    const cacheFile = path.join(this.kratosHome, 'projects.json');
    const cache = {
      projects: Array.from(this.projectsCache.values()),
      lastUpdated: new Date()
    };
    
    try {
      fs.writeJsonSync(cacheFile, cache, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save projects cache:', error);
    }
  }

  /**
   * Get current Kratos home directory
   */
  getKratosHome(): string {
    return this.kratosHome;
  }

  /**
   * Dynamically update Kratos home directory
   */
  async updateKratosHome(newPath: string): Promise<void> {
    this.kratosHome = newPath;

    // Ensure the new directory exists
    await fs.ensureDir(this.kratosHome);

    // Clear cache as project paths may have changed
    this.projectsCache.clear();

    // Reload cache from new location
    this.loadProjectsCache();

    logger.info(`Updated Kratos home to: ${this.kratosHome}`);
  }
}