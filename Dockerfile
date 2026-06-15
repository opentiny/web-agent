# ============ Stage 1: Build ============
FROM node:22-alpine AS builder

WORKDIR /app

# 启用 corepack 以使用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 先拷贝依赖描述文件，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml* ./

# 安装所有依赖（包括 devDependencies，因为需要 tsc 编译）
# 注：pnpm-lock.yaml 不在仓库中（被 .gitignore 排除），因此不使用 --frozen-lockfile
RUN pnpm install --ignore-scripts

# 拷贝源码和 TS 配置
COPY src/ ./src/
COPY tsconfig.json tsconfig.app.json ./

# 编译 TypeScript
RUN pnpm build

# ============ Stage 2: Production ============
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# 仅拷贝生产依赖描述
COPY package.json pnpm-lock.yaml* ./

# 只安装生产依赖
RUN pnpm install --prod --ignore-scripts

# 从 build 阶段拷贝编译产物
COPY --from=builder /app/dist ./dist

# 使用非 root 用户
USER node

# 默认环境变量
ENV NODE_ENV=production
ENV AGENT_PORT=3000
ENV AGENT_HOST=0.0.0.0

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
