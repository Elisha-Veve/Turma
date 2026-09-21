#!/usr/bin/env node
// Regenerates the agent and skill tables in README.md from the files themselves,
// so the README cannot fall out of step with agents/ and skills/.
//
//   node scripts/build-readme.mjs           # rewrite README.md in place
//   node scripts/build-readme.mjs --check   # exit 1 if README.md is out of date
//
// The tables live between <!-- generated:agents --> / <!-- /generated:agents -->
// and the matching skills markers. Everything else in README.md is hand-written.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function frontmatter(text) {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};
  const body = text.slice(3, end);
  const out = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function firstSentence(s) {
  const m = s.match(/^(.*?[.!?])(\s|$)/);
  return (m ? m[1] : s).trim();
}

function agentRows() {
  return readdirSync(join(ROOT, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const fm = frontmatter(readFileSync(join(ROOT, 'agents', f), 'utf8'));
      return `| \`${fm.name}\` | ${firstSentence(fm.description || '')} |`;
    });
}

function skillRows() {
  const dir = join(ROOT, 'skills');
  let names;
  try {
    names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return [];
  }
  return names
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const fm = frontmatter(readFileSync(join(dir, name, 'SKILL.md'), 'utf8'));
      return `| \`/turma:${fm.name || name}\` | ${firstSentence(fm.description || '')} |`;
    });
}

function replaceBlock(text, tag, body) {
  const open = `<!-- generated:${tag} -->`;
  const close = `<!-- /generated:${tag} -->`;
  const i = text.indexOf(open);
  const j = text.indexOf(close);
  if (i === -1 || j === -1) throw new Error(`README.md is missing the ${tag} markers`);
  return text.slice(0, i + open.length) + '\n' + body + '\n' + text.slice(j);
}

const readmePath = join(ROOT, 'README.md');
const current = readFileSync(readmePath, 'utf8');

const agents = ['| Agent | What it does |', '|---|---|', ...agentRows()].join('\n');
const skills = ['| Skill | What it does |', '|---|---|', ...skillRows()].join('\n');

let next = replaceBlock(current, 'agents', agents);
next = replaceBlock(next, 'skills', skills);

const check = process.argv.includes('--check');
if (next === current) {
  if (!check) console.log('README.md already current.');
  process.exit(0);
}
if (check) {
  console.error('README.md is out of date. Run: node scripts/build-readme.mjs');
  process.exit(1);
}
writeFileSync(readmePath, next);
console.log('README.md updated.');
