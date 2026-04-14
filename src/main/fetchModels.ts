/**
 * 模型列表获取模块
 * 负责根据提供商 ID 和 API Key 从对应的 API 获取可用模型列表
 * 目前支持 OpenAI 兼容的 API（如 OpenAI、DeepSeek、Zhipu、Moonshot、Anthropic）以及 Ollama 和 Google 的特殊处理
 * 通过 IPC 暴露 fetchModels 方法给 renderer 调用
 * 未来可以根据需要添加更多提供商的特殊处理逻辑
 * 设计时考虑了接口的统一性，fetchModels 接受 providerId、apiKey 和可选的 customBaseUrl 参数，返回模型 ID 列表
 */

import { allProviders } from '../../plugins/providers/providers'
import type { Provider } from '../../plugins/providers/types'

export async function fetchModels(
  providerId: string,
  apiKey: string,
  customBaseUrl?: string
): Promise<string[]> {
  const provider: Provider | undefined = allProviders.find(p => p.id === providerId)
  if (!provider) throw new Error(`Unknown provider: ${providerId}`)

  const baseUrl = customBaseUrl || provider.baseUrl

  // Ollama 特殊处理
  if (providerId === 'ollama') {
    const res = await fetch(`${baseUrl}/api/tags`)
    const data = await res.json()
    return data.models?.map((m: any) => m.name) ?? []
  }

  // Google 特殊处理
  if (providerId === 'google') {
    const res = await fetch(`${baseUrl}/models?key=${apiKey}`)
    const data = await res.json()
    return data.models?.map((m: any) => m.name) ?? []
  }

  // OpenAI 兼容格式（openai / deepseek / zhipu / moonshot / anthropic）
  const res = await fetch(`${baseUrl}${provider.modelsEndpoint}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data = await res.json()
  return data.data?.map((m: any) => m.id) ?? []
}
