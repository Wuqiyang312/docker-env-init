# docker-env-init

使用单个命令创建和管理 Docker 开发环境。

## 安装

```bash
npm install -g
```

## 快速开始

### 1. 安装 Docker

```bash
docker-env-init install          # Auto-select mirror
docker-env-init install cn       # Use China mirror
```

### 2. 初始化新的 Docker 环境

### 3. 选择版本并启动

```bash
docker-env-init use 22.04
docker-env-init up
docker-env-init exec
```

## 命令

### 环境管理

| 命令 | 说明 |
|---------|-------------|
| `init [dir]` | 创建 docker-env 模板 |
| `init <dir> -s <system>` | 使用指定模板系统创建 |
| `use <version>` | 切换到特定版本 |
| `current` | 显示当前活动版本 |
| `list` | 列出可用的 compose 文件 |

### 容器管理

| 命令 | 说明 |
|---------|-------------|
| `build` | 构建镜像 |
| `up` | 启动容器（后台模式） |
| `down` | 停止容器 |
| `run` | 启动容器（前台模式） |
| `exec` | 进入运行中的容器 |

### 模板

| 命令 | 说明 |
|---------|-------------|
| `templates` | 列出可用的模板系统 |
| `create <name>` | 创建自定义 compose 文件 |
| `switch <file>` | 切换到自定义 compose 文件 |

### 系统

| 命令 | 说明 |
|---------|-------------|
| `install [mirror]` | 安装 Docker |
| `doctor` | 检查 Docker 环境 |
| `help` | 显示帮助信息 |

## 模板系统

### 内置模板

- `ubuntu` - Ubuntu 20.04, 22.04, 24.04

### 自定义模板

在 `~/.docker-env-init/templates/` 中创建自定义模板：

```bash
# 创建新的模板系统
mkdir -p ~/.docker-env-init/templates/my-env
cp templates/ubuntu/* ~/.docker-env-init/templates/my-env/

# 根据需要编辑模板
vim ~/.docker-env-init/templates/my-env/Dockerfile

# 使用自定义模板
docker-env-init init my-project -s my-env
```

### 模板结构

```
templates/
└── <system-name>/
    ├── Dockerfile           # Default Dockerfile
    ├── Dockerfile.<version> # Version-specific Dockerfiles
    ├── docker-compose.<version>.yml  # Compose files
    └── README.md            # Optional template info
```

## 可用 Docker 镜像源

- `cn` - 官方中国镜像源
- `aliyun` - 阿里云镜像源
- `azure` - Azure 中国镜像源
- `tencent` - 腾讯云镜像源
- `netease` - 网易镜像源

## 示例工作流程

```bash
# 安装 Docker
docker-env-init install cn

# 检查环境
docker-env-init doctor

# 使用默认模板创建新环境
docker-env-init init my-project
cd my-project

# 或使用指定的模板系统
docker-env-init init my-project -s ubuntu

# 选择版本
docker-env-init use 22.04
docker-env-init current

# 构建并启动
docker-env-init build
docker-env-init up

# 进入容器
docker-env-init exec

# 完成后
docker-env-init down
```

## 许可证

MIT
