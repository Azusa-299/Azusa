import { ElectronAPI } from '@electron-toolkit/preload'

interface ApiConfig {
  read: () => Promise<Record<string, any>>
  write: (data: any) => Promise<void>
}

interface ApiModels {
  fetch: (providerId: string, apiKey: string, baseUrl?: string) => Promise<string[]>
}

interface ApiChat {
  request: (req: any) => Promise<string>
  stream: (req: any) => Promise<void>
  abort: () => Promise<void>
  onChunk: (callback: (chunk: string) => void) => void
  onEnd: (callback: () => void) => void
  onError: (callback: (err: string) => void) => void
  removeAllListeners: () => void
}

interface Api {
  config: ApiConfig
  models: ApiModels
  chat: ApiChat
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
