#!/usr/bin/env node

// Build optimization script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting optimized build process...');

// Step 1: Build frontend with optimizations
console.log('Building frontend...');
try {
  execSync('NODE_OPTIONS="--max-old-space-size=4096" vite build --mode production', { 
    stdio: 'inherit',
    timeout: 300000 // 5 minutes max
  });
} catch (error) {
  console.error('Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Build backend
console.log('Building backend...');
try {
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit',
    timeout: 60000 // 1 minute max
  });
} catch (error) {
  console.error('Backend build failed:', error.message);
  process.exit(1);
}

console.log('Build completed successfully!');