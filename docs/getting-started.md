# 快速开始 Getting Started

本指南帮助你在 10 分钟内启动 WebAgent（MCP 代理转发服务）。

## 前置条件 Prerequisites

步骤 1：准备必需与可选软件。

必需软件 Required:

- Node.js >= 22
- pnpm >= 10

可选软件 Optional:

- pm2（生产进程管理）
- curl（接口验证）

验证命令 Verify:

```bash
node --version
pnpm --version
```

预期输出 Expected:

```
v22.x.x
10.x.x
```

## 安装 Installation

步骤 2：克隆仓库。

```bash
git clone https://github.com/opentiny/web-agent.git
cd web-agent
```

预期结果: 当前目录包含 `package.json` 与 `example.env`。

步骤 3：安装依赖。

```bash
pnpm install
```

预期结果: 依赖安装完成并生成 `node_modules/`。

Tips: 网络慢可使用国内镜像。

```bash
pnpm config set registry https://registry.npmmirror.com
```

步骤 4：配置环境变量。

```bash
cp example.env .env
```

预期结果: `.env` 已创建。

配置项说明（默认回退值来自 `src/config/index.ts`，示例值来自 `example.env`）：

| 变量 Variable | 默认值 Default          | 说明 Description                                  |
| ------------- | ----------------------- | ------------------------------------------------- |
| `AGENT_PORT`  | `3000`                  | 服务端口，映射 `config.app.port`                  |
| `AGENT_HOST`  | `0.0.0.0`               | 监听地址，映射 `config.app.host`                  |
| `NODE_ENV`    | `development`           | 运行环境，映射 `config.app.env`                   |
| `CORS_ORIGIN` | `http://localhost:3000` | 允许跨域列表，逗号分隔，映射 `config.cors.origin` |

补充说明 Notes:

- API 前缀固定为 `/api/v1`（`config.app.apiPrefix`）。
- `CORS_ORIGIN` 会按逗号拆分为数组。
- CORS `credentials` 固定为 `true`。
- `example.env` 默认设置 `NODE_ENV=production`，本地开发可改为 `development`。

## 运行 Running

步骤 5：开发模式（热更新）。

```bash
pnpm dev
```

预期输出:

```
WebAgent server started on 0.0.0.0:3000
Environment: development
```

说明: 若沿用 `example.env`，环境会显示为 `production`，请按需调整 `.env`。

步骤 6：生产模式。

```bash
pnpm build
pnpm start
```

预期输出:

```
WebAgent server started on 0.0.0.0:3000
Environment: production
```

检查点: 监听地址与端口应与 `.env` 一致。
说明: `pnpm start` 依赖已生成的 `dist`，请确保已执行 `pnpm build`。

## 验证 Verification

步骤 7：健康检查。

```bash
curl http://localhost:3000/health
```

预期响应 Expected（节选）:

```json
{
  "success": true,
  "data": {
    "name": "@opentiny/NEXT-web-agent",
    "version": "1.0.0",
    "status": "running",
    "environment": "production",
    "nodeVersion": "v22.x.x",
    "endpoints": {
      "health": "/health",
      "metrics": "/health/metrics",
      "sessions": "/api/v1/webmcp/list",
      "remoters": "/api/v1/webmcp/remoter",
      "tools": "/api/v1/webmcp/tools",
      "sse": "/api/v1/webmcp/sse",
      "messages": "/api/v1/webmcp/messages",
      "mcp": "/api/v1/webmcp/mcp"
    }
  }
}
```

故障提示: 若返回 404，请确认端口与前缀是否正确，服务是否已启动。

## 下一步

- [让你的应用智能化](https://docs.opentiny.design/next-sdk/guide/)

详细文档:

- `docs/api-reference.md`
- `README.md#deployment-guide`

常见用例:

- 使用 `GET /api/v1/webmcp/sse` 建立 SSE 连接
- 使用 `ALL /api/v1/webmcp/mcp` 进行 Streamable HTTP 转发
- 使用 `GET /health/metrics` 获取运行指标
