import type { Provider } from '../types'

export const zhipu: Provider = {
  id: 'zhipu',
  name: '智谱 AI',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  features: ['chat', 'vision', 'tool_use', 'image'],
  modelsEndpoint: '/models'
}
