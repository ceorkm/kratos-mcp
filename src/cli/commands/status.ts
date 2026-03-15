import type { CLIContext } from '../core.js';
import { Output } from '../output.js';
import chalk from 'chalk';

export async function statusCommand(ctx: CLIContext): Promise<void> {
  // Mini banner
  console.log('');
  console.log(chalk.bold.red('  KRATOS') + chalk.dim(' — Memory System'));
  console.log(chalk.dim('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  // Active project box
  console.log('');
  console.log(chalk.bold.white('  ACTIVE PROJECT'));
  console.log(`  ${chalk.green('●')} ${chalk.bold(ctx.project.name)}`);
  console.log(`    ${chalk.dim('Root:')}  ${ctx.project.root}`);
  console.log(`    ${chalk.dim('ID:')}    ${ctx.project.id}`);
  console.log(`    ${chalk.dim('Data:')}  ~/.kratos/projects/${ctx.project.id}/`);

  // Memory stats
  try {
    const recent = ctx.memoryDb.getRecent({ k: 10000 });
    const lastCreated = recent.length > 0
      ? new Date(recent[0].created_at).toLocaleString()
      : 'none';

    // Importance distribution
    const importanceCounts = [0, 0, 0, 0, 0];
    for (const m of recent) {
      importanceCounts[(m.importance || 3) - 1]++;
    }

    console.log('');
    console.log(chalk.bold.white('  MEMORY STATS'));
    console.log(`    ${chalk.dim('Total:')}       ${chalk.bold.cyan(String(recent.length))}`);
    console.log(`    ${chalk.dim('Last saved:')} ${lastCreated}`);

    // Importance bar
    const maxBar = 20;
    const maxCount = Math.max(...importanceCounts, 1);
    console.log(`    ${chalk.dim('Importance:')}`);
    for (let i = 4; i >= 0; i--) {
      const barLen = Math.round((importanceCounts[i] / maxCount) * maxBar);
      const bar = '█'.repeat(barLen) + chalk.dim('░'.repeat(maxBar - barLen));
      const colors = [chalk.dim, chalk.blue, chalk.green, chalk.yellow, chalk.red];
      console.log(`      ${chalk.dim(`${i + 1}`)} ${colors[i](bar)} ${importanceCounts[i]}`);
    }

    // Tags summary
    const tagCounts = new Map<string, number>();
    for (const m of recent) {
      for (const tag of m.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (topTags.length > 0) {
      console.log('');
      console.log(chalk.bold.white('  TOP TAGS'));
      console.log('    ' + topTags.map(([tag, count]) =>
        chalk.cyan(`#${tag}`) + chalk.dim(`(${count})`)
      ).join('  '));
    }
  } catch {
    console.log('');
    console.log(chalk.bold.white('  MEMORY STATS'));
    console.log(`    ${chalk.dim('Total:')} 0 (database not initialized)`);
  }

  // Features status
  console.log('');
  console.log(chalk.bold.white('  FEATURES'));
  console.log(`    ${chalk.green('●')} FTS5 Full-Text Search`);
  console.log(`    ${chalk.green('●')} AES-256-GCM Encryption`);
  console.log(`    ${chalk.green('●')} PII/Secret Detection`);
  console.log(`    ${chalk.green('●')} Smart Compression`);
  console.log(`    ${chalk.green('●')} Auto-Capture Hooks`);

  // All known projects
  const projects = ctx.projectManager.listProjects();
  if (projects.length > 1) {
    console.log('');
    console.log(chalk.bold.white(`  ALL PROJECTS ${chalk.dim(`(${projects.length})`)}`));
    for (const p of projects.slice(0, 10)) {
      const isActive = p.id === ctx.project.id;
      const dot = isActive ? chalk.green('●') : chalk.dim('○');
      const name = isActive ? chalk.bold.white(p.name) : chalk.white(p.name);
      const date = chalk.dim(new Date(p.lastAccessed).toLocaleDateString());
      console.log(`    ${dot} ${name}  ${date}`);
    }
    if (projects.length > 10) {
      console.log(chalk.dim(`    ... and ${projects.length - 10} more`));
    }
  }

  // Footer
  console.log('');
  console.log(chalk.dim(`  v4.0.0  |  Node ${process.version}  |  ${process.platform}`));
  console.log('');
}
