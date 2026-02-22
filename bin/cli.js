#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = process.env.INIT_CWD || process.cwd();
const COMPOSE_FILE = 'docker-compose.yml';
const AVAILABLE_VERSIONS = ['20.04', '22.04', '24.04'];

const templates = {
  'Dockerfile': `FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN apt-get update && apt-get install -y \\
    build-essential \\
    cmake \\
    make \\
    git \\
    vim \\
    curl \\
    wget \\
    pkg-config \\
    libssl-dev \\
    gdb \\
    && rm -rf /var/lib/apt/lists/* \\
    && apt-get clean

WORKDIR /workspace

CMD ["bash"]
`,
  'Dockerfile.20.04': `FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN apt-get update && apt-get install -y \\
    build-essential \\
    cmake \\
    make \\
    git \\
    vim \\
    curl \\
    wget \\
    pkg-config \\
    libssl-dev \\
    gdb \\
    && rm -rf /var/lib/apt/lists/* \\
    && apt-get clean

WORKDIR /workspace

CMD ["bash"]
`,
  'Dockerfile.22.04': `FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN apt-get update && apt-get install -y \\
    build-essential \\
    cmake \\
    make \\
    git \\
    vim \\
    curl \\
    wget \\
    pkg-config \\
    libssl-dev \\
    gdb \\
    && rm -rf /var/lib/apt/lists/* \\
    && apt-get clean

WORKDIR /workspace

CMD ["bash"]
`,
  'Dockerfile.24.04': `FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN apt-get update && apt-get install -y \\
    build-essential \\
    cmake \\
    make \\
    git \\
    vim \\
    curl \\
    wget \\
    pkg-config \\
    libssl-dev \\
    gdb \\
    && rm -rf /var/lib/apt/lists/* \\
    && apt-get clean

WORKDIR /workspace

CMD ["bash"]
`,
  'docker-compose.20.04.yml': `version: '3.8'

services:
  compile-env:
    build:
      context: .
      dockerfile: Dockerfile.20.04
    image: ubuntu-compile-env:20.04
    container_name: dev-container-20.04
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace
    stdin_open: true
    tty: true
`,
  'docker-compose.22.04.yml': `version: '3.8'

services:
  compile-env:
    build:
      context: .
      dockerfile: Dockerfile.22.04
    image: ubuntu-compile-env:22.04
    container_name: dev-container-22.04
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace
    stdin_open: true
    tty: true
`,
  'docker-compose.24.04.yml': `version: '3.8'

services:
  compile-env:
    build:
      context: .
      dockerfile: Dockerfile.24.04
    image: ubuntu-compile-env:24.04
    container_name: dev-container-24.04
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace
    stdin_open: true
    tty: true
`
};

function showUsage() {
  console.log(`
Usage: docker-env-init <command> [options]

Commands:
  init [dir]          Create docker-env template in directory (default: docker-env)
  use <version>       Switch to specific Ubuntu version
  current             Show current active version
  build               Build images (uses current docker-compose.yml)
  up                  Start container in detached mode
  down                Stop and remove containers
  run                 Run container in foreground
  exec                Exec into running container
  create <name>       Create custom docker-compose.yml from template
  list                List all available compose files
  switch <file>       Switch to custom compose file
  help                Show this help message

Available versions: ${AVAILABLE_VERSIONS.join(' ')}

Examples:
  docker-env-init init my-docker-env
  docker-env-init use 22.04
  docker-env-init build
  docker-env-init up
  docker-env-init create myproject
  docker-env-init switch docker-compose.custom.yml
`);
}

function cmdInit(dir = 'docker-env') {
  if (fs.existsSync(dir)) {
    console.error(`Error: ${dir} already exists!`);
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });

  Object.entries(templates).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(dir, filename), content);
    console.log(`Created ${filename}`);
  });

  const switchShPath = path.join(dir, 'switch.sh');
  fs.writeFileSync(switchShPath, getSwitchShTemplate());
  fs.chmodSync(switchShPath, '755');
  console.log('Created switch.sh');

  console.log(`\n✓ docker-env template created in ${dir}/`);
  console.log(`\nUsage:`);
  console.log(`  cd ${dir}`);
  console.log(`  docker-env-init use 22.04`);
  console.log(`  docker-env-init up`);
}

function getSwitchShTemplate() {
  return `#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./switch.sh <20.04|22.04|24.04>"
    exit 1
fi

DOCKER_FILE="Dockerfile.$VERSION"
COMPOSE_FILE="docker-compose.$VERSION.yml"

if [ ! -f "$DOCKER_FILE" ]; then
    echo "Error: Dockerfile for version $VERSION not found"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: docker-compose file for version $VERSION not found"
    exit 1
fi

cp "$DOCKER_FILE" Dockerfile
cp "$COMPOSE_FILE" docker-compose.yml

echo "Switched to Ubuntu $VERSION"
echo "Run 'docker-compose up -d' to start the container"
`;
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

  const cmd = `docker-compose -f "${composePath}" ${command} ${args.join(' ')}`;
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      cmdInit(process.argv[3] || 'docker-env');
      break;
    case 'use':
      cmdUse(process.argv[3]);
      break;
    case 'current':
      cmdCurrent();
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
      await cmdCreate(process.argv[3]);
      break;
    case 'list':
      cmdList();
      break;
    case 'switch':
      cmdSwitch(process.argv[3]);
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
