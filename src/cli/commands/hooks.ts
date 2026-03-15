import { Output } from '../output.js';
import path from 'path';
import fs from 'fs-extra';

const HOOK_CONFIG = {
  hooks: {
    PostToolUse: [
      {
        matcher: 'Edit|Write|MultiEdit',
        command: 'kratos capture --event post-tool-use',
      },
    ],
    Stop: [
      {
        command: 'kratos capture --event session-end',
      },
    ],
  },
};

export async function hooksCommand(action: string): Promise<void> {
  switch (action) {
    case 'install':
      await installHooks();
      break;
    case 'uninstall':
      await uninstallHooks();
      break;
    case 'status':
      await checkHooksStatus();
      break;
    default:
      Output.error(`Unknown action: ${action}. Use: install, uninstall, status`);
      process.exit(1);
  }
}

async function installHooks(): Promise<void> {
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.local.json');
  const settingsDir = path.dirname(settingsPath);

  await fs.ensureDir(settingsDir);

  let settings: any = {};

  // Load existing settings if present
  if (await fs.pathExists(settingsPath)) {
    try {
      settings = await fs.readJson(settingsPath);
    } catch {
      settings = {};
    }
  }

  // Check if hooks already installed
  if (settings.hooks?.PostToolUse || settings.hooks?.Stop) {
    // Check if our hooks are already there
    const existingPostTool = settings.hooks.PostToolUse || [];
    const hasKratosHook = existingPostTool.some(
      (h: any) => h.command?.includes('kratos capture')
    );

    if (hasKratosHook) {
      Output.warn('Kratos auto-capture hooks are already installed');
      return;
    }
  }

  // Merge hooks into existing settings (don't overwrite other hooks)
  if (!settings.hooks) settings.hooks = {};

  // Add PostToolUse hooks
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];
  settings.hooks.PostToolUse.push(...HOOK_CONFIG.hooks.PostToolUse);

  // Add Stop hooks
  if (!settings.hooks.Stop) settings.hooks.Stop = [];
  settings.hooks.Stop.push(...HOOK_CONFIG.hooks.Stop);

  await fs.writeJson(settingsPath, settings, { spaces: 2 });

  Output.success('Auto-capture hooks installed!');
  Output.dim(`Config written to: ${settingsPath}`);
  Output.dim('Hooks will capture: file edits (Edit/Write/MultiEdit) and session summaries');
  Output.dim('Captured memories are auto-compressed and project-isolated');
}

async function uninstallHooks(): Promise<void> {
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.local.json');

  if (!await fs.pathExists(settingsPath)) {
    Output.warn('No hooks configuration found');
    return;
  }

  try {
    const settings = await fs.readJson(settingsPath);

    if (!settings.hooks) {
      Output.warn('No hooks found in settings');
      return;
    }

    // Remove only kratos hooks
    if (settings.hooks.PostToolUse) {
      settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
        (h: any) => !h.command?.includes('kratos capture')
      );
      if (settings.hooks.PostToolUse.length === 0) {
        delete settings.hooks.PostToolUse;
      }
    }

    if (settings.hooks.Stop) {
      settings.hooks.Stop = settings.hooks.Stop.filter(
        (h: any) => !h.command?.includes('kratos capture')
      );
      if (settings.hooks.Stop.length === 0) {
        delete settings.hooks.Stop;
      }
    }

    // Clean up empty hooks object
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    await fs.writeJson(settingsPath, settings, { spaces: 2 });

    Output.success('Kratos auto-capture hooks removed');
  } catch {
    Output.error('Failed to read settings file');
    process.exit(1);
  }
}

async function checkHooksStatus(): Promise<void> {
  const settingsPath = path.join(process.cwd(), '.claude', 'settings.local.json');

  if (!await fs.pathExists(settingsPath)) {
    Output.info('No hooks installed (no settings file found)');
    return;
  }

  try {
    const settings = await fs.readJson(settingsPath);
    const postToolHooks = (settings.hooks?.PostToolUse || []).filter(
      (h: any) => h.command?.includes('kratos capture')
    );
    const stopHooks = (settings.hooks?.Stop || []).filter(
      (h: any) => h.command?.includes('kratos capture')
    );

    if (postToolHooks.length === 0 && stopHooks.length === 0) {
      Output.info('Kratos hooks are NOT installed');
    } else {
      Output.success('Kratos hooks are installed');
      Output.dim(`PostToolUse hooks: ${postToolHooks.length}`);
      Output.dim(`Stop hooks: ${stopHooks.length}`);
    }
  } catch {
    Output.error('Failed to read settings file');
  }
}
