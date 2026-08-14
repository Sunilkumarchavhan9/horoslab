/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Starts the MemoryOS backend and Next.js frontend concurrently.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const frontendDir = path.resolve(__dirname, '..');

/** Each entry is one concurrently command - must stay a single string on Windows. */
const commands = ['node start-backend.js', 'npm run dev'];
const names = 'backend,frontend';
const colors = 'cyan,green';

console.log('[dev:all] Launching backend :3011 + frontend :3000.');

const concurrentlyPath = path.join(
  frontendDir,
  'node_modules',
  'concurrently',
  'dist',
  'bin',
  'concurrently.js',
);

const concurrentlyArgs = [
  concurrentlyPath,
  '--names',
  names,
  '--prefix-colors',
  colors,
  ...commands,
];

const child = spawn(process.execPath, concurrentlyArgs, {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error('[dev:all] Failed to start:', err.message);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 0));
