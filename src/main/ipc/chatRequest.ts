/**
 * 简易测试聊天请求
 */
// src/main/chatRequest.ts
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  providerId: string
  modelId: string
  apiKey: string
  baseUrl: string
  messages: ChatMessage[]
}

export async function chatRequest(req: ChatRequest): Promise<string> {
  const { baseUrl, modelId, apiKey, messages } = req
  const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({ model: modelId, messages })
  })

  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
