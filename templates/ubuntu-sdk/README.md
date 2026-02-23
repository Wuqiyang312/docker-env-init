# Ubuntu Templates

Ubuntu Docker environment templates for docker-env-init.

## Files

- `Dockerfile` - Default Dockerfile (Ubuntu 22.04)
- `Dockerfile.<version>` - Version-specific Dockerfiles
- `docker-compose.<version>.yml` - Docker Compose configurations

## Versions

- 20.04 (Focal Fossa)
- 22.04 (Jammy Jellyfish)
- 24.04 (Noble Numbat)

## Customization

Copy this directory to create your own template:

```bash
cp -r templates/ubuntu templates/my-custom-env
```

Then modify the Dockerfiles and compose files as needed.
