# WebAgent 贡献指南

English version: [CONTRIBUTING.md](./CONTRIBUTING.md)

感谢你关注并参与 WebAgent。无论是提问题、改文档，还是提交代码，都是有价值的贡献。

## 贡献方式

- 提交缺陷反馈（Bug）
- 提交功能建议（Feature）
- 完善文档与示例
- 提交代码修复或重构
- 参与 PR 评审和问题复现

## 开始之前

- 提交前先检索已有 Issue，避免重复。
- 优先使用 Issue 模板，确保信息完整、可执行。
- 对于较大改动（API、协议、架构层面），建议先提功能建议并与维护者对齐范围。

Issue 模板：

- 缺陷反馈（中文）：<https://github.com/opentiny/web-agent/issues/new?template=bug_report_zh.yml>
- 功能建议（中文）：<https://github.com/opentiny/web-agent/issues/new?template=feature_request_zh.yml>
- Bug report (EN): <https://github.com/opentiny/web-agent/issues/new?template=bug_report_en.yml>
- Feature request (EN): <https://github.com/opentiny/web-agent/issues/new?template=feature_request_en.yml>

建议标题格式（便于快速定位）：

- 缺陷：`[模块名] 缺陷简述`
- 特性：`[模块名] 新特性简述`

例如：`[webmcp] SSE 转发在弱网下会中断`

## 开发环境要求

- Node.js `>=22`
- pnpm `>=10`
- Git

## 本地开发步骤

```bash
# 1) 在 GitHub 上 Fork 仓库
# 2) 克隆你的 Fork
git clone git@github.com:<your-username>/web-agent.git
cd web-agent

# 3) 添加上游仓库
git remote add upstream git@github.com:opentiny/web-agent.git

# 4) 安装依赖
pnpm install

# 5) 启动开发模式
pnpm dev
```

## Git Hooks（Husky + lint-staged）

- 执行 `pnpm install` 后会自动启用 `pre-commit` 钩子。
- 钩子会执行 `pnpm lint-staged`，仅校验已暂存文件。
- 如果本地未正确安装钩子，可手动执行：

```bash
pnpm prepare
```

- 如需仅本次提交跳过钩子，可使用 `git commit --no-verify`。
- 如需在当前 shell 临时禁用 Husky，可设置 `HUSKY=0`。

## 分支与提交规范

建议一个变更一个分支，命名示例：

- `<username>/feat-<short-desc>`
- `<username>/fix-<short-desc>`
- `<username>/docs-<short-desc>`

建议采用 Conventional Commits：

```text
<type>(optional-scope): <summary>
```

示例：

- `feat(webmcp): add timeout for stream forwarding`
- `fix(middleware): handle missing request id`
- `docs(readme): clarify local startup steps`

## 代码与实现要求

- 遵循 TypeScript 严格模式
- 使用 ESLint + Prettier 保持一致风格
- 尽量保持改动聚焦，避免顺手做无关重构
- 若涉及行为变化，需同步更新文档

常见影响模块：

- `src/routes/*`
- `src/middleware/*`
- `src/config/*`
- `src/app.ts`, `src/server.ts`

## 提交 PR 前自检

请在本地至少完成以下检查：

```bash
pnpm lint
pnpm format:check
pnpm build
```

说明：当前 `pnpm test` 仍为占位脚本。如本次改动需要额外验证，请在 PR 中写清手工验证步骤和结果。

## 提交 PR 流程

1. 推送分支到个人仓库。
2. 向 `opentiny/web-agent` 发起 PR。
3. 按模板完整填写变更说明、关联 Issue、验证方式、风险与回滚方案。
4. 根据评审意见持续在同一分支追加提交，无需重复新建 PR。

PR 模板入口：

- 中文模板：<https://github.com/opentiny/web-agent/compare?expand=1&template=pull_request_zh.md>
- English template: <https://github.com/opentiny/web-agent/compare?expand=1&template=pull_request_en.md>

## 安全问题反馈

请勿在公开 Issue 中披露可利用的安全漏洞细节。
优先使用 GitHub 的私密漏洞报告能力（Security Advisories）进行反馈。

## 许可证

你提交的代码将按本仓库许可证进行分发（[MIT](./LICENSE)）。

## 加入开源社区

如果你对我们的开源项目感兴趣，欢迎通过以下方式加入我们的开源社区。

- 添加官方小助手微信：opentiny-official，加入我们的技术交流群
- 加入邮件列表：opentiny@googlegroups.com
