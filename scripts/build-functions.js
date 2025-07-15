#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist/functions directory exists
if (!existsSync('dist/functions')) {
  mkdirSync('dist/functions', { recursive: true });
}

// Build functions with esbuild
console.log('Building functions...');
const esbuildProcess = spawn('npx', [
  'esbuild',
  'src/functions/server.ts',
  '--platform=node',
  '--packages=external',
  '--bundle',
  '--format=esm',
  '--outfile=dist/functions/server.js'
], {
  stdio: 'inherit',
  shell: true
});

esbuildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Functions build failed with code ${code}`);
    process.exit(code);
  }
  console.log('Functions build completed successfully!');
});

esbuildProcess.on('error', (error) => {
  console.error('Failed to start functions build:', error);
  process.exit(1);
});