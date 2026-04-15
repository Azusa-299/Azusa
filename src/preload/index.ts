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
    // 非流式请求
    request: (req: any) => ipcRenderer.invoke('chat:request', req),

    // 流式请求
    stream: (req: any) => ipcRenderer.invoke('chat:stream', req),

    // 监听流式数据块
    onChunk: (callback: (chunk: string) => void) => {
      ipcRenderer.on('chat:stream:chunk', (_, chunk) => callback(chunk))
    },

    // 监听流式结束
    onEnd: (callback: () => void) => {
      ipcRenderer.on('chat:stream:end', () => callback())
    },

    // 监听错误
    onError: (callback: (err: string) => void) => {
      ipcRenderer.on('chat:stream:error', (_, err) => callback(err))
    },

    // 清理所有监听（组件卸载时必须调用）
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('chat:stream:chunk')
      ipcRenderer.removeAllListeners('chat:stream:end')
      ipcRenderer.removeAllListeners('chat:stream:error')
    }
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
