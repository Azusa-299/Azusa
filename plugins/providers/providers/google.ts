import type { Provider } from '../types'

export const google: Provider = {
  id: 'google',
  name: 'Google',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKeyFormat: 'AIza...',
  features: ['chat', 'vision', 'tool_use', 'image'],
  modelsEndpoint: '/models',
  chatEndpoint: '/models',
  authType: 'apikey-query'
}