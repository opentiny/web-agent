# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
并遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.2.0](https://github.com/opentiny/web-agent/compare/v1.1.0...v1.2.0) (2026-02-13)


### Features

* initialize web-agent ([96b8589](https://github.com/opentiny/web-agent/commit/96b8589bc21f241096c9f08b5db451469fe9eb7c))


### Bug Fixes

* add default pr model ([375c559](https://github.com/opentiny/web-agent/commit/375c559082feaf5b908fdaeb4effcb6971fdd027))
* add default pr template ([cab8027](https://github.com/opentiny/web-agent/commit/cab8027dc7e07b4d5074b059ca50e8458c237071))
* **github:** move default pr template to root .github dir ([#6](https://github.com/opentiny/web-agent/issues/6)) ([c2015cb](https://github.com/opentiny/web-agent/commit/c2015cb4ce3b75bed33d363dab8c6f4b94129a91))
* remove releaseCompPrefix ([#7](https://github.com/opentiny/web-agent/issues/7)) ([f4a18de](https://github.com/opentiny/web-agent/commit/f4a18de68df86e107cf6751b1ba2060e3588de08))

## [1.1.0](https://github.com/opentiny/web-agent/compare/web-agent-v1.0.0...web-agent-v1.1.0) (2026-02-13)

### Features

- initialize web-agent ([96b8589](https://github.com/opentiny/web-agent/commit/96b8589bc21f241096c9f08b5db451469fe9eb7c))

## [未发布]

### 新增

- 引入 `release-please` 自动发版能力，用于版本管理、变更日志更新、GitHub Release 与 `vX.Y.Z` Tag 创建。

## [1.0.0] - 2026-02-13

### 新增

- `web-agent` 初始版本发布。
- 提供健康检查与 WebMCP 集成相关的核心 API 路由和中间件能力。
- 提供 TypeScript 构建、Lint 与格式化工具链。
- 提供贡献流程模板与 PR/Push CI 检查能力。
