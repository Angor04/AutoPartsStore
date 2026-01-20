#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Auto Parts Store Server...');
console.log('Port:', process.env.PORT || 4321);
console.log('Environment:', process.env.NODE_ENV || 'development');

const entryFile = path.join(process.cwd(), 'dist/server/entry.mjs');

// Verificar si existe el archivo
if (!fs.existsSync(entryFile)) {
  console.error('❌ FATAL ERROR: Entry file not found:', entryFile);
  console.error('Current directory:', process.cwd());
  console.error('Files in dist/:', fs.existsSync('dist') ? fs.readdirSync('dist') : 'dist/ no existe');
  process.exit(1);
}

console.log('✅ Entry file found:', entryFile);

// Ejecutar el servidor
const server = spawn('node', [entryFile], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || 4321,
    HOST: process.env.HOST || '0.0.0.0',
  },
});

server.on('error', (err) => {
  console.error('❌ Server spawn error:', err);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  console.log(`❌ Server exited with code ${code} and signal ${signal}`);
  process.exit(code || 1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.kill('SIGINT');
});
