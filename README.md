# docker-env-init

Create and manage Docker development environments with a single command.

## Installation

```bash
npm install -g
```

## Quick Start

### 1. Install Docker

```bash
docker-env-init install          # Auto-select mirror
docker-env-init install cn       # Use China mirror
```

### 2. Initialize a new Docker environment

```bash
docker-env-init init my-project
cd my-project
```

### 3. Select version and start

```bash
docker-env-init use 22.04
docker-env-init up
docker-env-init exec
```

## Commands

### Environment Management

| Command | Description |
|---------|-------------|
| `init [dir]` | Create docker-env template |
| `init <dir> -s <system>` | Create with specific template system |
| `use <version>` | Switch to specific version |
| `current` | Show current active version |
| `list` | List available compose files |

### Container Management

| Command | Description |
|---------|-------------|
| `build` | Build images |
| `up` | Start container (detached) |
| `down` | Stop container |
| `run` | Start container (foreground) |
| `exec` | Enter running container |

### Templates

| Command | Description |
|---------|-------------|
| `templates` | List available template systems |
| `create <name>` | Create custom compose file |
| `switch <file>` | Switch to custom compose file |

### System

| Command | Description |
|---------|-------------|
| `install [mirror]` | Install Docker |
| `doctor` | Check Docker environment |
| `help` | Show help message |

## Template Systems

### Built-in Templates

- `ubuntu` - Ubuntu 20.04, 22.04, 24.04

### Custom Templates

Create custom templates in `~/.docker-env-init/templates/`:

```bash
# Create a new template system
mkdir -p ~/.docker-env-init/templates/my-env
cp templates/ubuntu/* ~/.docker-env-init/templates/my-env/

# Edit the templates as needed
vim ~/.docker-env-init/templates/my-env/Dockerfile

# Use your custom template
docker-env-init init my-project -s my-env
```

### Template Structure

```
templates/
└── <system-name>/
    ├── Dockerfile           # Default Dockerfile
    ├── Dockerfile.<version> # Version-specific Dockerfiles
    ├── docker-compose.<version>.yml  # Compose files
    └── README.md            # Optional template info
```

## Available Docker Mirrors

- `cn` - Official China mirror
- `aliyun` - Alibaba Cloud mirror
- `azure` - Azure China mirror
- `tencent` - Tencent Cloud mirror
- `netease` - NetEase mirror

## Example Workflow

```bash
# Install Docker
docker-env-init install cn

# Check environment
docker-env-init doctor

# Create new environment with default template
docker-env-init init my-project
cd my-project

# Or use a specific template system
docker-env-init init my-project -s ubuntu

# Select version
docker-env-init use 22.04
docker-env-init current

# Build and start
docker-env-init build
docker-env-init up

# Enter container
docker-env-init exec

# When done
docker-env-init down
```

## License

MIT
