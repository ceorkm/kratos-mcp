import type { CLIContext } from '../core.js';
import { Output } from '../output.js';
import { MemoryDatabase } from '../../memory-server/database.js';

export async function switchCommand(ctx: CLIContext, projectPath: string): Promise<void> {
  try {
    const newProject = await ctx.projectManager.switchProject(projectPath);

    // Re-initialize memory database for the new project
    ctx.memoryDb = new MemoryDatabase(newProject.root, newProject.id);
    ctx.project = newProject;

    Output.success(`Switched to project: ${newProject.name}`);
    Output.dim(`Root: ${newProject.root}`);
    Output.dim(`Data: ~/.kratos/projects/${newProject.id}/`);
  } catch (error) {
    Output.error(`Failed to switch project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
