import type { Provider } from '../types'

export const openai: Provider = {
  id: 'openai',
  name: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKeyFormat: 'sk-...',
  features: ['chat', 'vision', 'tool_use', 'voice', 'image'],
  modelsEndpoint: '/models',
  authType: 'bearer'
}
