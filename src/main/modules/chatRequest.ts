/**
 * 聊天请求处理模块
 * 负责接收来自 renderer 的聊天请求，调用对应提供商的 API，并将流式响应发送回 renderer
 * 设计目标是兼容不同提供商的 API 差异，同时保持代码清晰易维护
 * 目前支持 OpenAI、Google Gemini 和 Ollama，未来可扩展更多提供商
 */

import { BrowserWindow } from 'electron'
import { allProviders } from '../../../plugins/providers/providers'
import type { ChatParams, Provider } from '../../../plugins/providers/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  providerId: string
  modelId: string
  apiKey: string
  messages: ChatMessage[]
  params?: ChatParams
}

// 辅助函数：根据 providerId 获取提供商配置
function getProviderConfig(providerId: string): Provider {
  const provider = allProviders.find(p => p.id === providerId)
  if (!provider) throw new Error(`Unknown provider: ${providerId}`)
  return provider
}

// 构建请求头，根据提供商的认证方式
function buildHeaders(provider: Provider, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

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
  userParams?: ChatParams
): Record<string, any> {
  // 三层合并：Provider默认 → 全局 → 源参数
  const mergedParams = {
    ...provider.defaultParams,
    ...userParams
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
  } else if (provider.id === 'ollama') {
    body.model = modelId
    body.stream = true
  } else {
    body.model = modelId
    body.stream = true
  }

  return body
}

// 解析流式响应中的数据，兼容 OpenAI 和 Ollama 的不同格式
function buildUrl(provider: Provider, modelId: string, apiKey: string): string {
  let url = `${provider.baseUrl}${provider.chatEndpoint || '/chat/completions'}`

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

export async function chatRequestStream(
  win: BrowserWindow,
  req: ChatRequest
): Promise<void> {
  const provider = getProviderConfig(req.providerId)
  const url = buildUrl(provider, req.modelId, req.apiKey)
  const headers = buildHeaders(provider, req.apiKey)
  const body = buildBody(provider, req.modelId, req.messages)

  currentAbortController = new AbortController()

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

  const parseChunk = provider.streamFormat === 'ollama' ? parseOllamaChunk : parseOpenAIChunk

  try {
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
