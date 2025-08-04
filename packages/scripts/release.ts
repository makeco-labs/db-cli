#!/usr/bin/env bun

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

type ReleaseType = 'patch' | 'minor' | 'prerelease';

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function execCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: 'pipe'
    }).toString().trim();
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

function updatePackageVersion(packagePath: string, newVersion: string): void {
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function incrementVersion(currentVersion: string, releaseType: ReleaseType): string {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]?.split('-')[0] || '0');

  switch (releaseType) {
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'prerelease':
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').substring(0, 8);
      return `${major}.${minor}.${patch + 1}-dev.${timestamp}`;
    default:
      throw new Error(`Unknown release type: ${releaseType}`);
  }
}

// ========================================================================
// MAIN RELEASE LOGIC
// ========================================================================

function main(): void {
  const releaseType: ReleaseType = (process.argv[2] as ReleaseType) || 'patch';
  
  if (!['patch', 'minor', 'prerelease'].includes(releaseType)) {
    console.error('❌ Invalid release type. Use: patch, minor, or prerelease');
    process.exit(1);
  }

  console.log(`🚀 Starting ${releaseType} release...`);

  // Check if we're in a clean git state
  const gitStatus = execCommand('git status --porcelain');
  if (gitStatus && !gitStatus.includes('M package.json')) {
    console.error('❌ Working directory is not clean. Please commit or stash changes first.');
    process.exit(1);
  }

  // Ensure we're on main branch
  const currentBranch = execCommand('git branch --show-current');
  if (currentBranch !== 'main') {
    console.error('❌ Please switch to main branch before releasing');
    process.exit(1);
  }

  // Pull latest changes
  console.log('📥 Pulling latest changes...');
  execCommand('git pull origin main');

  // Get current version
  const packagePath = join(process.cwd(), 'packages', 'db-cli');
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Calculate new version
  const newVersion = incrementVersion(currentVersion, releaseType);
  
  console.log(`📦 Bumping version: ${currentVersion} → ${newVersion}`);
  
  // Update package.json
  updatePackageVersion(packagePath, newVersion);
  
  // Configure git user if not set
  try {
    execCommand('git config user.email');
  } catch {
    execCommand('git config user.email "action@github.com"');
    execCommand('git config user.name "Release Script"');
  }
  
  // Commit version bump
  console.log('📝 Committing version bump...');
  execCommand('git add packages/db-cli/package.json');
  execCommand(`git commit -m "chore: bump version to ${newVersion}"`);
  
  // Create and push tag
  console.log('🏷️  Creating and pushing tag...');
  const tagName = `v${newVersion}`;
  execCommand(`git tag ${tagName}`);
  execCommand('git push origin main');
  execCommand(`git push origin ${tagName}`);
  
  console.log('✅ Release initiated successfully!');
  console.log(`🎉 Version ${newVersion} will be published automatically via GitHub Actions`);
  console.log(`📋 Track progress at: https://github.com/makeco-labs/db-cli/actions`);
}

if (import.meta.main) {
  main();
}