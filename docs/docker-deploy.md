# Docker 一键部署 Docker Deployment

本指南帮助你通过 Docker 一键部署 WebAgent 服务，无需在本地安装 Node.js 或 pnpm。

## 前置条件 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.17

验证命令 Verify:

```bash
docker --version
docker compose version
```

## 快速开始 Quick Start

步骤 1：克隆仓库。

```bash
git clone https://github.com/opentiny/web-agent.git
cd web-agent
```

步骤 2：配置环境变量。

```bash
cp example.env .env
```

按需编辑 `.env`，配置项说明见 [getting-started.md](./getting-started.md#安装-installation) 中的环境变量表。

> 提示：即使不创建 `.env` 文件，服务也可使用默认配置启动（端口 3000，监听 0.0.0.0）。

步骤 3：一键启动。

```bash
docker compose up -d
```

或使用 pnpm 脚本：

```bash
pnpm docker:up
```

预期结果: 容器构建完成并在后台运行。

步骤 4：验证服务。

```bash
# 查看容器状态
docker compose ps

# 健康检查
curl http://localhost:3000/health
```

预期响应（节选）:

```json
{
  "success": true,
  "data": {
    "status": "running",
    "environment": "production"
  }
}
```

> 提示：如果 `.env` 中设置了 `AGENT_PORT=3003`，则主机端口为 3003，请使用 `curl http://localhost:3003/health`。

## 常用命令 Common Commands

```bash
# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重新构建并启动（修改代码后）
docker compose up -d --build

# 仅构建镜像（不启动）
docker compose build
```

对应的 pnpm 脚本：

| 命令 Command                       | pnpm 脚本           | 说明 Description |
| ---------------------------------- | ------------------- | ---------------- |
| `docker compose up -d --build`     | `pnpm docker:up`    | 构建并启动       |
| `docker compose down`              | `pnpm docker:down`  | 停止并移除容器   |
| `docker compose logs -f web-agent` | `pnpm docker:logs`  | 查看实时日志     |
| `docker compose build`             | `pnpm docker:build` | 仅构建镜像       |

## 架构说明 Architecture

Docker 部署采用**多阶段构建**：

```
Stage 1 (builder)           Stage 2 (production)
┌─────────────────────┐     ┌─────────────────────┐
│ node:22-alpine      │     │ node:22-alpine      │
│                     │     │                     │
│ pnpm install (all)  │     │ pnpm install (prod) │
│ tsc 编译 TypeScript  │────▶│ COPY dist/          │
│                     │     │ USER node           │
│ 产物: dist/         │     │ HEALTHCHECK         │
└─────────────────────┘     └─────────────────────┘
  (构建后丢弃)                (最终镜像，体积最小)
```

## 端口配置 Port Configuration

容器内端口固定为 **3000**（由 `docker-compose.yml` 中 `environment` 设置）。

主机端口通过 `.env` 中的 `AGENT_PORT` 控制：

```
# .env
AGENT_PORT=8080   # 主机访问端口为 8080，容器内仍为 3000
```

映射关系：`主机 ${AGENT_PORT:-3000}` → `容器 3000`

## 故障排查 Troubleshooting

**容器启动失败：**

```bash
# 查看构建日志
docker compose logs web-agent

# 查看容器详细状态
docker inspect web-agent
```

**健康检查失败：**

```bash
# 进入容器内部检查
docker compose exec web-agent sh
# 在容器内执行
node -e "fetch('http://localhost:3000/health').then(r=>r.json()).then(console.log)"
```

**重新构建（代码或依赖变更后）：**

```bash
docker compose up -d --build
```

## 下一步

- 详细 API 接口文档：[api-reference.md](./api-reference.md)
- 项目架构说明：[architecture.md](./architecture.md)
