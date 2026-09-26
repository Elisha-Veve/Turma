#!/usr/bin/env node
// Render only; bootstrap reviews and merges the result into the target host config.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const shellQuote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";

export function renderHooks({ host, stateDir, next = false, readGuard = false, commitNudge = false }) {
  if (!['claude', 'codex'].includes(host)) throw new Error('host must be claude or codex');
  if (!['.turma', '.claude'].includes(stateDir)) throw new Error('state-dir must be .turma or .claude');
  if (readGuard && host !== 'claude') throw new Error('The read guard only supports Claude Read/Grep/Glob tools');
  const fragments = [host === 'claude' ? 'hook-wiring' : 'codex-hook-wiring'];
  if (next) fragments.push(`${host}-build-guard`);
  if (readGuard) fragments.push('hook-wiring-read-guard');
  if (commitNudge) fragments.push('hook-wiring-commit-nudge');
  const result = { hooks: {} };
  for (const name of fragments) {
    const { hooks } = JSON.parse(readFileSync(join(root, 'catalog/settings', `${name}.json`), 'utf8'));
    for (const [event, groups] of Object.entries(hooks)) {
      for (const group of groups) for (const hook of group.hooks) {
        // Resolve the checkout at invocation time, including sessions in subdirectories.
        // Quoting the Git output keeps spaces, quotes and dollar signs literal.
        hook.command = hook.command.replace('<HOOK_DIR_SHELL>',
          '"$(git rev-parse --show-toplevel)"/' + shellQuote(`${stateDir}/hooks`));
      }
      (result.hooks[event] ??= []).push(...groups);
    }
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--host') options.host = args[++i];
      else if (args[i] === '--state-dir') options.stateDir = args[++i];
      else if (args[i] === '--next') options.next = true;
      else if (args[i] === '--read-guard') options.readGuard = true;
      else if (args[i] === '--commit-nudge') options.commitNudge = true;
      else throw new Error(`Unknown argument ${args[i]}`);
    }
    console.log(JSON.stringify(renderHooks(options), null, 2));
  } catch (error) {
    console.error(error.message);
    console.error('Usage: node scripts/render-hooks.mjs --host claude|codex --state-dir .turma|.claude [--next] [--read-guard] [--commit-nudge]');
    process.exitCode = 1;
  }
}
