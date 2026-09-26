#!/usr/bin/env node
// Local integration tests: real Git commits, isolated state, documented hook payloads.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { renderHooks, shellQuote } from './render-hooks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const paths = join(root, 'catalog/hooks/turma-paths.sh');
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  assert.equal(result.status, 0, `${command}: ${result.stderr || result.error}`);
  return result.stdout.trim();
};
function fixture(t, legacy = false) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'turma-test-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const repo = join(dir, "project's space $literal");
  mkdirSync(repo);
  run('git', ['init', '--quiet', '--template=', repo]);
  const git = (...args) => run('git', ['-c', `core.hooksPath=${join(repo, '.git/hooks')}`, ...args], {
    cwd: repo,
    env: { ...process.env, GIT_AUTHOR_NAME: 'Turma Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
      GIT_COMMITTER_NAME: 'Turma Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' },
  });
  const state = join(repo, legacy ? '.claude' : '.turma');
  mkdirSync(state);
  writeFileSync(join(state, 'turma-manifest.json'), '{"hosts":["claude","codex"],"files":{}}\n');
  cpSync(join(root, 'catalog/hooks'), join(state, 'hooks'), { recursive: true });
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'lsof'), '#!/bin/sh\n[ "$TURMA_TEST_LISTEN" = "1" ]\n', { mode: 0o755 });
  for (const name of ['osascript', 'notify-send']) {
    writeFileSync(join(bin, name), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$TURMA_TEST_NOTIFY"\n', { mode: 0o755 });
  }
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TURMA_TEST_LISTEN: '1',
    TURMA_TEST_NOTIFY: join(dir, 'notifications'), TURMA_HOME: join(dir, 'user-data') };
  delete env.CLAUDE_PROJECT_DIR;
  const invoke = (command, payload = {}, overrides = {}) => run('bash', ['-c', command], {
    cwd: repo, input: JSON.stringify({ cwd: repo, ...payload }), env: { ...env, ...overrides },
  });
  return { repo, state, dir, git, env, invoke };
}

for (const legacy of [false, true]) {
  test(`both hosts share ${legacy ? 'legacy' : 'new'} state and see actual Git commits`, (t) => {
    const f = fixture(t, legacy);
    const nested = join(f.repo, 'src');
    mkdirSync(nested);
    assert.equal(run('bash', [paths, 'state', nested]), f.state);
    mkdirSync(join(f.repo, '.git/hooks'), { recursive: true });
    writeFileSync(join(f.repo, '.git/hooks/post-commit'),
      `#!/bin/sh\nbash ${shellQuote(join(f.state, 'hooks/commit-queue.sh'))}\n`, { mode: 0o755 });
    f.git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '--allow-empty', '-m', 'fixture');
    const queue = readFileSync(join(f.state, 'optimizer-queue.log'), 'utf8');
    assert.equal(queue.trim().split('\n').length, 1);
    assert.equal(queue.split('\t')[0], f.git('rev-parse', 'HEAD'));
    for (const host of ['claude', 'codex']) {
      // The after-commit nudge is opt-in: the default wiring has no PostToolUse at all.
      assert.equal(renderHooks({ host, stateDir: basename(f.state) }).hooks.PostToolUse, undefined);
      const config = renderHooks({ host, stateDir: basename(f.state), commitNudge: true });
      const command = config.hooks.PostToolUse[0].hooks[0].command;
      const result = JSON.parse(f.invoke(command, { tool_name: 'Bash', tool_input: { command: 'git commit -m fixture' } }));
      assert.match(result.hookSpecificOutput.additionalContext, /1 commit\(s\)/);
      assert.equal(f.invoke(command, { tool_input: { command: 'git status' } }), '');
      f.invoke(config.hooks.SessionEnd[0].hooks[0].command);
    }
    assert.match(readFileSync(f.env.TURMA_TEST_NOTIFY, 'utf8'), /1 commit/);
    assert.equal(existsSync(join(f.repo, legacy ? '.turma' : '.claude', 'optimizer-queue.log')), false);
    // Empty queues must stay numeric and must not produce desktop notifications.
    writeFileSync(join(f.state, 'optimizer-queue.log'), '');
    const before = readFileSync(f.env.TURMA_TEST_NOTIFY, 'utf8');
    f.invoke(`bash ${shellQuote(join(f.state, 'hooks/optimizer-nudge.sh'))}`);
    assert.equal(readFileSync(f.env.TURMA_TEST_NOTIFY, 'utf8'), before);
  });
}

function withQueueHook(f) {
  mkdirSync(join(f.repo, '.git/hooks'), { recursive: true });
  writeFileSync(join(f.repo, '.git/hooks/post-commit'),
    `#!/bin/sh\nbash ${shellQuote(join(f.state, 'hooks/commit-queue.sh'))}\n`, { mode: 0o755 });
  const queue = () => readFileSync(join(f.state, 'optimizer-queue.log'), 'utf8').trim().split('\n').map((line) => line.split('\t'));
  return queue;
}

test('a commit in a linked worktree lands in the main checkout\'s queue', (t) => {
  const f = fixture(t, true);
  const queue = withQueueHook(f);
  // The state directory is committed, as a bootstrapped project's is, so the worktree has its own copy.
  f.git('add', '.claude');
  f.git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'base');
  const worktree = join(f.dir, 'agent worktree');
  f.git('worktree', 'add', '--quiet', '-b', 'work/1-x', worktree);
  assert.equal(run('bash', [paths, 'state', worktree]), f.state, 'state resolves to the main checkout');
  assert.equal(run('bash', [paths, 'root', worktree]), worktree, 'REPO stays the worktree');
  f.git('-C', worktree, '-c', 'commit.gpgsign=false', 'commit', '--quiet', '--allow-empty', '-m', 'in the worktree');
  const lines = queue();
  assert.equal(lines.length, 2);
  assert.deepEqual([lines[1][2], lines[1][3]], ['work/1-x', 'in the worktree']);
  assert.equal(existsSync(join(worktree, '.claude/optimizer-queue.log')), false, 'nothing written to the worktree copy');
});

test('a rebase replay names the branch being rebased', (t) => {
  const f = fixture(t);
  const queue = withQueueHook(f);
  const commit = (message) => f.git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '--allow-empty', '-m', message);
  commit('base');
  const main = f.git('rev-parse', '--abbrev-ref', 'HEAD');
  f.git('checkout', '--quiet', '-b', 'work/2-y');
  writeFileSync(join(f.repo, 'y.txt'), 'y\n');
  f.git('add', 'y.txt');
  commit('on the branch');
  f.git('checkout', '--quiet', main);
  commit('on main');
  f.git('checkout', '--quiet', 'work/2-y');
  f.git('-c', 'commit.gpgsign=false', 'rebase', '--quiet', main);
  const last = queue().at(-1);
  assert.deepEqual([last[2], last[3]], ['work/2-y (rebase)', 'on the branch']);
});

test('ordinary Claude settings do not select legacy Turma state', (t) => {
  const f = fixture(t);
  mkdirSync(join(f.repo, '.claude'));
  writeFileSync(join(f.repo, '.claude/settings.json'), '{}');
  assert.equal(run('bash', [paths, 'state', f.repo]), f.state);
  assert.equal(run('bash', [paths, 'home'], { env: f.env }), f.env.TURMA_HOME);
});

test('build guard blocks a live server for both host payloads and permits unrelated commands', (t) => {
  const f = fixture(t);
  for (const host of ['claude', 'codex']) {
    const config = renderHooks({ host, stateDir: basename(f.state), next: true });
    const command = config.hooks.PreToolUse[0].hooks[0].command;
    for (const input of [{ command: 'npm run build' }, { cmd: 'npx next build' }]) {
      const result = JSON.parse(f.invoke(command, { tool_input: input }));
      assert.equal(result.hookSpecificOutput.permissionDecision, 'deny');
    }
    assert.equal(f.invoke(command, { tool_input: { command: 'npm run build' } }, { TURMA_TEST_LISTEN: '0' }), '');
    assert.equal(f.invoke(command, { tool_input: { command: 'git status' } }), '');
    assert.equal(f.invoke(command, { tool_input: { command: 'git commit -m "next build"' } }), '');
  }
});

test('Claude read guard returns valid JSON for quoted paths; Codex cannot select it', (t) => {
  const f = fixture(t);
  const config = renderHooks({ host: 'claude', stateDir: basename(f.state), readGuard: true });
  const command = config.hooks.PreToolUse[0].hooks[0].command;
  assert.equal(f.invoke(command, { tool_input: { file_path: join(f.repo, 'README.md') } }), '');
  const result = JSON.parse(f.invoke(command, { tool_input: { file_path: '/outside/quoted"file' } }));
  assert.equal(result.hookSpecificOutput.permissionDecision, 'deny');
  const ask = JSON.parse(f.invoke(command, { tool_input: { path: '/outside/file' } }, { TURMA_READ_OUTSIDE: 'request' }));
  assert.equal(ask.hookSpecificOutput.permissionDecision, 'ask');
  assert.throws(() => renderHooks({ host: 'codex', stateDir: basename(f.state), readGuard: true }), /only supports Claude/);
});

test('checker accepts both manifests and detects drift and rewritten decisions', (t) => {
  const f = fixture(t);
  const legacy = fixture(t, true);
  mkdirSync(f.env.TURMA_HOME);
  const decisions = join(f.env.TURMA_HOME, 'decisions.jsonl');
  writeFileSync(decisions, '{"proposal":"first"}\n');
  const env = { ...f.env, TURMA_REPOS: `${f.repo}:${legacy.repo}` };
  const check = () => spawnSync(process.execPath, [join(root, 'scripts/check.mjs')], { env, encoding: 'utf8' });
  let result = check();
  assert.equal(result.status, 0, result.stderr);
  writeFileSync(decisions, '{"proposal":"first"}\n{"proposal":"second"}\n');
  result = check();
  assert.equal(result.status, 0, result.stderr);
  writeFileSync(decisions, '{"proposal":"rewritten"}\n{"proposal":"second"}\n');
  result = check();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /earlier line rewritten/);
  writeFileSync(decisions, '{"proposal":"first"}\n{"proposal":"second"}\n');
  writeFileSync(join(f.state, 'turma-manifest.json'), JSON.stringify({ files: {
    '.turma/hooks/commit-queue.sh': { sha256: 'incorrect', source: 'catalog/hooks/commit-queue.sh' },
  } }));
  result = check();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /hand-edited since bootstrap/);
});
