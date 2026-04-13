import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@plugins': resolve('plugins')
      }
    },
    plugins: [
      vue(),
      VueI18nPlugin({
        include: resolve('plugins/i18n/locales/**')
      })
    ]
  }
})
