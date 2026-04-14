export { openai } from './openai'
export { anthropic } from './anthropic'
export { google } from './google'
export { deepseek } from './deepseek'
export { zhipu } from './zhipu'
export { moonshot } from './moonshot'
export { ollama } from './ollama'

import { openai } from './openai'
import { anthropic } from './anthropic'
import { google } from './google'
import { deepseek } from './deepseek'
import { zhipu } from './zhipu'
import { moonshot } from './moonshot'
import { ollama } from './ollama'
import type { Provider } from '../types'

export const allProviders: Provider[] = [
  openai,
  anthropic,
  google,
  deepseek,
  zhipu,
  moonshot,
  ollama
]
