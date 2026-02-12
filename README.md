# WebAgent

<p align="center">
  <a href="https://opentiny.design" target="_blank" rel="noopener noreferrer">
    <img alt="OpenTiny Logo" src="logo.svg" height="100" style="max-width:100%;">
  </a>
</p>

<p align="center">
  <strong>Intelligent Agent Hub Service - MCP Proxy Forwarding Solution</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#project-architecture">Project Architecture</a> •
  <a href="#api-endpoints">API Endpoints</a> •
  <a href="#deployment-guide">Deployment Guide</a> •
  <a href="#contributing">Contributing</a>
</p>

English | [简体中文](README.zh-CN.md)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/opentiny/web-agent)

---

## Overview

WebAgent is an open-source intelligent agent hub service that provides core **MCP (Model Context Protocol)** proxy forwarding functionality.
It is part of the OpenTiny NEXT intelligent solution and is typically used together with `@opentiny/next-sdk`: business apps register MCP tools and connect to WebAgent via the SDK, while WebAgent handles connections, forwarding, and session management so AI/Agents can drive apps via natural language.
For a fuller ecosystem context, see:

- [OpenTiny website](https://opentiny.design/)
- [A transformation in the MCP ecosystem: OpenTiny NEXT’s inverse-thinking innovation](https://mp.weixin.qq.com/s/xMx5sfKGh2R-oZPGUwv70A).

![OpenTiny NEXT ecosystem and WebAgent position](docs/imgs/home_archi.jpg)

## Features

- 🔄 **MCP Proxy Forwarding**: Full support for Model Context Protocol proxy forwarding
- 📡 **SSE Connection Management**: Support for Server-Sent Events real-time communication
- 🌐 **Streamable HTTP**: Support for streaming HTTP request handling
- 🏥 **Health Checks**: Comprehensive health check endpoints for monitoring and operations
- 🔒 **Security Middleware**: Built-in CORS, Helmet, and other security middleware
- 📝 **Complete Logging**: Winston-based logging system with sensitive information masking
- 🚀 **Production Ready**: PM2 process management support, suitable for production deployment

## Quick Start

### Prerequisites

- **Node.js**: >= 22.0.0
- **pnpm**: >= 10 (recommended)

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/opentiny/web-agent.git
cd web-agent

# Install dependencies
pnpm install
```

### Configure Environment Variables

Copy the example configuration file and modify as needed:

```bash
cp example.env .env
```

Environment Variables:

| Variable      | Description                        | Default                 |
| ------------- | ---------------------------------- | ----------------------- |
| `AGENT_PORT`  | Service listening port             | `3000`                  |
| `AGENT_HOST`  | Listening address                  | `0.0.0.0`               |
| `NODE_ENV`    | Runtime environment                | `development`           |
| `CORS_ORIGIN` | CORS origin list (comma-separated) | `http://localhost:3000` |

Note: `example.env` sets `NODE_ENV=production`. Update `.env` to `development` for local dev if needed.

### Start the Service

```bash
# Development mode (hot reload)
pnpm dev

# Build production version
pnpm build

# Run production version (requires dist from build)
pnpm start

# Run with PM2
pnpm pm2:start
```

## Project Architecture

```
web-agent/
├── src/
│   ├── app.ts                 # Application entry point
│   ├── server.ts              # Server startup file
│   ├── Logger.ts              # Winston logger configuration
│   ├── config/
│   │   ├── index.ts           # Application configuration
│   │   └── logger.ts          # Logger configuration
│   ├── middleware/
│   │   ├── index.ts           # Middleware entry point
│   │   ├── corsMiddleware.ts  # CORS handling
│   │   ├── errorMiddleware.ts # Error handling
│   │   ├── loggingMiddleware.ts   # Request logging
│   │   ├── requestIdMiddleware.ts # Request ID
│   │   ├── securityMiddleware.ts  # Security headers
│   │   └── validationMiddleware.ts # Request validation
│   ├── routes/
│   │   ├── index.ts           # Routes entry point
│   │   ├── health.ts          # Health check routes
│   │   └── v1/
│   │       ├── index.ts       # v1 API routes entry
│   │       └── webmcp.ts      # MCP proxy routes
│   └── utils/
│       └── ...                # Utility functions
├── ecosystem.config.cjs       # PM2 configuration
├── example.env                # Environment variables example
├── package.json
└── tsconfig.json
```

### Core Modules

- **MCP Proxy Module** (`routes/v1/webmcp.ts`): Core functionality module that handles MCP protocol proxy forwarding, supporting both SSE and Streamable HTTP transport modes
- **Middleware Layer** (`middleware/`): Provides a complete request processing pipeline, including security, logging, validation, etc.
- **Configuration Module** (`config/`): Centralized application configuration management with environment variable overrides

## API Endpoints

### Health Check

| Endpoint           | Method | Description                                    |
| ------------------ | ------ | ---------------------------------------------- |
| `/health`          | GET    | Get system status and version info             |
| `/health/detailed` | GET    | Get detailed health status (memory, CPU, etc.) |
| `/health/metrics`  | GET    | Get performance metrics                        |

### MCP Proxy Endpoints

All MCP-related endpoints are prefixed with `/api/v1/webmcp`:

| Endpoint                  | Method | Description                  |
| ------------------------- | ------ | ---------------------------- |
| `/api/v1/webmcp/ping`     | GET    | Connection test              |
| `/api/v1/webmcp/sse`      | GET    | SSE connection endpoint      |
| `/api/v1/webmcp/messages` | POST   | Message forwarding endpoint  |
| `/api/v1/webmcp/mcp`      | ALL    | Streamable HTTP MCP endpoint |
| `/api/v1/webmcp/list`     | GET    | Get all client sessions      |
| `/api/v1/webmcp/remoter`  | GET    | Get all controller sessions  |
| `/api/v1/webmcp/tools`    | GET    | Get client tool list         |
| `/api/v1/webmcp/client`   | GET    | Query single client info     |
| `/api/v1/webmcp/reset`    | GET    | Reset all connections        |

### Debugging with MCP Inspector

You can use the MCP Inspector tool to connect for debugging:

```
# SSE Mode
http://localhost:3000/api/v1/webmcp/sse?sessionId=<your-session-id>

# Streamable HTTP Mode
http://localhost:3000/api/v1/webmcp/mcp?sessionId=<your-session-id>
```

## Deployment Guide

### Development Environment

```bash
# Use nodemon for hot reload
pnpm dev
```

### Production Environment

#### Using PM2 (Recommended)

```bash
# Start
pnpm pm2:start

# Check status
pm2 status

# View logs
pnpm pm2:logs

# Stop
pnpm pm2:stop

# Restart
pnpm pm2:restart

# Delete
pnpm pm2:delete
```

#### Using Docker

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY dist ./dist

ENV NODE_ENV=production
ENV AGENT_PORT=3000
ENV AGENT_HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

Note: This Dockerfile expects `dist` to be built locally before `docker build` (run `pnpm build` first).
If your repo does not include `pnpm-lock.yaml`, remove the `COPY pnpm-lock.yaml ./` line and the `--frozen-lockfile` flag.

### Nginx Reverse Proxy Configuration Example

```nginx
upstream webagent {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://webagent;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE Support
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

## Configuration

### PM2 Configuration

The project provides an `ecosystem.config.cjs` configuration file:

- Single instance Fork mode
- Auto-restart when memory exceeds 1GB
- Automatic log file management
- Graceful shutdown support

## Development Guide

### Script Commands

```bash
pnpm dev          # Run in development mode
pnpm build        # Build production version
pnpm start        # Run production version
pnpm lint         # Code linting
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format code
pnpm format:check # Check formatting
```

### Code Standards

- ESLint + Prettier for code standards
- TypeScript strict mode
- Follow Express.js best practices

## Contributing

Please use the dedicated contribution guide:

- English: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 中文: [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md)

## Related Links

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [OpenTiny Official Website](https://opentiny.design/)
