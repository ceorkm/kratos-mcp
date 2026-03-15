import type { CLIContext } from '../core.js';
import { Output } from '../output.js';
import path from 'path';
import fs from 'fs-extra';

export async function migrateCommand(ctx: CLIContext, opts: {
  from?: string;
}): Promise<void> {
  const kratosHome = opts.from || path.join(process.env.HOME || process.env.USERPROFILE || '', '.kratos');
  const projectsDir = path.join(kratosHome, 'projects');

  Output.header('Kratos MCP → CLI Migration');

  if (!await fs.pathExists(projectsDir)) {
    Output.warn('No existing MCP data found at: ' + projectsDir);
    Output.dim('If your data is elsewhere, use --from <path>');
    return;
  }

  const entries = await fs.readdir(projectsDir);
  let totalMemories = 0;
  let totalProjects = 0;

  for (const entry of entries) {
    const dbPath = path.join(projectsDir, entry, 'databases', 'memories.db');
    const projectJsonPath = path.join(projectsDir, entry, 'project.json');

    if (!await fs.pathExists(dbPath)) continue;

    totalProjects++;

    // Read project metadata
    let projectName = entry;
    try {
      if (await fs.pathExists(projectJsonPath)) {
        const meta = await fs.readJson(projectJsonPath);
        projectName = meta.name || entry;
      }
    } catch {
      // Use directory name
    }

    // Count memories in the database
    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(dbPath, { readonly: true });
      const row = db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
      totalMemories += row.count;
      db.close();
      Output.success(`${projectName}: ${row.count} memories found`);
    } catch (error) {
      Output.warn(`${projectName}: could not read database`);
    }
  }

  console.log('');
  Output.header('Migration Summary');
  Output.info(`Projects found:  ${totalProjects}`);
  Output.info(`Total memories:  ${totalMemories}`);
  Output.info(`Data location:   ${projectsDir}`);
  console.log('');
  Output.success('Your MCP data is already compatible with the CLI!');
  Output.dim('The CLI reads from the same database files — no data copy needed.');
  Output.dim('All project isolation is preserved. Each project has its own database.');
}
