#!/usr/bin/env node
// The house-rule guard for Turma itself: a fact is entered once, everything derived
// is generated. Proves the catalog, the version, the user's decision log and any repo
// manifests you point it at all agree. Exit non-zero on any failure.
//
//   node scripts/check.mjs
//   TURMA_REPOS=/path/a:/path/b node scripts/check.mjs     # also verify those repos
//
// TURMA_HOME (resolved by turma-paths.sh) holds decisions.jsonl and an optional
// overlay catalog. The decision log is append-only; since it is not in git, the guard
// keeps a ratchet (.decisions.ratchet) of the line count and a hash of those lines and
// fails if an earlier line is rewritten or dropped.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const paths = (...args) => execFileSync('bash', [join(ROOT, 'catalog/hooks/turma-paths.sh'), ...args], { encoding: 'utf8' }).trim();
const turmaHome = paths('home');
const failures = [];
const fail = (m) => failures.push(m);

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const sha256Text = (t) => createHash('sha256').update(t).digest('hex');

// 1. a registry and its catalog directory agree, bijectively
function checkCatalog(label, catalogDir) {
  const registryPath = join(catalogDir, 'registry.json');
  let registry;
  try { registry = JSON.parse(readFileSync(registryPath, 'utf8')); }
  catch { fail(`${label}: ${registryPath} is missing or not valid JSON`); return null; }
  const declared = new Set();
  for (const block of registry.blocks || []) {
    if (!existsSync(join(catalogDir, block.file))) fail(`${label}: block ${block.id} points at missing file ${block.file}`);
    if (declared.has(block.file)) fail(`${label}: ${block.file} is claimed by more than one block`);
    declared.add(block.file);
    if (!block.grounds || block.grounds.length < 20) fail(`${label}: block ${block.id} is not grounded in a real need`);
  }
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const rel = relative(catalogDir, full);
        if (rel === 'registry.json') continue;
        if (!declared.has(rel)) fail(`${label}: ${rel} exists but no registry block references it`);
      }
    }
  })(catalogDir);
  return registry;
}

const registry = checkCatalog('base catalog', join(ROOT, 'catalog'));
if (existsSync(join(turmaHome, 'catalog', 'registry.json'))) checkCatalog('overlay catalog', join(turmaHome, 'catalog'));

// 2. catalogVersion tracks plugin.json version
const plugin = JSON.parse(readFileSync(join(ROOT, 'plugin.json'), 'utf8'));
if (registry && registry.catalogVersion !== plugin.version) {
  fail(`registry.catalogVersion (${registry.catalogVersion}) != plugin.json version (${plugin.version})`);
}
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts/build-plugin.mjs'), '--check'], { stdio: 'pipe' });
} catch {
  fail('Host manifests or catalog version are stale - run: node scripts/build-plugin.mjs');
}
// Claude's explicit skill-path selection relies on this being a root-source install.
const marketplace = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
if (marketplace.plugins?.find((entry) => entry.name === plugin.name)?.source !== './') {
  fail('Claude entrypoints require the marketplace plugin source to remain ./');
}

// Both hosts load the same skills; every shared resource must ship in the package.
for (const entry of readdirSync(join(ROOT, 'skills'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join(ROOT, 'skills', entry.name);
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8');
  if (!text.includes('../../references/runtime.md')) fail(`${entry.name}: missing shared runtime reference`);
  if (text.includes('```!') || text.includes('${CLAUDE_PLUGIN_ROOT}')) fail(`${entry.name}: host-specific context remains`);
  if (!existsSync(join(dir, 'agents/openai.yaml'))) fail(`${entry.name}: missing Codex invocation policy`);
  for (const match of text.matchAll(/\]\(([^)]+\.md)\)/g)) {
    if (!match[1].startsWith('https:') && !existsSync(resolve(dir, match[1]))) fail(`${entry.name}: missing reference ${match[1]}`);
  }
}

// Hook selections must have a real shared script, and hosts must stay separate.
for (const block of registry?.blocks || []) {
  if (block.kind !== 'settings') continue;
  const settings = JSON.parse(readFileSync(join(ROOT, 'catalog', block.file), 'utf8'));
  if (block.hosts?.includes('codex') && settings.permissions) fail(`${block.id}: Claude permissions in Codex settings`);
  for (const [event, groups] of Object.entries(settings.hooks || {})) {
    for (const group of groups) for (const hook of group.hooks) {
      const script = hook.command.match(/^bash <HOOK_DIR_SHELL>\/([\w-]+\.sh)$/)?.[1];
      if (!script || !existsSync(join(ROOT, 'catalog/hooks', script))) fail(`${block.id}: missing or invalid hook command`);
      if (block.hosts?.includes('codex') && event === 'SessionEnd' && hook.timeout > 3) fail(`${block.id}: Codex SessionEnd timeout exceeds 3 seconds`);
    }
  }
}

// 3. the user's decision log: valid JSONL, append-only against the ratchet
const decisionsPath = join(turmaHome, 'decisions.jsonl');
if (existsSync(decisionsPath)) {
  const lines = readFileSync(decisionsPath, 'utf8').split('\n').filter((l) => l.trim());
  lines.forEach((line, i) => {
    try { JSON.parse(line); } catch { fail(`${decisionsPath} line ${i + 1} is not valid JSON`); }
  });
  const ratchetPath = join(turmaHome, '.decisions.ratchet');
  let ok = true;
  if (existsSync(ratchetPath)) {
    try {
      const prev = JSON.parse(readFileSync(ratchetPath, 'utf8'));
      if (lines.length < prev.count) { ok = false; fail(`${decisionsPath} lost ${prev.count - lines.length} line(s) - it is append-only`); }
      else if (sha256Text(lines.slice(0, prev.count).join('\n')) !== prev.hash) { ok = false; fail(`${decisionsPath} had an earlier line rewritten - it is append-only`); }
    } catch { fail(`${ratchetPath} is not valid JSON`); ok = false; }
  }
  if (ok && !failures.length) {
    writeFileSync(ratchetPath, JSON.stringify({ count: lines.length, hash: sha256Text(lines.join('\n')) }) + '\n');
  }
}

// 4. README generated tables current
try {
  const { execFileSync } = await import('node:child_process');
  execFileSync('node', [join(ROOT, 'scripts/build-readme.mjs'), '--check'], { cwd: ROOT, stdio: 'pipe' });
} catch {
  fail('README.md generated tables are stale - run: node scripts/build-readme.mjs');
}

// 5. repos you name: files unchanged since bootstrap; verbatim files match the catalog
const repos = (process.env.TURMA_REPOS || '').split(':').filter(Boolean).map((p) => resolve(p));
for (const repoPath of repos) {
  const name = repoPath.split('/').pop();
  const manifestPath = join(paths('state', repoPath), 'turma-manifest.json');
  if (!existsSync(manifestPath)) { fail(`${name}: no ${manifestPath} (was it bootstrapped?)`); continue; }
  if (existsSync(join(repoPath, '.claude/turma-manifest.json')) && existsSync(join(repoPath, '.turma/turma-manifest.json'))) {
    fail(`${name}: both legacy and neutral manifests exist; resolve the state conflict`);
  }
  let manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
  catch { fail(`${manifestPath} is not valid JSON`); continue; }
  for (const [rel, entry] of Object.entries(manifest.files || {})) {
    const recorded = typeof entry === 'string' ? entry : entry.sha256;
    const repoFile = join(repoPath, rel);
    if (!existsSync(repoFile)) { fail(`${name}/${rel} is in the manifest but missing on disk`); continue; }
    if (sha256(repoFile) !== recorded) fail(`${name}/${rel} was hand-edited since bootstrap (sha differs from turma-manifest.json)`);
    if (entry.source) {
      const src = join(ROOT, entry.source);
      if (!existsSync(src)) fail(`${name}/${rel}: catalog source ${entry.source} is missing - re-run Turma bootstrap`);
      else if (sha256(src) !== recorded) fail(`${name}/${rel} no longer matches catalog ${entry.source} - re-run Turma bootstrap for ${name}`);
    }
  }
}

if (failures.length) {
  console.error(`turma check: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('turma check: clean.');
