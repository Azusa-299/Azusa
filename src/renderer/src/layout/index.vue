<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeMode } from '@renderer/hook/useTheme'

import Welcome from '@renderer/views/Welcome/welcome.vue'
import Chat from '@renderer/views/Chat/chat.vue'
import Model from '@renderer/views/Model/model.vue'
import Settings from '@renderer/views/Settings/settings.vue'
import About from '@renderer/views/About/about.vue'
import Personality from '@renderer/views/personality/personality.vue'

import {
  HomeOutline as HomeIcon,
  ChatbubblesOutline as ChatIcon,
  SettingsOutline as SettingIcon,
  InformationCircleOutline as AboutIcon,
  CubeOutline as ModelIcon,
  SunnyOutline as LightIcon,
  MoonOutline as DarkIcon,
  ContrastOutline as AutoIcon,
  PersonOutline as PersonalityIcon
} from '@vicons/ionicons5'

const { t } = useI18n()
const { currentTheme, setTheme } = useTheme()

const navItems = computed(() => [
  { label: t('sidebar.welcome'), key: 'welcome', icon: HomeIcon },
  { label: t('sidebar.chat'), key: 'chat', icon: ChatIcon },
  { label: t('sidebar.model'), key: 'model', icon: ModelIcon },
  { label: t('sidebar.personality'), key: 'personality', icon: PersonalityIcon },
  { label: t('sidebar.setting'), key: 'setting', icon: SettingIcon },
  { label: t('sidebar.about'), key: 'about', icon: AboutIcon }
])

const themeOptions = computed(() => [
  { label: t('theme.light'), value: 'light', icon: LightIcon },
  { label: t('theme.dark'), value: 'dark', icon: DarkIcon },
  { label: t('theme.auto'), value: 'auto', icon: AutoIcon }
])

const themeMenuShow = ref(false)
const activeKey = ref('welcome')

const currentComponent = computed(() => {
  const componentMap: Record<string, any> = {
    welcome: Welcome,
    chat: Chat,
    model: Model,
    personality: Personality,
    setting: Settings,
    about: About
  }
  return componentMap[activeKey.value] || Welcome
})

const themeIcon = computed(() => {
  const map = {
    light: LightIcon,
    dark: DarkIcon,
    auto: AutoIcon
  }
  return map[currentTheme.value]
})

const handleThemeSelect = (mode: ThemeMode) => {
  setTheme(mode)
  themeMenuShow.value = false
}
</script>

<template>
  <div class="app-shell">
    <header class="header-panel">
      <div class="header-left">
        <span class="app-title">Azusa</span>
        <span class="app-version">v0.0.1</span>
      </div>

      <var-menu v-model:show="themeMenuShow" trigger="click" placement="bottom-end">
        <var-button round text class="theme-btn" aria-label="theme">
          <component :is="themeIcon" class="icon" />
        </var-button>

        <template #menu>
          <div class="theme-menu">
            <div
              v-for="item in themeOptions"
              :key="item.value"
              class="theme-menu-item"
              @click="handleThemeSelect(item.value as ThemeMode)"
            >
              <component :is="item.icon" class="icon small" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </template>
      </var-menu>
    </header>

    <div class="main-body">
      <aside class="sider-panel">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeKey === item.key }"
          @click="activeKey = item.key"
        >
          <component :is="item.icon" class="icon small" />
          <span>{{ item.label }}</span>
        </div>
      </aside>

      <main class="content-panel">
        <component :is="currentComponent" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  gap: 12px;
  box-sizing: border-box;
}

.icon {
  width: 20px;
  height: 20px;
}

.icon.small {
  width: 16px;
  height: 16px;
}

.header-panel {
  height: 64px;
  border: 1px solid var(--azusa-border);
  border-radius: 16px;
  background: var(--azusa-surface);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  background: linear-gradient(135deg, #f093fb 0%, #a771ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 20px;
  font-weight: 700;
}

.app-version {
  color: var(--azusa-text-soft);
  font-size: 12px;
  padding: 4px 10px;
  background: var(--azusa-chip-bg);
  border-radius: 999px;
}

.theme-btn {
  width: 36px;
  min-width: 36px;
  color: var(--azusa-text);
}

.theme-menu {
  min-width: 140px;
  padding: 6px;
  border-radius: 12px;
  background: var(--azusa-surface-strong);
  border: 1px solid var(--azusa-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--azusa-text);
}

.theme-menu-item:hover {
  background: var(--azusa-hover);
}

.main-body {
  display: flex;
  min-height: 0;
  flex: 1;
  gap: 12px;
}

.sider-panel {
  width: 220px;
  border: 1px solid var(--azusa-border);
  border-radius: 16px;
  background: var(--azusa-surface);
  backdrop-filter: blur(10px);
  padding: 10px;
  box-sizing: border-box;
  overflow-y: auto;
}

.menu-item {
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: var(--azusa-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: var(--azusa-hover);
}

.menu-item.active {
  background: var(--azusa-active);
  color: var(--azusa-text);
  box-shadow: var(--azusa-shadow-soft);
}

.content-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--azusa-border);
  border-radius: 16px;
  background: var(--azusa-surface-strong);
  backdrop-filter: blur(8px);
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

@media (max-width: 900px) {
  .main-body {
    flex-direction: column;
  }

  .sider-panel {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .menu-item {
    justify-content: center;
  }
}
</style>
