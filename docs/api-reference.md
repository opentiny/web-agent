# WebAgent API Reference

## 概览

- API Prefix: `/api/v1`（来自 `config.app.apiPrefix`）
- 所有健康检查端点不带 API 前缀，直接以 `/health` 开头。
- MCP 相关端点统一以 `/api/v1/webmcp` 开头。
- 服务会返回 `X-Request-ID` 响应头，便于追踪请求。

## MCP 代理 / MCP Proxy (WebMCP)

Base Path: `/api/v1/webmcp`

### GET /api/v1/webmcp/ping

检查 MCP 代理存活并对所有会话执行 ping。无响应的会话会被清理，返回本次被清理的 sessionId 列表。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema（本次被清理的会话）**

```json
{
  "clientSessions": ["string"],
  "remoterSessions": ["string"]
}
```

**响应示例**

```json
{
  "clientSessions": ["sse_1700000000000_abcd12345"],
  "remoterSessions": []
}
```

**错误响应**

| 状态码 | 错误码            | 描述                    |
| ------ | ----------------- | ----------------------- |
| 500    | Ping check failed | Ping 失败 / Ping failed |

**错误示例**

```json
{
  "error": "Ping check failed",
  "message": "Unknown error",
  "responseTime": "12ms",
  "timestamp": "2026-02-05T10:00:00.000Z"
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/ping');
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/sse

与代理中枢建立 SSE 连接，用于被遥控，或者是遥控其他客户端。

**请求**

**请求头**

| 名称             | 类型   | 必填 | 描述                                      |
| ---------------- | ------ | ---- | ----------------------------------------- |
| `Accept`         | string | 否   | `text/event-stream`                       |
| `sse-session-id` | string | 否   | 提前生成的 session-id，用于标识自身客户端 |

**路径参数**

无

**查询参数**

| 名称        | 类型   | 必填 | 描述                                    |
| ----------- | ------ | ---- | --------------------------------------- |
| `sessionId` | string | 否   | 需要遥控的目标客户端会话 ID（被控端）。 |

**请求体**

无

**响应**

| 状态码 | 描述                                  |
| ------ | ------------------------------------- |
| 200    | SSE 连接建立 / SSE stream established |

**响应 Schema**

该端点为 SSE 流式响应，内容为 MCP 消息事件流。Response is an SSE stream, payload depends on MCP events.

**备注**

- SSE 连接建立后会生成一个 SSE 会话 ID（@opentiny/next-sdk 会自动处理）。若需要复用该 SSE 会话，可在请求头 `sse-session-id` 中传入该 ID 进行标识。
- 当需要遥控已建立连接的被控端时：查询参数 `sessionId` 增加被控端客户端会话，智能代理中枢即可转发消息到指定的被控端，实现遥控功能。

**响应示例**

```text
event: message
data: {"jsonrpc":"2.0","method":"notifications/initialized","params":{}}
```

**错误响应**

| 状态码 | 错误码                          | 描述                   |
| ------ | ------------------------------- | ---------------------- |
| 400    | No client found for session ID  | 未找到目标会话         |
| 500    | SSE Inspector connection failed | Inspector 模式连接失败 |
| 500    | SSE Proxy connection failed     | Proxy 模式连接失败     |
| 500    | SSE connection failed           | SSE 连接失败           |

**错误示例**

```json
{
  "error": "SSE connection failed",
  "connectionId": "sse_1700000000000_abcd12345",
  "duration": "45ms",
  "message": "Unknown error",
  "timestamp": "2026-02-05T10:00:00.000Z"
}
```

**JavaScript 示例**

```js
const es = new EventSource('http://localhost:3000/api/v1/webmcp/sse');
es.onmessage = (evt) => {
  console.log('SSE event:', evt.data);
};
```

### POST /api/v1/webmcp/messages

向指定会话转发 MCP 消息（SSE 消息通道）。

**请求**

**请求头 Headers**

| 名称           | 类型   | 必填 | 描述               |
| -------------- | ------ | ---- | ------------------ |
| `Content-Type` | string | 否   | `application/json` |

**路径参数 Params**

无

**查询参数 Query Params**

| 名称        | 类型   | 必填 | 描述                  |
| ----------- | ------ | ---- | --------------------- |
| `sessionId` | string | 是   | SSE 会话 ID（被控端） |

**请求体 Schema / Body Schema**

```json
{
  "jsonrpc": "2.0",
  "id": "string | number | null",
  "method": "string",
  "params": "object"
}
```

**响应 / Response**

| 状态码 | 描述                           |
| ------ | ------------------------------ |
| 200    | 成功 / OK（由 MCP 处理器返回） |

**响应 Schema / Response Schema**

响应体由 MCP 处理器决定，通常为 JSON-RPC 响应或流式输出。

**备注**

- 未提供或无效 `sessionId` 时，服务端会返回 `400 No transport found`。
- 若设置了 `Content-Type`，必须为 `application/json`、`multipart/form-data` 或 `application/x-www-form-urlencoded`，否则会被中间件拦截为 415。

**响应示例 / Example**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "ok": true
  }
}
```

**错误响应 / Errors**

| 状态码 | 错误码                 | 描述                 |
| ------ | ---------------------- | -------------------- |
| 400    | No transport found     | 无效或缺失 sessionId |
| 415    | UNSUPPORTED_MEDIA_TYPE | Content-Type 不支持  |
| 404    | SESSION_ERROR          | 会话不存在或已断开   |
| 503    | TRANSPORT_ERROR        | 传输连接错误         |
| 408    | TIMEOUT_ERROR          | 消息处理超时         |
| 403    | PERMISSION_ERROR       | 权限不足             |
| 500    | MESSAGE_ERROR          | 其他消息处理错误     |

**错误示例 / Error Example**

```json
{
  "error": "SESSION_ERROR",
  "message": "会话未找到或已断开",
  "messageId": "msg_1700000000000_abcd12345",
  "duration": "18ms",
  "timestamp": "2026-02-05T10:00:00.000Z"
}
```

**415 错误示例 / 415 Example**

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/messages?sessionId=your_session_id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: {} }),
});
const data = await res.json();
console.log(data);
```

### ALL /api/v1/webmcp/mcp

MCP 协议处理端点。

**请求**

支持方法 / Methods: `GET`, `POST`, `DELETE`, `OPTIONS`

**请求头 / Headers**

| 名称                | 类型   | 必填 | 描述                                                  |
| ------------------- | ------ | ---- | ----------------------------------------------------- |
| `Accept`            | string | 否   | `text/event-stream`（GET 长连接 / for GET streaming） |
| `Content-Type`      | string | 否   | `application/json`（POST 请求 / for POST）            |
| `mcp-session-id`    | string | 否   | 已存在的 MCP 会话 ID（GET/DELETE 必填）               |
| `stream-session-id` | string | 否   | 用于连接时指定代理中枢生成的 mcp-session-id           |

**路径参数 / Path Params**

无

**查询参数 / Query Params**

| 名称        | 类型   | 必填 | 描述                                         |
| ----------- | ------ | ---- | -------------------------------------------- |
| `sessionId` | string | 否   | 被遥控的客户端 sessionId（被控端 sessionId） |

**请求体 Schema / Body Schema（POST）**

```json
{
  "jsonrpc": "2.0",
  "id": "string | number | null",
  "method": "string",
  "params": "object"
}
```

**响应 / Response**

| 状态码 | 描述                             |
| ------ | -------------------------------- |
| 200    | 成功 / OK（JSON-RPC 或流式响应） |

**响应 Schema / Response Schema**

- GET: `text/event-stream`（SSE 流式事件）
- POST: JSON-RPC 响应对象

**备注**

- 遥控端控制被控端：通过查询参数 `sessionId` 指定被控端会话。
- 服务端在响应中附带 MCP 追踪头：`X-MCP-Request-ID`、`X-MCP-Method`、`X-Processing-Start`。

**JSON-RPC 响应示例 / JSON-RPC Example**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "capabilities": {}
  }
}
```

**错误响应 / Errors**

| 状态码 | 错误码                        | 描述                                         |
| ------ | ----------------------------- | -------------------------------------------- |
| 400    | Invalid or missing session ID | GET/DELETE 缺失或无效 sessionId              |
| 400    | -32600                        | Bad Request: No valid session ID provided    |
| 405    | -32000                        | Method not allowed                           |
| 415    | UNSUPPORTED_MEDIA_TYPE        | Content-Type 不支持                          |
| 500    | -32603                        | MCP 内部错误 / Internal MCP processing error |

**错误示例 / Error Example**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal MCP processing error",
    "data": {
      "requestId": "mcp_1700000000000_abcd12345",
      "error": "Unknown error",
      "timestamp": "2026-02-05T10:00:00.000Z"
    }
  }
}
```

**415 错误示例 / 415 Example**

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
});
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/list

列出所有客户端会话。

**请求 / Request**

**请求头 / Headers**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应 / Response**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema / Response Schema**

```json
{
  "<sessionId>": {
    "user": "object | string | null",
    "device": {
      "ip": "string | string[]",
      "userAgent": "string",
      "acceptLanguage": "string",
      "referer": "string"
    },
    "type": "SSE | StreamableHTTP | WebSocket"
  }
}
```

**备注**

- `device` 字段来自请求头：`x-forwarded-for`、`user-agent`、`accept-language`、`referer`。
- `user` 由上游鉴权中间件注入（如果未启用鉴权可能为空）。

**响应示例 / Example**

```json
{
  "sse_1700000000000_abcd12345": {
    "user": "anonymous",
    "device": {
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0",
      "acceptLanguage": "en-US",
      "referer": "http://localhost:3000"
    },
    "type": "SSE"
  }
}
```

**错误响应 / Errors**

| 状态码 | 错误码                | 描述                                                    |
| ------ | --------------------- | ------------------------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | 未知服务器错误 / Internal error (from error middleware) |

**错误示例 / Error Example**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "b7b3c9d0-0c1a-4b1a-a01f-5f8b1f1f4a7e",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/list');
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/remoter

列出所有操控端会话。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应 / Response**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema / Response Schema**

```json
{
  "<sessionId>": {
    "user": "object | string | null",
    "client": "string",
    "device": {
      "ip": "string | string[]",
      "userAgent": "string",
      "acceptLanguage": "string",
      "referer": "string"
    },
    "type": "SSE | StreamableHTTP"
  }
}
```

**备注**

- `client` 为操控端 sessionId。
- `device` 与 `user` 的来源同 `/api/v1/webmcp/list`。

**响应示例 / Example**

```json
{
  "sse_1700000000000_remoter": {
    "user": "anonymous",
    "client": "sse_1700000000000_abcd12345",
    "device": {
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0",
      "acceptLanguage": "en-US",
      "referer": "http://localhost:3000"
    },
    "type": "SSE"
  }
}
```

**错误响应 / Errors**

| 状态码 | 错误码                | 描述                                                    |
| ------ | --------------------- | ------------------------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | 未知服务器错误 / Internal error (from error middleware) |

**错误示例 / Error Example**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "b7b3c9d0-0c1a-4b1a-a01f-5f8b1f1f4a7e",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/remoter');
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/reset

重置所有客户端与操控端会话。Reset all client and remoter sessions.

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应 / Response**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema / Response Schema**

```json
{}
```

**响应示例**

```json
{}
```

**错误响应 / Errors**

| 状态码 | 错误码                | 描述                                                    |
| ------ | --------------------- | ------------------------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | 未知服务器错误 / Internal error (from error middleware) |

**错误示例**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "b7b3c9d0-0c1a-4b1a-a01f-5f8b1f1f4a7e",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/reset');
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/tools

列出指定会话可用的 MCP 工具。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 请求体**

无

**查询参数(Query Params)**

| 名称        | 类型   | 必填 | 描述          |
| ----------- | ------ | ---- | ------------- |
| `sessionId` | string | 是   | 客户端会话 ID |

**响应 / Response**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema / Response Schema**

```json
{
  "result": "object | string"
}
```

**备注**

- 若 `sessionId` 无效，返回 `{ "result": "No client found for session ID ..." }`，仍为 200。

**响应示例 / Example**

```json
{
  "result": [
    {
      "name": "example.tool",
      "description": "Example tool",
      "inputSchema": {}
    }
  ]
}
```

**错误响应 / Errors**

| 状态码 | 错误码                             | 描述                           |
| ------ | ---------------------------------- | ------------------------------ |
| 200    | No client found for session ID ... | sessionId 无效，返回提示字符串 |

**错误示例 / Error Example**

```json
{
  "result": "No client found for session ID abcdef"
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/tools?sessionId=your_session_id');
const data = await res.json();
console.log(data);
```

### GET /api/v1/webmcp/client

查询单个客户端会话信息，支持 sessionId 后 6 位匹配。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 请求体**

无

**查询参数(Query Params)**

| 名称        | 类型   | 必填 | 描述                    |
| ----------- | ------ | ---- | ----------------------- |
| `sessionId` | string | 是   | 客户端会话 ID 或后 6 位 |

**响应 / Response**

| 状态码 | 描述                            |
| ------ | ------------------------------- |
| 200    | 成功 / OK（即使错误也返回 200） |

**备注**

- 当 `sessionId` 仅提供 6 位时，会尝试匹配所有已连接 sessionId 的后缀。

**响应 Schema**

成功时：

```json
{
  "status": 0,
  "data": {
    "sessionId": "string",
    "user": "object | string | null",
    "device": {
      "ip": "string | string[]",
      "userAgent": "string",
      "acceptLanguage": "string",
      "referer": "string"
    },
    "type": "SSE | StreamableHTTP | WebSocket"
  }
}
```

错误时（仍返回 200）：

```json
{
  "status": 400,
  "error": "MISSING_SESSION_ID",
  "message": "sessionId is required"
}
```

**错误响应**

| 状态码 | 错误码             | 描述             |
| ------ | ------------------ | ---------------- |
| 200    | MISSING_SESSION_ID | 未提供 sessionId |
| 200    | SESSION_NOT_FOUND  | 未找到会话       |
| 200    | INTERNAL_ERROR     | 服务器内部错误   |

**JavaScript示例**

```js
const res = await fetch('http://localhost:3000/api/v1/webmcp/client?sessionId=your_session_id');
const data = await res.json();
console.log(data);
```

## 通用错误响应

以下为全局或中间件可能返回的错误格式，具体端点也可能返回自定义错误结构（见各端点）。

### 通用错误结构

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "b7b3c9d0-0c1a-4b1a-a01f-5f8b1f1f4a7e",
    "timestamp": "2026-02-05T10:00:00.000Z",
    "stack": "..."
  }
}
```

### 415 Unsupported Media Type

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE",
    "message": "Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded"
  }
}
```

### 404 Route Not Found

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route GET /unknown not found",
    "path": "/unknown",
    "method": "GET"
  }
}
```

## 健康检查

### GET /health

获取服务基础信息与可用端点列表。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema**

```json
{
  "success": true,
  "data": {
    "name": "string",
    "version": "string",
    "status": "string",
    "uptime": "number",
    "environment": "string",
    "nodeVersion": "string",
    "platform": "string",
    "arch": "string",
    "timestamp": "string",
    "endpoints": {
      "health": "string",
      "sessions": "string",
      "remoters": "string",
      "tools": "string",
      "sse": "string",
      "messages": "string",
      "mcp": "string",
      "metrics": "string"
    }
  }
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "name": "@opentiny/NEXT-web-agent",
    "version": "1.0.0",
    "status": "running",
    "uptime": 3600.12,
    "environment": "development",
    "nodeVersion": "v22.12.0",
    "platform": "darwin",
    "arch": "arm64",
    "timestamp": "2026-02-05T10:00:00.000Z",
    "endpoints": {
      "health": "/health",
      "sessions": "/api/v1/webmcp/list",
      "remoters": "/api/v1/webmcp/remoter",
      "tools": "/api/v1/webmcp/tools",
      "sse": "/api/v1/webmcp/sse",
      "messages": "/api/v1/webmcp/messages",
      "mcp": "/api/v1/webmcp/mcp",
      "metrics": "/health/metrics"
    }
  }
}
```

**错误响应**

| 状态码 | 错误码            | 描述                                             |
| ------ | ----------------- | ------------------------------------------------ |
| 500    | SYSTEM_INFO_ERROR | 获取系统信息失败 / Failed to collect system info |

**错误示例**

```json
{
  "success": false,
  "error": {
    "code": "SYSTEM_INFO_ERROR",
    "message": "获取系统信息失败",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/health');
const data = await res.json();
console.log(data);
```

### GET /health/detailed

获取更详细的运行时指标（内存、CPU 等）。

**请求**

**请求头**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema**

```json
{
  "status": "string",
  "timestamp": "string",
  "uptime": "number",
  "version": "string",
  "environment": "string | null",
  "memory": {
    "rss": "number",
    "heapTotal": "number",
    "heapUsed": "number",
    "external": "number",
    "arrayBuffers": "number"
  },
  "cpu": {
    "user": "number",
    "system": "number"
  }
}
```

**响应示例**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T10:00:00.000Z",
  "uptime": 3600.12,
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 123456789,
    "heapTotal": 45678901,
    "heapUsed": 23456789,
    "external": 1234567,
    "arrayBuffers": 123456
  },
  "cpu": {
    "user": 123456,
    "system": 654321
  }
}
```

**错误响应**

| 状态码 | 错误码                | 描述                                                    |
| ------ | --------------------- | ------------------------------------------------------- |
| 500    | INTERNAL_SERVER_ERROR | 未知服务器错误 / Internal error (from error middleware) |

**错误示例**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "requestId": "b7b3c9d0-0c1a-4b1a-a01f-5f8b1f1f4a7e",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/health/detailed');
const data = await res.json();
console.log(data);
```

### GET /health/metrics

获取性能与监控指标（系统级指标 + 预留字段）。

**请求**

**请求头 Headers**

| 名称     | 类型   | 必填 | 描述               |
| -------- | ------ | ---- | ------------------ |
| `Accept` | string | 否   | `application/json` |

**路径参数 / 查询参数 / 请求体**

无

**响应**

| 状态码 | 描述      |
| ------ | --------- |
| 200    | 成功 / OK |

**响应 Schema**

```json
{
  "success": true,
  "data": {
    "performance": "object",
    "monitoring": "object",
    "system": {
      "process": {
        "pid": "number",
        "uptime": "number",
        "memoryUsage": "object",
        "cpuUsage": "object",
        "version": "string",
        "platform": "string",
        "arch": "string"
      },
      "node": {
        "versions": "object"
      },
      "timestamp": "string"
    },
    "collectTime": "string"
  }
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "performance": {},
    "monitoring": {},
    "system": {
      "process": {
        "pid": 12345,
        "uptime": 3600.12,
        "memoryUsage": {
          "rss": 123456789,
          "heapTotal": 45678901,
          "heapUsed": 23456789,
          "external": 1234567,
          "arrayBuffers": 123456
        },
        "cpuUsage": {
          "user": 123456,
          "system": 654321
        },
        "version": "v22.12.0",
        "platform": "darwin",
        "arch": "arm64"
      },
      "node": {
        "versions": {
          "node": "22.12.0"
        }
      },
      "timestamp": "2026-02-05T10:00:00.000Z"
    },
    "collectTime": "2026-02-05T10:00:00.000Z"
  }
}
```

**错误响应**

| 状态码 | 错误码        | 描述                                         |
| ------ | ------------- | -------------------------------------------- |
| 500    | METRICS_ERROR | 获取性能指标失败 / Failed to collect metrics |

**错误示例**

```json
{
  "success": false,
  "error": {
    "code": "METRICS_ERROR",
    "message": "获取性能指标失败",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**JavaScript 示例**

```js
const res = await fetch('http://localhost:3000/health/metrics');
const data = await res.json();
console.log(data);
```
