import { createApp } from 'vue'
import Varlet from '@varlet/ui'
import '@varlet/ui/es/varlet.css'
import App from './App.vue'
import i18n from '@plugins/i18n'

createApp(App).use(Varlet).use(i18n).mount('#app')
