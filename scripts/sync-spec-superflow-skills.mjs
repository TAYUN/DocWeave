#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const RUNTIME_DIRS = ['scripts', 'docs', 'templates', 'dist', 'hooks', 'skills'];
const TEXT_EXTS = new Set(['.md', '.json', '.mjs', '.js', '.cjs', '.sh', '.txt']);

function parseCli() {
  return parseArgs({
    options: {
      source: { type: 'string' },
      target: { type: 'string' },
    },
    allowPositionals: false,
  }).values;
}

function runAndTrim(bin, args) {
  const command = process.platform === 'win32'
    ? `${bin} ${args.join(' ')}`
    : [bin, ...args].join(' ');

  const wrapped = process.platform === 'win32'
    ? [`powershell -Command "${command}"`, `cmd /c "${command}"`]
    : [`sh -lc '${command.replace(/'/g, `'\\''`)}'`];

  for (const candidate of wrapped) {
    try {
      return execSync(candidate, {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {}
  }

  throw new Error(`Failed to run ${command}`);
}

function isSpecSuperflowRoot(dir) {
  if (!existsSync(dir)) return false;
  const pkg = join(dir, 'package.json');
  const skills = join(dir, 'skills');
  if (!existsSync(pkg) || !existsSync(skills)) return false;
  try {
    return JSON.parse(readFileSync(pkg, 'utf-8')).name === 'spec-superflow';
  } catch {
    return false;
  }
}

function resolveSourceRoot(explicitSource) {
  const candidates = [
    explicitSource,
    process.env.SPEC_SUPERFLOW_ROOT,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (isSpecSuperflowRoot(resolved)) return resolved;
  }

  const globalRoots = [];
  try {
    globalRoots.push(runAndTrim('pnpm', ['root', '-g']));
  } catch {}
  try {
    globalRoots.push(runAndTrim('npm', ['root', '-g']));
  } catch {}

  for (const root of globalRoots) {
    const candidate = resolve(root, 'spec-superflow');
    if (isSpecSuperflowRoot(candidate)) return candidate;
  }

  throw new Error(
    [
      'Could not locate spec-superflow.',
      'Pass --source <path> or set SPEC_SUPERFLOW_ROOT.',
      'Expected a directory containing package.json and skills/.',
    ].join(' '),
  );
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function copyRuntime(sourceRoot, targetRoot) {
  rmSync(targetRoot, { recursive: true, force: true });
  ensureDir(targetRoot);

  for (const name of RUNTIME_DIRS) {
    const src = join(sourceRoot, name);
    if (!existsSync(src)) continue;
    cpSync(src, join(targetRoot, name), { recursive: true, force: true });
  }
}

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, files);
      continue;
    }
    files.push(full);
  }
  return files;
}

function shouldRewrite(file) {
  return [...TEXT_EXTS].some(ext => file.endsWith(ext)) || file.endsWith('get-config');
}

function writeNodeGetConfig(targetRoot) {
  const wrapperPath = join(targetRoot, 'scripts', 'get-config.mjs');
  writeFileSync(
    wrapperPath,
    `#!/usr/bin/env node
import { loadConfig } from './lib/config-loader.mjs';

const fieldPath = process.argv[2];

if (!fieldPath) {
  console.error('Usage: get-config.mjs <field-path>');
  process.exit(2);
}

const config = loadConfig(process.cwd());
let value = config;
for (const part of fieldPath.split('.')) {
  if (value === undefined || value === null) {
    value = undefined;
    break;
  }
  value = value[part];
}

if (value === undefined) {
  process.exit(1);
}

process.stdout.write(typeof value === 'object' ? JSON.stringify(value) : String(value));
`,
    'utf-8',
  );
}

function rewriteTextFiles(targetRoot) {
  const rootPosix = targetRoot.replace(/\\/g, '/');
  const files = walkFiles(targetRoot).filter(shouldRewrite);

  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    const original = content;

    content = content.replaceAll(
      'bash "${CLAUDE_PLUGIN_ROOT}/scripts/get-config"',
      'node "${CLAUDE_PLUGIN_ROOT}/scripts/get-config.mjs"',
    );
    content = content.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, rootPosix);

    if (content !== original) {
      writeFileSync(file, content, 'utf-8');
    }
  }
}

function main() {
  const { source, target } = parseCli();
  const sourceRoot = resolveSourceRoot(source);
  const targetRoot = resolve(target || join(repoRoot, '.reasonix', 'vendor', 'spec-superflow'));

  copyRuntime(sourceRoot, targetRoot);
  writeNodeGetConfig(targetRoot);
  rewriteTextFiles(targetRoot);

  console.log(`Synced spec-superflow skills.`);
  console.log(`  Source: ${sourceRoot}`);
  console.log(`  Target: ${targetRoot}`);
}

main();
