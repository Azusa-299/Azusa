import { ElectronAPI } from '@electron-toolkit/preload'

interface ApiConfig {
  read: () => Promise<Record<string, any>>
  write: (data: any) => Promise<void>
}

interface ApiModels {
  fetch: (providerId: string, apiKey: string, baseUrl?: string) => Promise<string[]>
}

interface Api {
  config: ApiConfig
  models: ApiModels
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
