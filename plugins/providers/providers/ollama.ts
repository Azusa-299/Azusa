import type { Provider } from '../types'

export const ollama: Provider = {
  id: 'ollama',
  name: 'Ollama',
  baseUrl: 'http://localhost:11434',
  apiKeyFormat: 'none Key',
  features: ['chat', 'vision', 'tool_use'],
  modelsEndpoint: '/api/tags'
}
