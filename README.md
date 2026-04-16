# Azusa

> 一个基于 Electron + Vue 3 的跨平台 AI 聊天客户端，支持多模型提供商、流式输出、可扩展架构。

[![Electron](https://img.shields.io/badge/Electron-22+-blue?logo=electron)](https://electronjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

***

## 功能特性

### 已实现

- **流式输出** — 实时显示 AI 回复，支持打字机效果与停止按钮
- **多模型支持** — OpenAI、DeepSeek、Zhipu、Moonshot、Ollama、Google Gemini 等
- **多会话管理** — 侧边栏会话列表，支持新建/切换/删除/自动命名
- **现代化 UI** — Naive UI 组件库，暗色/亮色主题适配
- **灵活配置** — 每个提供商独立配置 API Key、Base URL、启用模型
- **本地优先** — 所有供应商数据本地存储（暂未加密API Key）

***

## 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 8

### 安装依赖

```bash
$ pnpm install
```

### 开发运行

```bash
$ pnpm dev
```

### 构建打包

```bash
# Windows
$ pnpm build:win

# macOS
$ pnpm build:mac

# Linux
$ pnpm build:linux
```

***

## 🔌 支持的模型提供商

| 提供商              | 认证方式            | 流式格式          | 状态 |
| ---------------- | --------------- | ------------- | -- |
| OpenAI           | Bearer Token    | OpenAI SSE    | ✅  |
| DeepSeek         | Bearer Token    | OpenAI SSE    | ✅  |
| Zhipu AI         | Bearer Token    | OpenAI SSE    | ✅  |
| Moonshot         | Bearer Token    | OpenAI SSE    | ✅  |
| Google Gemini    | API Key (Query) | OpenAI SSE    | ✅  |
| Ollama           | 无认证             | Ollama Stream | ✅  |
| Anthropic Claude | Bearer Token    | OpenAI SSE    | 🚧 |

***

## 路线图 Roadmap

### 近期计划（v0.2.x）

- [ ] **对话记忆存储** — 持久化对话历史，支持导入/导出
  - SQLite 本地数据库或 JSON 文件存储
  - 会话级元数据（创建时间、模型、token 消耗统计）
  - 搜索历史会话
  - 导出为 Markdown / JSON / PDF

- [ ] **系统提示词** — 持久化系统提示词，支持导入/导出

### 中期目标（v0.3.x - v0.5.x）

- [ ] **RAG 知识库** — 本地文档检索增强生成
  - 支持 PDF、Word、TXT、Markdown 等格式导入
  - 向量数据库（如 LanceDB、Chroma）
  - 分块策略与嵌入模型配置
  - 知识库与对话关联
- [ ] **Agent 框架** — 工具调用与自主任务执行
  - Function Calling 支持
  - 内置工具：网页搜索、代码执行、文件操作
  - 自定义工具注册（通过 JSON Schema）
  - 多 Agent 协作模式
- [ ] **语音识别与合成** — 语音交互能力
  - Whisper 本地语音识别（支持实时/文件）
  - TTS 语音合成（支持多种音色）
  - 语音消息录制与播放
- [ ] **机器视觉** — 图像理解与生成
  - 图片上传与多模态对话（GPT-4V、Gemini Pro Vision）
  - 图像生成集成（DALL-E、Stable Diffusion）
  - 识别电脑桌面

### 远期愿景（v1.0+）

- [ ] **Live2D 虚拟形象** — 可交互的桌面虚拟助手
  - Live2D 模型渲染与动画
  - 口型同步（Lip Sync）与语音合成联动
  - 触屏/鼠标交互响应
  - 控制动作与表情
- [ ] **视线追踪** — 基于摄像头的注意力感知
  - 用户视线方向检测
  - 虚拟形象眼神跟随
  - 注意力分散提醒
- [ ] **MCP 协议支持** — Model Context Protocol 生态接入
  - 与 Claude Desktop 等 MCP 客户端兼容
  - 工具市场与一键安装
- [ ] **插件系统** — 第三方扩展生态
  - JavaScript/TypeScript 插件 API
  - UI 组件扩展（自定义面板、工具栏）
  - 主题市场

***

## 配置说明

### 提供商配置

配置文件位于 `src/plugins/providers/providers/`，每个提供商一个文件：

```typescript
// 示例：自定义提供商
export const myProvider: Provider = {
  id: 'my-provider',
  name: 'My AI',
  baseUrl: 'https://api.myai.com/v1',
  chatEndpoint: '/chat/completions',
  authType: 'bearer',        // 'bearer' | 'apikey-query' | 'none'
  streamFormat: 'openai',    // 'openai' | 'ollama'
  models: ['model-1', 'model-2']
}
```

### 请求体配置（即将支持）

未来将支持通过 JSON 文件自定义请求体：

```json
{
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 4096,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "custom_fields": {
    "safe_mode": false
  }
}
```

