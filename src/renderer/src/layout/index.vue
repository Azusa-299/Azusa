<script setup lang="ts">
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NIcon,
  NButton,
  NDropdown
} from 'naive-ui'
import { ref, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@renderer/hook/useTheme'

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
  MoveOutline as MoreIcon,
  PersonOutline as PersonalityIcon,
} from '@vicons/ionicons5'

const { t } = useI18n()
const { currentTheme, setTheme } = useTheme()

// 包装成渲染函数
function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => [
  { label: t('sidebar.welcome'), key: 'welcome', icon: renderIcon(HomeIcon) },
  { label: t('sidebar.chat'), key: 'chat', icon: renderIcon(ChatIcon) },
  { label: t('sidebar.model'), key: 'model', icon: renderIcon(ModelIcon) },
  {
    label: t('sidebar.more'),
    key: 'more',
    icon: renderIcon(MoreIcon),
    children: [
      { label: t('sidebar.personality'), key: 'personality', icon: renderIcon(PersonalityIcon) },
    ]
  },
  { label: t('sidebar.setting'), key: 'setting', icon: renderIcon(SettingIcon) },
  { label: t('sidebar.about'), key: 'about', icon: renderIcon(AboutIcon) },
])

// 主题图标
const themeIcon = computed(() => {
  const iconMap = {
    light: LightIcon,
    dark: DarkIcon,
    auto: AutoIcon
  }
  return iconMap[currentTheme.value]
})

// 主题下拉选项
const themeOptions = computed(() => [
  { label: t('theme.light'), key: 'light', icon: renderIcon(LightIcon) },
  { label: t('theme.dark'), key: 'dark', icon: renderIcon(DarkIcon) },
  { label: t('theme.auto'), key: 'auto', icon: renderIcon(AutoIcon) }
])

const handleThemeSelect = (key: string) => {
  setTheme(key as any)
}

// 当前选中的菜单项
const activeKey = ref('welcome')

// 根据选中的key返回对应的组件
const currentComponent = computed(() => {
  const componentMap: Record<string, any> = {
    welcome: Welcome,
    chat: Chat,
    model: Model,
    personality: Personality,
    setting: Settings,
    about: About,
  }
  return componentMap[activeKey.value] || Welcome
})

const handleMenuClick = (key: string) => {
  activeKey.value = key
}
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; background: var(--n-color);">
    <n-layout style="height: 100%; background: transparent;">
      <!-- 顶部标题栏 -->
      <n-layout-header bordered style="background-color: var(--n-color, #ffffff); box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
        <div class="header-content">
          <div class="header-left">
            <span class="app-title">Azusa</span>
            <span class="app-version">v0.0.1</span>
          </div>

          <div class="header-right">
            <n-dropdown
              trigger="click"
              :options="themeOptions"
              @select="handleThemeSelect"
            >
              <n-button quaternary circle :title="`主题: ${currentTheme}`">
                <template #icon>
                  <n-icon size="20">
                    <component :is="themeIcon" />
                  </n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </div>
      </n-layout-header>

      <!-- 主体区域：左侧菜单 + 右侧内容 -->
      <div style="flex: 1; display: flex; overflow: hidden;">
        <!-- 左侧菜单 -->
        <n-layout-sider
          bordered
          show-trigger
          :trigger-props="{ placement: 'top-right' }"
          collapse-mode="width"
          :collapsed-width="64"
          :width="200"
          :native-scrollbar="false"
          :style="{ backgroundColor: 'var(--n-color, #ffffff)' }"
        >
          <n-menu
            v-model:value="activeKey"
            style="height: 100%; padding: 20px 0;"
            :options="menuOptions"
            key-field="key"
            label-field="label"
            icon-field="icon"
            @update:value="handleMenuClick"
          />
        </n-layout-sider>

        <!-- 右侧内容区域 -->
        <n-layout-content
          content-style="padding: 20px; height: 100%;"
          :style="{ backgroundColor: 'var(--n-color, #ffffff)', height: '100%'}"
        >
          <div class="content-wrapper">
            <component :is="currentComponent" />
          </div>
        </n-layout-content>
      </div>
    </n-layout>
  </div>
</template>

<style scoped>
.header-content {
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-title {
  background: linear-gradient(135deg, #32f107 0%, #00a488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 20px;
  font-weight: 600;
}

.app-version {
  font-size: 12px;
  color: var(--n-text-color-3);
  padding: 4px 10px;
  background: var(--n-color-embedded);
  border-radius: 20px;
  font-weight: 500;
}

.content-wrapper {
  min-height: calc(100vh - 105px);
  height: calc(100vh - 105px);
  overflow: hidden;
}

/* 菜单项目样式美化 */
:deep(.n-menu) {
  background: transparent;
}

:deep(.n-menu-item) {
  border-radius: 8px;
  margin: 2px 8px;
  transition: all 0.2s ease;
}

::deep(.n-menu-item:hover) {
  background: var(--n-color-hover, #f5f5f5) !important;
}

:deep(.n-menu-item.n-menu-item--selected) {
  background: linear-gradient(135deg, #32f107 0%, #00a488 100%) !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

:deep(.n-menu-item.n-menu-item--selected .n-menu-item-content) {
  color: #ffffff !important;
  font-weight: 500;
}

:deep(.n-menu-item.n-menu-item--selected .n-icon) {
  color: #ffffff !important;
}

::deep(.n-menu-item-content) {
  color: var(--n-text-color, #2c3e50);
}

::deep(.n-icon) {
  color: var(--n-text-color-3, #7f8c8d);
}

:deep(.n-menu-item:hover .n-icon) {
  color: #00c84d;
}

::deep(.n-layout-sider-trigger) {
  background: var(--n-color, #ffffff) !important;
  border-top: 1px solid var(--n-border-color, #f0f0f0) !important;
}

:deep(.n-layout-sider-trigger:hover) {
  background: #f5f5f5 !important;
}
</style>
