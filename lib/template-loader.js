const fs = require('fs');
const path = require('path');

const BUILTIN_TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CUSTOM_TEMPLATES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.docker-env-init', 'templates');

class TemplateLoader {
  constructor() {
    this.templates = new Map();
    this.loadBuiltinTemplates();
    this.loadCustomTemplates();
  }

  loadBuiltinTemplates() {
    if (!fs.existsSync(BUILTIN_TEMPLATES_DIR)) {
      return;
    }

    const systems = fs.readdirSync(BUILTIN_TEMPLATES_DIR);
    systems.forEach(system => {
      const systemPath = path.join(BUILTIN_TEMPLATES_DIR, system);
      if (fs.statSync(systemPath).isDirectory()) {
        this.loadSystem(system, systemPath);
      }
    });
  }

  loadCustomTemplates() {
    if (!fs.existsSync(CUSTOM_TEMPLATES_DIR)) {
      return;
    }

    const systems = fs.readdirSync(CUSTOM_TEMPLATES_DIR);
    systems.forEach(system => {
      const systemPath = path.join(CUSTOM_TEMPLATES_DIR, system);
      if (fs.statSync(systemPath).isDirectory()) {
        this.loadSystem(system, systemPath, true);
      }
    });
  }

  loadSystem(name, dirPath, isCustom = false) {
    const files = fs.readdirSync(dirPath);
    const template = {
      name,
      path: dirPath,
      isCustom,
      files: new Map(),
      versions: new Set(),
      defaultVersion: null
    };

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (!fs.statSync(filePath).isDirectory()) {
        const content = fs.readFileSync(filePath, 'utf8');
        template.files.set(file, content);

        const versionMatch = file.match(/\.(\d+\.\d+)\./);
        if (versionMatch) {
          template.versions.add(versionMatch[1]);
        }

        if (file === 'Dockerfile' && !template.defaultVersion) {
          template.defaultVersion = 'default';
        }
      }
    });

    if (template.versions.size > 0) {
      template.defaultVersion = Array.from(template.versions)[0];
    }

    this.templates.set(name, template);
  }

  getTemplate(name) {
    return this.templates.get(name);
  }

  getTemplates() {
    return Array.from(this.templates.values());
  }

  getSystemNames() {
    return Array.from(this.templates.keys());
  }

  getFileContent(system, filename) {
    const template = this.templates.get(system);
    if (!template) {
      return null;
    }
    return template.files.get(filename);
  }

  getVersions(system) {
    const template = this.templates.get(system);
    if (!template) {
      return [];
    }
    return Array.from(template.versions);
  }

  getComposeFile(system, version) {
    const filename = `docker-compose.${version}.yml`;
    return this.getFileContent(system, filename);
  }

  getDockerfile(system, version) {
    const filename = version ? `Dockerfile.${version}` : 'Dockerfile';
    return this.getFileContent(system, filename);
  }

  getSwitchShTemplate() {
    return `#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./switch.sh <version>"
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

echo "Switched to version $VERSION"
echo "Run 'docker compose up -d' to start the container"
`;
  }

  createCustomTemplateDir(name, baseSystem = 'ubuntu') {
    const customDir = path.join(CUSTOM_TEMPLATES_DIR, name);
    
    if (!fs.existsSync(CUSTOM_TEMPLATES_DIR)) {
      fs.mkdirSync(CUSTOM_TEMPLATES_DIR, { recursive: true });
    }

    if (fs.existsSync(customDir)) {
      throw new Error(`Template '${name}' already exists`);
    }

    const baseTemplate = this.templates.get(baseSystem);
    if (baseTemplate) {
      fs.mkdirSync(customDir, { recursive: true });
      baseTemplate.files.forEach((content, filename) => {
        fs.writeFileSync(path.join(customDir, filename), content);
      });
    } else {
      fs.mkdirSync(customDir, { recursive: true });
      const defaultDockerfile = `FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list && \\
    sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

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
    gcc-arm-linux-gnueabihf \\
    g++-arm-linux-gnueabihf \\
    device-tree-compiler \\
    libncurses5-dev \\
    libelf-dev \\
    bc \\
    flex \\
    bison \\
    libfdt-dev \\
    rsync \\
    python3 \\
    python3-pip \\
    && rm -rf /var/lib/apt/lists/* \\
    && apt-get clean

ARG HOST_UID=1000
ARG HOST_GID=1000

RUN groupadd -g \${HOST_GID} dockeruser && \\
    useradd -m -u \${HOST_UID} -g \${HOST_GID} dockeruser

USER dockeruser
WORKDIR /workspace

CMD ["bash"]
`;
      fs.writeFileSync(path.join(customDir, 'Dockerfile'), defaultDockerfile);
      fs.writeFileSync(path.join(customDir, 'Dockerfile.22.04'), defaultDockerfile);
    }

    this.loadSystem(name, customDir, true);
    return customDir;
  }

  exportTemplate(system, targetDir) {
    const template = this.templates.get(system);
    if (!template) {
      throw new Error(`Template '${system}' not found`);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    template.files.forEach((content, filename) => {
      fs.writeFileSync(path.join(targetDir, filename), content);
    });

    const switchShPath = path.join(targetDir, 'switch.sh');
    fs.writeFileSync(switchShPath, this.getSwitchShTemplate());
    fs.chmodSync(switchShPath, '755');

    return targetDir;
  }
}

module.exports = new TemplateLoader();
