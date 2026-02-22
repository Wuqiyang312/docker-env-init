#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const templateLoader = require('../lib/template-loader');

const SCRIPT_DIR = process.env.INIT_CWD || process.cwd();
const COMPOSE_FILE = 'docker-compose.yml';

let DOCKER_COMPOSE_CMD = null;

function getDockerComposeCommand() {
  if (DOCKER_COMPOSE_CMD) return DOCKER_COMPOSE_CMD;
  
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    DOCKER_COMPOSE_CMD = 'docker compose';
    return DOCKER_COMPOSE_CMD;
  } catch (e) {
    try {
      execSync('docker-compose --version', { stdio: 'ignore' });
      DOCKER_COMPOSE_CMD = 'docker-compose';
      return DOCKER_COMPOSE_CMD;
    } catch (e2) {
      DOCKER_COMPOSE_CMD = 'docker compose';
      return DOCKER_COMPOSE_CMD;
    }
  }
}

function showUsage() {
  const systems = templateLoader.getSystemNames();
  const versions = templateLoader.getVersions('ubuntu') || [];
  
  console.log(`
Usage: docker-env-init <command> [options]

Commands:
  init [dir]          Create docker-env template in directory (default: docker-env)
  init <dir> -s <system>  Create with specific system template
  install [mirror]    Install Docker (optional: cn|aliyun|azure|tencent|netease)
  use <version>       Switch to specific version
  current             Show current active version
  build               Build images (uses current docker-compose.yml)
  up                  Start container in detached mode
  down                Stop and remove containers
  run                 Run container in foreground
  exec                Exec into running container
  create <name>       Create custom docker-compose.yml from template
  list                List all available compose files
  switch <file>       Switch to custom compose file
  templates           List available template systems
  doctor              Check Docker installation status
  help                Show this help message

Available systems: ${systems.join(', ')}
Available versions: ${versions.join(', ')}
Available mirrors: cn, aliyun, azure, tencent, netease

Examples:
  docker-env-init install              # Use default mirror
  docker-env-init install cn           # Use China mirror
  docker-env-init init my-docker-env
  docker-env-init init my-env -s ubuntu
  docker-env-init use 22.04
  docker-env-init build
  docker-env-init up
  docker-env-init templates
`);
}

function cmdInstall(mirror) {
  const validMirrors = ['cn', 'aliyun', 'azure', 'tencent', 'netease'];
  
  if (mirror && !validMirrors.includes(mirror)) {
    console.error(`Error: Invalid mirror '${mirror}'`);
    console.error(`Available mirrors: ${validMirrors.join(', ')}`);
    process.exit(1);
  }

  console.log('Installing Docker...');
  console.log(`Mirror: ${mirror || 'default (auto-select)'}`);
  console.log('');

  const url = 'https://linuxmirrors.cn/docker.sh';
  const script = `bash <(curl -sSL ${url})${mirror ? ` --mirror ${mirror}` : ''}`;
  
  console.log(`Executing: ${script}`);
  console.log('');
  
  try {
    execSync(`bash <(curl -sSL ${url})${mirror ? ` --mirror ${mirror}` : ''}`, {
      stdio: 'inherit',
      env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' }
    });
    console.log('');
    console.log('✓ Docker installed successfully');
  } catch (e) {
    console.error('Failed to install Docker');
    process.exit(1);
  }
}

function cmdDoctor() {
  console.log('Docker Environment Check\n');
  
  let hasCompose = false;
  
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
    console.log(`✓ Docker: ${dockerVersion}`);
  } catch (e) {
    console.log('✗ Docker: not installed');
    console.log('  Run: docker-env-init install');
  }
  
  try {
    const composeVersion = execSync('docker compose version', { encoding: 'utf8' }).trim();
    console.log(`✓ docker compose: ${composeVersion}`);
    hasCompose = true;
  } catch (e) {
    try {
      const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
      console.log(`✓ docker-compose: ${composeVersion} (legacy)`);
      hasCompose = true;
    } catch (e2) {
      console.log('✗ docker compose: not installed');
    }
  }
  
  if (!hasCompose) {
    console.log('  Note: docker compose is bundled with Docker Desktop / Docker Engine 20.10+');
  }
  
  try {
    execSync('docker info', { stdio: 'ignore' });
    console.log('✓ Docker daemon: running');
  } catch (e) {
    console.log('✗ Docker daemon: not running');
  }
  
  try {
    const groups = execSync('groups', { encoding: 'utf8' });
    if (groups.includes('docker')) {
      console.log('✓ Docker group: user is member');
    } else {
      console.log('✗ Docker group: user not member (may need sudo)');
    }
  } catch (e) {
    console.log('✗ Docker group: check failed');
  }
}

function cmdTemplates() {
  console.log('Available template systems:\n');
  
  const templates = templateLoader.getTemplates();
  
  if (templates.length === 0) {
    console.log('  (no templates found)');
    console.log('\nCreate custom templates in:');
    console.log(`  ${path.join(process.env.HOME || '~', '.docker-env-init', 'templates')}`);
    return;
  }
  
  templates.forEach(t => {
    const versions = Array.from(t.versions).join(', ') || 'default';
    const marker = t.isCustom ? ' (custom)' : '';
    console.log(`  ${t.name}${marker}`);
    console.log(`    Versions: ${versions}`);
    console.log(`    Files: ${t.files.size}`);
  });
}

function cmdInit(dir = 'docker-env', system = 'ubuntu') {
  if (fs.existsSync(dir)) {
    console.error(`Error: ${dir} already exists!`);
    process.exit(1);
  }

  const template = templateLoader.getTemplate(system);
  if (!template) {
    console.error(`Error: Template '${system}' not found`);
    console.error(`Available systems: ${templateLoader.getSystemNames().join(', ')}`);
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });

  template.files.forEach((content, filename) => {
    fs.writeFileSync(path.join(dir, filename), content);
    console.log(`Created ${filename}`);
  });

  const switchShPath = path.join(dir, 'switch.sh');
  fs.writeFileSync(switchShPath, templateLoader.getSwitchShTemplate());
  fs.chmodSync(switchShPath, '755');
  console.log('Created switch.sh');

  console.log(`\n✓ docker-env template created in ${dir}/`);
  console.log(`  System: ${system}${template.isCustom ? ' (custom)' : ''}`);
  console.log(`\nUsage:`);
  console.log(`  cd ${dir}`);
  console.log(`  docker-env-init use ${template.defaultVersion || '22.04'}`);
  console.log(`  docker-env-init up`);
}

function cmdUse(version) {
  if (!version) {
    console.error('Error: version required');
    showUsage();
    process.exit(1);
  }

  const composeFile = path.join(SCRIPT_DIR, `docker-compose.${version}.yml`);
  if (!fs.existsSync(composeFile)) {
    console.error(`Error: docker-compose.${version}.yml not found`);
    console.error('Run \'docker-env-init list\' to see available versions');
    process.exit(1);
  }

  linkCompose(composeFile);
}

function linkCompose(target) {
  const composePath = path.join(SCRIPT_DIR, COMPOSE_FILE);
  
  if (fs.existsSync(composePath) || fs.lstatSync(composePath)?.isSymbolicLink()) {
    try {
      fs.unlinkSync(composePath);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }

  fs.symlinkSync(target, composePath);
  console.log(`Switched to: ${path.basename(target)}`);
}

function cmdCurrent() {
  const composePath = path.join(SCRIPT_DIR, COMPOSE_FILE);
  
  if (!fs.existsSync(composePath)) {
    console.log(`No ${COMPOSE_FILE} active. Run 'docker-env-init use <version>' first.`);
    return;
  }
  
  try {
    const stats = fs.lstatSync(composePath);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(composePath);
      console.log(`Current: ${path.basename(target)}`);
      return;
    }
  } catch (e) {
    // ignore
  }
  
  console.log(`Current: ${COMPOSE_FILE}`);
}

function cmdBuild() {
  runDockerCompose('build');
}

function cmdUp() {
  runDockerCompose('up', ['-d']);
  console.log('Container started. Run \'docker-env-init exec\' to enter.');
}

function cmdDown() {
  runDockerCompose('down');
}

function cmdRun() {
  runDockerCompose('up');
}

function cmdExec() {
  try {
    runDockerCompose('exec', ['compile-env', 'bash'], { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to exec into container. Is it running?');
    process.exit(1);
  }
}

function cmdCreate(name) {
  if (!name) {
    console.error('Error: name required');
    showUsage();
    process.exit(1);
  }

  const customFile = path.join(SCRIPT_DIR, `docker-compose.${name}.yml`);
  
  if (fs.existsSync(customFile)) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question(`File ${path.basename(customFile)} exists. Overwrite? [y/N] `, (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'y') {
          process.exit(0);
        }
        createCustomCompose(customFile);
        resolve();
      });
    });
  }
  
  createCustomCompose(customFile);
}

function createCustomCompose(filePath) {
  const content = `version: '3.8'

services:
  compile-env:
    build:
      context: .
      dockerfile: Dockerfile.22.04
    image: ubuntu-compile-env:custom
    container_name: dev-container-custom
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace
    stdin_open: true
    tty: true
`;
  
  fs.writeFileSync(filePath, content);
  console.log(`Created: ${path.basename(filePath)}`);
  console.log(`Edit the file as needed, then run: docker-env-init switch ${path.basename(filePath)}`);
}

function cmdList() {
  console.log('Available docker-compose files:');
  
  if (!fs.existsSync(SCRIPT_DIR)) {
    console.log('  (no files found)');
    return;
  }
  
  const files = fs.readdirSync(SCRIPT_DIR)
    .filter(f => f.startsWith('docker-compose.') && f.endsWith('.yml') && f !== COMPOSE_FILE);
  
  let currentTarget = null;
  const composePath = path.join(SCRIPT_DIR, COMPOSE_FILE);
  try {
    if (fs.lstatSync(composePath).isSymbolicLink()) {
      currentTarget = fs.readlinkSync(composePath);
    }
  } catch (e) {
    // ignore
  }
  
  if (files.length === 0) {
    console.log('  (no files found)');
    return;
  }
  
  files.forEach(f => {
    const isCurrent = currentTarget === f;
    console.log(`  ${f}${isCurrent ? ' (active)' : ''}`);
  });
}

function cmdSwitch(file) {
  if (!file) {
    console.error('Error: file name required');
    showUsage();
    process.exit(1);
  }

  const target = path.join(SCRIPT_DIR, file);
  if (!fs.existsSync(target)) {
    console.error(`Error: ${file} not found`);
    process.exit(1);
  }

  linkCompose(target);
}

function runDockerCompose(command, args = [], options = {}) {
  const composePath = path.join(SCRIPT_DIR, COMPOSE_FILE);
  if (!fs.existsSync(composePath)) {
    console.error(`Error: ${COMPOSE_FILE} not found. Run 'docker-env-init use <version>' first.`);
    process.exit(1);
  }

  const composeCmd = getDockerComposeCommand();
  const cmd = `${composeCmd} -f "${composePath}" ${command} ${args.join(' ')}`;
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const flagIndex = args.findIndex(arg => arg === '-s' || arg === '--system');
  let system = 'ubuntu';
  
  if (flagIndex !== -1 && args[flagIndex + 1]) {
    system = args[flagIndex + 1];
    args.splice(flagIndex, 2);
  }

  switch (command) {
    case 'install':
      cmdInstall(args[1]);
      break;
    case 'init':
      cmdInit(args[1] || 'docker-env', system);
      break;
    case 'templates':
      cmdTemplates();
      break;
    case 'use':
      cmdUse(args[1]);
      break;
    case 'current':
      cmdCurrent();
      break;
    case 'doctor':
      cmdDoctor();
      break;
    case 'build':
      cmdBuild();
      break;
    case 'up':
      cmdUp();
      break;
    case 'down':
      cmdDown();
      break;
    case 'run':
      cmdRun();
      break;
    case 'exec':
      cmdExec();
      break;
    case 'create':
      await cmdCreate(args[1]);
      break;
    case 'list':
      cmdList();
      break;
    case 'switch':
      cmdSwitch(args[1]);
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showUsage();
      break;
  }
}

main();
