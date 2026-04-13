import { createApp } from 'vue'
import { useTheme } from './hook/useTheme'
import App from './App.vue'
import i18n from '@plugins/i18n'

const { activeTheme } = useTheme()
createApp(App).use(i18n).mount('#app')
