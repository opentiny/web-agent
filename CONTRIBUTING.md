# Contributing to WebAgent

中文版本请见: [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md)

Thanks for your interest in contributing to WebAgent. Contributions of all sizes are welcome.

## Ways to contribute

- Report bugs
- Propose new features
- Improve documentation
- Submit code fixes or refactors
- Help review pull requests

## Before you start

- Search existing issues first to avoid duplicates.
- Use issue templates to provide complete, actionable information.
- For large changes (API/protocol/architecture), open a feature request first and align on scope before coding.

Issue templates:

- Bug report (EN): <https://github.com/opentiny/web-agent/issues/new?template=bug_report_en.yml>
- Feature request (EN): <https://github.com/opentiny/web-agent/issues/new?template=feature_request_en.yml>
- Bug report (中文): <https://github.com/opentiny/web-agent/issues/new?template=bug_report_zh.yml>
- Feature request (中文): <https://github.com/opentiny/web-agent/issues/new?template=feature_request_zh.yml>

## Development prerequisites

- Node.js `>=22`
- pnpm `>=10`
- Git

## Local setup

```bash
# 1) Fork the repository on GitHub
# 2) Clone your fork
git clone git@github.com:<your-username>/web-agent.git
cd web-agent

# 3) Add upstream
git remote add upstream git@github.com:opentiny/web-agent.git

# 4) Install dependencies
pnpm install

# 5) Run in development mode
pnpm dev
```

## Git hooks (Husky + lint-staged)

- A `pre-commit` hook runs automatically after `pnpm install`.
- The hook runs `pnpm lint-staged` and checks only staged files.
- If hooks are missing locally, run:

```bash
pnpm prepare
```

- To skip hooks for one commit only, use `git commit --no-verify`.
- To disable Husky temporarily in the current shell, use `HUSKY=0`.

## Branch and commit conventions

Create a focused branch for each change. Recommended naming:

- `<username>/feat-<short-desc>`
- `<username>/fix-<short-desc>`
- `<username>/docs-<short-desc>`

Use clear commit messages. Conventional Commits format is recommended:

```text
<type>(optional-scope): <summary>
```

Examples:

- `feat(webmcp): add timeout for stream forwarding`
- `fix(middleware): handle missing request id`
- `docs(readme): clarify local startup steps`

## Coding standards

- TypeScript strict mode
- ESLint + Prettier
- Follow current project architecture and style in `src/`
- Keep changes minimal and focused; avoid unrelated refactors

Commonly affected modules:

- `src/routes/*`
- `src/middleware/*`
- `src/config/*`
- `src/app.ts`, `src/server.ts`

## Quality checks before PR

Run these checks locally before opening a PR:

```bash
pnpm lint
pnpm format:check
pnpm build
```

Note: `pnpm test` is currently a placeholder script. If your change needs extra validation, include manual verification steps in the PR description.

## Submit a pull request

1. Push your branch to your fork.
2. Open a PR against `opentiny/web-agent`.
3. Fill in the PR template, including what changed and why, related issue (`Closes #123` when applicable), verification steps/outputs, and risk/rollback notes for non-trivial changes.
4. Respond to review comments and push follow-up commits to the same branch.

PR templates:

- English template: <https://github.com/opentiny/web-agent/compare?expand=1&template=pull_request_en.md>
- 中文模板: <https://github.com/opentiny/web-agent/compare?expand=1&template=pull_request_zh.md>

## Security issues

Please do not disclose security vulnerabilities in public issues with exploit details.
Use GitHub private vulnerability reporting (Security Advisories) when available.

## License

By contributing, you agree that your contributions are licensed under the repository license ([MIT](./LICENSE)).

## Join the Open Source Community

If you are interested in our open source project, you are welcome to join our open source community through the following ways.

- Add the official assistant WeChat: opentiny-official, join our technical exchange group
- Join the mailing list: opentiny@googlegroups.com
