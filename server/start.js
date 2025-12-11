#!/usr/bin/env node

/**
 * CSSC Server Startup Script
 * 
 * This script provides a simple way to start the CSSC server
 * with proper error handling and environment checks.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if .env file exists
const envPath = join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Please create a .env file with your database configuration.');
  console.log('📝 Example:');
  console.log('   DB_HOST=localhost');
  console.log('   DB_PORT=5432');
  console.log('   DB_NAME=cssc_db');
  console.log('   DB_USER=postgres');
  console.log('   DB_PASSWORD=your_password');
  console.log('   JWT_SECRET=your_jwt_secret');
  process.exit(1);
}

// Start the server
console.log('🚀 Starting CSSC Server...');
console.log('📁 Working directory:', __dirname);

const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
  console.log('✅ Server stopped gracefully');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});