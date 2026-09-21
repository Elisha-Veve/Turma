#!/usr/bin/env node
// The house-rule guard for Turma itself: a fact is entered once, everything derived
// is generated. Proves the catalog, the version, the user's decision log and any repo
// manifests you point it at all agree. Exit non-zero on any failure.
//
//   node scripts/check.mjs
//   TURMA_REPOS=/path/a:/path/b node scripts/check.mjs     # also verify those repos
//
// TURMA_HOME (default ~/.claude/turma) holds the user's decisions.jsonl and an optional
// overlay catalog. The decision log is append-only; since it is not in git, the guard
// keeps a ratchet (.decisions.ratchet) of the line count and a hash of those lines and
// fails if an earlier line is rewritten or dropped.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOME = process.env.TURMA_HOME || join(homedir(), '.claude', 'turma');
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
if (existsSync(join(HOME, 'catalog', 'registry.json'))) checkCatalog('overlay catalog', join(HOME, 'catalog'));

// 2. catalogVersion tracks plugin.json version
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
if (registry && registry.catalogVersion !== plugin.version) {
  fail(`registry.catalogVersion (${registry.catalogVersion}) != plugin.json version (${plugin.version})`);
}

// 3. the user's decision log: valid JSONL, append-only against the ratchet
const decisionsPath = join(HOME, 'decisions.jsonl');
if (existsSync(decisionsPath)) {
  const lines = readFileSync(decisionsPath, 'utf8').split('\n').filter((l) => l.trim());
  lines.forEach((line, i) => {
    try { JSON.parse(line); } catch { fail(`${decisionsPath} line ${i + 1} is not valid JSON`); }
  });
  const ratchetPath = join(HOME, '.decisions.ratchet');
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
  const manifestPath = join(repoPath, '.claude/turma-manifest.json');
  if (!existsSync(manifestPath)) { fail(`${name}: no .claude/turma-manifest.json (was it bootstrapped?)`); continue; }
  let manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
  catch { fail(`${name}/.claude/turma-manifest.json is not valid JSON`); continue; }
  for (const [rel, entry] of Object.entries(manifest.files || {})) {
    const recorded = typeof entry === 'string' ? entry : entry.sha256;
    const repoFile = join(repoPath, rel);
    if (!existsSync(repoFile)) { fail(`${name}/${rel} is in the manifest but missing on disk`); continue; }
    if (sha256(repoFile) !== recorded) fail(`${name}/${rel} was hand-edited since bootstrap (sha differs from turma-manifest.json)`);
    if (entry.source) {
      const src = join(ROOT, entry.source);
      if (existsSync(src) && sha256(src) !== recorded) fail(`${name}/${rel} no longer matches catalog ${entry.source} - re-run /turma:bootstrap for ${name}`);
    }
  }
}

if (failures.length) {
  console.error(`turma check: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('turma check: clean.');
