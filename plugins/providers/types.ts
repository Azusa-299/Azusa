// 提供商接口
export interface Provider {
  id: string
  name: string
  baseUrl: string
  features: string[]
  modelsEndpoint: string
  chatEndpoint?: string        // 默认为 /chat/completions
  authType?: 'bearer' | 'apikey-query' | 'none'  // 默认为 bearer
  streamFormat?: 'openai' | 'ollama'
}

// 聊天参数，支持任意扩展字段
export interface ChatParams {
  [key: string]: any
}
