import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  config: {
    read: () => ipcRenderer.invoke('config:read'),
    write: (data: any) => ipcRenderer.invoke('config:write', data)
  },
  models: {
    fetch: (providerId: string, apiKey: string, baseUrl?: string) =>
      ipcRenderer.invoke('models:fetch', { providerId, apiKey, baseUrl })
  },
  chat: {
    request: (req: any) => ipcRenderer.invoke('chat:request', req)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
