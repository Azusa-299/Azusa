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
}
