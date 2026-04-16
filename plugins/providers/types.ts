// 提供商接口
export interface Provider {
  id: string
  name: string
  baseUrl: string
  apiKeyFormat: string
  features: string[]
  modelsEndpoint: string
  chatEndpoint?: string        // 默认为 /chat/completions
  authType?: 'bearer' | 'apikey-query' | 'none'  // 默认为 bearer
  streamFormat?: 'openai' | 'ollama'
  defaultParams?: ChatParams
}

// 聊天参数
// Provider 默认参数 → 用户全局参数 → 单个源参数
export interface ChatParams {
  temperature?: number          // 0-2
  top_p?: number                // 0-1
  max_tokens?: number           // 1-128000
  presence_penalty?: number     // -2 to 2
  frequency_penalty?: number    // -2 to 2
  stop?: string[]               // 停止词
  [key: string]: any            // 支持扩展字段，如 think、tools 等
}
