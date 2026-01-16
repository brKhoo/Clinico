#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

console.log('Checking environment setup...\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('ERROR: .env file not found!');
  console.log('Creating .env from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('SUCCESS: Created .env file');
  } else {
    // Create basic .env
    const envContent = `DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-key"
`;
    fs.writeFileSync(envPath, envContent);
    console.log('SUCCESS: Created .env file with default values');
  }
  console.log('\nWARNING: Please update NEXTAUTH_SECRET in .env file!');
  console.log('   Run: openssl rand -base64 32\n');
} else {
  console.log('SUCCESS: .env file exists');
  
  // Check for NEXTAUTH_SECRET
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('NEXTAUTH_SECRET=') || envContent.includes('NEXTAUTH_SECRET="change-this')) {
    console.log('WARNING: NEXTAUTH_SECRET is missing or not set!');
    console.log('   This will cause authentication to fail.');
    console.log('   Generate one with: openssl rand -base64 32\n');
  } else {
    console.log('SUCCESS: NEXTAUTH_SECRET is set');
  }
  
  if (!envContent.includes('DATABASE_URL=')) {
    console.log('WARNING: DATABASE_URL is missing!');
  } else {
    console.log('SUCCESS: DATABASE_URL is set');
  }
  
  if (!envContent.includes('NEXTAUTH_URL=')) {
    console.log('WARNING: NEXTAUTH_URL is missing!');
  } else {
    console.log('SUCCESS: NEXTAUTH_URL is set');
  }
}

console.log('\nEnvironment check complete!\n');
