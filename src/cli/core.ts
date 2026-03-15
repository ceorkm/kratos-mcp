import { MemoryDatabase } from '../memory-server/database.js';
import { ProjectManager, type Project } from '../project-manager.js';
import { PIIDetector } from '../security/pii-detector.js';

export interface CLIContext {
  projectManager: ProjectManager;
  memoryDb: MemoryDatabase;
  piiDetector: PIIDetector;
  project: Project;
}

/**
 * Initialize CLI context — detects project, opens database, etc.
 * Reuses the exact same core modules as the MCP server.
 */
export async function initCLIContext(): Promise<CLIContext> {
  const projectManager = new ProjectManager();
  const piiDetector = new PIIDetector();

  // Auto-detect project from cwd (same logic as MCP server)
  const workingDir = process.env.KRATOS_PROJECT_ROOT || process.cwd();
  const project = await projectManager.detectProject(workingDir);

  // Initialize memory database (isolated per-project)
  const memoryDb = new MemoryDatabase(project.root, project.id);

  return { projectManager, memoryDb, piiDetector, project };
}
