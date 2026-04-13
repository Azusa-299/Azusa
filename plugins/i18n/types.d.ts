import type { DefineLocaleMessage } from 'vue-i18n'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    sidebar: {
      welcome: string
      chat: string
      model: string
      setting: string
      about: string
    }
  }
}
