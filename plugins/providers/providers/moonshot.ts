import type { Provider } from '../types'

export const moonshot: Provider = {
  id: 'moonshot',
  name: 'Moonshot AI',
  baseUrl: 'https://api.moonshot.cn/v1',
  apiKeyFormat: 'sk-...',
  features: ['chat', 'vision', 'tool_use'],
  modelsEndpoint: '/models'
}
