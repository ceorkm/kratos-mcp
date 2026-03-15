import chalk from 'chalk';

export class Output {
  static success(msg: string): void {
    console.log(chalk.green('✓') + ' ' + msg);
  }

  static error(msg: string): void {
    console.error(chalk.red('✗') + ' ' + msg);
  }

  static warn(msg: string): void {
    console.log(chalk.yellow('⚠') + ' ' + msg);
  }

  static info(msg: string): void {
    console.log(chalk.blue('ℹ') + ' ' + msg);
  }

  static dim(msg: string): void {
    console.log(chalk.dim(msg));
  }

  static header(msg: string): void {
    console.log('\n' + chalk.bold.cyan(msg));
    console.log(chalk.dim('─'.repeat(Math.min(msg.length + 4, 60))));
  }

  static json(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
  }

  static table(rows: Record<string, string | number | boolean | undefined | null>[]): void {
    if (rows.length === 0) {
      Output.dim('  (no results)');
      return;
    }

    const keys = Object.keys(rows[0]);
    const widths = new Map<string, number>();

    // Calculate column widths
    for (const key of keys) {
      let maxWidth = key.length;
      for (const row of rows) {
        const val = String(row[key] ?? '');
        maxWidth = Math.max(maxWidth, val.length);
      }
      widths.set(key, Math.min(maxWidth, 50));
    }

    // Print header
    const headerLine = keys.map(k => chalk.bold(k.padEnd(widths.get(k)!))).join('  ');
    console.log('  ' + headerLine);
    const divider = keys.map(k => '─'.repeat(widths.get(k)!)).join('──');
    console.log('  ' + chalk.dim(divider));

    // Print rows
    for (const row of rows) {
      const line = keys.map(k => {
        const val = String(row[k] ?? '');
        return val.substring(0, widths.get(k)!).padEnd(widths.get(k)!);
      }).join('  ');
      console.log('  ' + line);
    }
  }

  static memoryCard(memory: {
    id: string;
    summary: string;
    text?: string;
    tags?: string[];
    paths?: string[];
    importance?: number;
    created_at?: number;
    score?: number;
    snippet?: string;
  }): void {
    const date = memory.created_at
      ? new Date(memory.created_at).toLocaleString()
      : 'unknown';

    console.log('');
    console.log(
      chalk.bold.white(`  ${memory.summary}`) +
      (memory.score !== undefined ? chalk.dim(` (score: ${memory.score.toFixed(2)})`) : '')
    );
    console.log(chalk.dim(`  ID: ${memory.id}  |  ${date}  |  importance: ${memory.importance ?? '?'}`));

    if (memory.tags && memory.tags.length > 0) {
      console.log('  ' + memory.tags.map(t => chalk.cyan(`#${t}`)).join(' '));
    }

    if (memory.paths && memory.paths.length > 0) {
      console.log('  ' + chalk.dim('paths: ' + memory.paths.join(', ')));
    }

    if (memory.snippet) {
      console.log('  ' + chalk.dim(memory.snippet.substring(0, 120)));
    }
  }
}
