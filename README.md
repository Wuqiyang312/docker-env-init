# docker-env-init

Create and manage Docker development environments with a single command.

## Installation

```bash
npm install -g
```

## Usage

### Initialize a new Docker environment

```bash
docker-env-init init [directory]
# Default: creates ./docker-env
```

### Switch Ubuntu version

```bash
docker-env-init use 22.04
docker-env-init current
```

### Container management

```bash
docker-env-init build    # Build images
docker-env-init up       # Start container (detached)
docker-env-init down     # Stop container
docker-env-init run      # Start container (foreground)
docker-env-init exec     # Enter running container
```

### Custom configurations

```bash
docker-env-init create myproject    # Create custom compose file
docker-env-init switch myproject.yml # Switch to custom config
docker-env-init list                # List available configs
```

## Available Ubuntu Versions

- 20.04
- 22.04
- 24.04

## Example Workflow

```bash
# Create new environment
docker-env-init init my-project
cd my-project

# Select Ubuntu version
docker-env-init use 22.04

# Build and start container
docker-env-init build
docker-env-init up

# Enter container
docker-env-init exec
```

## License

MIT
