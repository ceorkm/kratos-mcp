import type { CLIContext } from '../core.js';
import { Output } from '../output.js';
import chalk from 'chalk';

export async function scanCommand(ctx: CLIContext, text: string, opts: {
  redact?: boolean;
}): Promise<void> {
  const result = ctx.piiDetector.detect(text);

  Output.header('Security Scan Results');

  if (!result.hasPII && !result.hasSecrets) {
    Output.success('No PII or secrets detected');
    return;
  }

  if (result.hasPII) {
    Output.warn(chalk.yellow('PII detected!'));
  }
  if (result.hasSecrets) {
    Output.error(chalk.red('Secrets detected!'));
  }

  console.log('');
  for (const finding of result.findings) {
    const icon = finding.type === 'secret' ? chalk.red('●') : chalk.yellow('●');
    console.log(`  ${icon} ${chalk.bold(finding.pattern)} (${finding.type}, confidence: ${finding.confidence})`);
    console.log(`    ${chalk.dim(finding.redacted)}`);
  }

  if (opts.redact) {
    console.log('');
    Output.header('Redacted Text');
    console.log(result.redactedText);
  }
}
