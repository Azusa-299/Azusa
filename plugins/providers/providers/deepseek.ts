import type { Provider } from '../types'

export const deepseek: Provider = {
  id: 'deepseek',
  name: 'DeepSeek',
  baseUrl: 'https://api.deepseek.com/v1',
  features: ['chat', 'tool_use'],
  modelsEndpoint: '/models',
  authType: 'bearer'
}
