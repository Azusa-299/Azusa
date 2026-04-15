import type { Provider } from '../types'

export const anthropic: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  baseUrl: 'https://api.anthropic.com/v1',
  apiKeyFormat: 'sk-ant-...',
  features: ['chat', 'vision', 'tool_use'],
  modelsEndpoint: '/models',
  authType: 'bearer'
}
