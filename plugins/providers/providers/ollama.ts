import type { Provider } from '../types'

export const ollama: Provider = {
  id: 'ollama',
  name: 'Ollama',
  baseUrl: 'http://localhost:11434',
  apiKeyFormat: 'none',
  features: ['chat', 'vision', 'tool_use'],
  modelsEndpoint: '/api/tags',
  chatEndpoint: '/api/chat',
  authType: 'none',
  streamFormat: 'ollama'
}