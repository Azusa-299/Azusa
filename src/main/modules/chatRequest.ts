/**
 * 聊天请求处理模块
 * 负责接收来自 renderer 的聊天请求，调用对应提供商的 API，并将流式响应发送回 renderer
 * 设计目标是兼容不同提供商的 API 差异，同时保持代码清晰易维护
 * 目前支持 OpenAI、Google Gemini 和 Ollama，未来可扩展更多提供商
 */

import { BrowserWindow } from 'electron'
import { readConfig } from './config'
import { allProviders } from '../../../plugins/providers/providers'
import type { ChatParams, Provider } from '../../../plugins/providers/types'


interface SourceConfig {
  id: string
  provider: string
  key: string[]
  api_base: string
  custom_headers: Record<string, string>
  enable: boolean
}


function getSourceAndProvider(sourceId: string) {
  const config = readConfig()
  const source: SourceConfig = config.provider_sources?.[sourceId]
  if (!source) throw new Error(`Unknown source: ${sourceId}`)

  const providerMeta = allProviders.find(p => p.id === source.provider)
  if (!providerMeta) throw new Error(`Unknown provider type: ${source.provider}`)

  return { source, providerMeta }
}


export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}


export interface ChatRequest {
  sourceId: string     // "my-openai" — 对应 provider_sources 的 key
  modelId: string      // "gpt-4" — 纯模型名
  messages: ChatMessage[]
  params?: ChatParams
}


// 构建请求头，根据提供商的认证方式
function buildHeaders(provider: Provider, source: SourceConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // 合并 custom_headers
  Object.assign(headers, source.custom_headers || {})

  const apiKey = source.key?.[0] || ''
  switch (provider.authType) {
    case 'bearer':
      headers['Authorization'] = `Bearer ${apiKey}`
      break
    case 'apikey-query':
      // Google: API key goes in URL, not header
      break
    case 'none':
    default:
      break
  }
  return headers
}


// 构建请求体，根据提供商的要求调整字段
function buildBody(
  provider: Provider,
  modelId: string,
  messages: ChatMessage[],
  userParams?: ChatParams,
  extraBody?: Record<string, any>
): Record<string, any> {
  const mergedParams = {
    ...userParams,
    ...extraBody
  }

  const body: Record<string, any> = {
    messages,
    model: modelId,
    stream: true,
    ...mergedParams
  }

  // 特殊处理：Google Gemini 不支持 stream: true
  // Ollama 不支持 stream: true
  if (provider.id === 'google') {
    body.model = modelId
    body.key = undefined // Google 用 query param
  }

  return body
}


// 构建请求 URL，根据源配置和提供商要求
function buildUrl(source: SourceConfig, provider: Provider, apiKey: string): string {
  const base = (source.api_base || provider.baseUrl).replace(/\/+$/, '')// 移除末尾斜杠
  let url = `${base}${provider.chatEndpoint || '/chat/completions'}`// 合并基础 URL和路径

  if (provider.id === 'google') {
    url += `?key=${apiKey}`
  }
  return url
}


// 解析 Ollama 的流式响应格式
function parseOllamaChunk(line: string): string | null {
  if (!line.trim()) return null
  try {
    const json = JSON.parse(line)
    return json.message?.content || null
  } catch {
    return null
  }
}


// 解析 OpenAI 的流式响应格式
function parseOpenAIChunk(line: string): string | null {
  // OpenAI SSE 格式: data: {"choices":[{"delta":{"content":"xxx"}}]}
  if (!line.startsWith('data: ')) return null
  const data = line.slice(6)
  if (data === '[DONE]') return null
  try {
    const json = JSON.parse(data)
    return json.choices?.[0]?.delta?.content || null
  } catch {
    return null
  }
}


// 当前流式请求的 AbortController 和 Reader
let currentAbortController: AbortController | null = null
let currentReader: ReadableStreamDefaultReader | null = null


// 已知字段，不属于请求体的配置字段
const KNOWN_FIELDS = new Set([
  'id', 'enable', 'provider_source_id', 'model',
  'modalities', 'custom_extra_body', 'max_context_tokens'
])


// 获取模型的自定义请求体参数（顶层未知字段 + custom_extra_body）
function getModelExtraBody(sourceId: string, modelId: string): Record<string, any> {
  const config = readConfig()
  const modelConfig = (config.provider || []).find(
    (m: any) => m.provider_source_id === sourceId && m.model === modelId
  )
  if (!modelConfig) return {}

  // 收集顶层未知字段（如 think、temperature 等用户直接写在模型配置上的）
  const extra: Record<string, any> = {}
  for (const [key, value] of Object.entries(modelConfig)) {
    if (!KNOWN_FIELDS.has(key)) {
      extra[key] = value
    }
  }
  // custom_extra_body 优先级更高，覆盖同名顶层字段
  return { ...extra, ...modelConfig.custom_extra_body }
}


export async function chatRequestStream(
  win: BrowserWindow,
  req: ChatRequest
): Promise<void> {
  const { source, providerMeta } = getSourceAndProvider(req.sourceId)
  // 检查源是否已启用
  if (!source.enable) {
    win.webContents.send('chat:stream:error', `源 ${req.sourceId} 已禁用`)
    return
  }
  const url = buildUrl(source, providerMeta, source.key?.[0] || '')
  const headers = buildHeaders(providerMeta, source)
  const extraBody = getModelExtraBody(req.sourceId, req.modelId)
  const body = buildBody(providerMeta, req.modelId, req.messages, req.params, extraBody)

  currentAbortController = new AbortController()

  // 发送请求并处理流式响应
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: currentAbortController.signal
    })

    if (!res.ok) {
      currentAbortController = null
      win.webContents.send('chat:stream:error', `请求失败: ${res.status}`)
      return
    }

    currentReader = res.body?.getReader() || null
    const decoder = new TextDecoder()
    let buffer = ''

    const parseChunk = providerMeta.streamFormat === 'ollama' ? parseOllamaChunk : parseOpenAIChunk

    while (currentReader) {
      // 检查是否已中断
      if (currentAbortController?.signal.aborted) break

      const { done, value } = await currentReader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const chunk = parseChunk(line)
        if (chunk) {
          win.webContents.send('chat:stream:chunk', chunk)
        }
      }
    }
    win.webContents.send('chat:stream:end')
  } catch (err: any) {
    if (err.name === 'AbortError') {
      win.webContents.send('chat:stream:end')
    } else {
      win.webContents.send('chat:stream:error', `流式读取失败: ${err.message}`)
    }
  } finally {
    currentAbortController = null
    currentReader = null
  }
}


// 中断当前流式请求
export function abortChatStream(): void {
  if (currentAbortController) {
    currentAbortController.abort()
  }
  if (currentReader) {
    currentReader.cancel().catch(() => {})
    currentReader = null
  }
}
