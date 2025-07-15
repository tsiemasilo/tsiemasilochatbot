#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Build client with Vite
console.log('Building client...');
const viteProcess = spawn('npx', ['vite', 'build', '--outDir', 'dist/public'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Client build failed with code ${code}`);
    process.exit(code);
  }
  console.log('Client build completed successfully!');
});

viteProcess.on('error', (error) => {
  console.error('Failed to start client build:', error);
  process.exit(1);
});