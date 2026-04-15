<script setup lang="ts">
import { NCard, NSpace, NSelect, NIcon, useThemeVars } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@renderer/hook/useTheme'
import { LanguageOutline, ColorPaletteOutline } from '@vicons/ionicons5'
import type { ThemeMode } from '@renderer/hook/useTheme'

const { t, locale } = useI18n()
const vars = useThemeVars()
const { currentTheme, setTheme } = useTheme()

// 语言选项
const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

// 主题选项
const themeOptions = [
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
  { label: t('theme.auto'), value: 'auto' }
]

// 切语言时存到 localStorage
const handleLocaleChange = (val: string) => {
  locale.value = val
  localStorage.setItem('locale', val)
}

// 切主题
const handleThemeChange = (val: string) => {
  setTheme(val as ThemeMode)
}
</script>

<template>
  <div class="settings">
    <h2 class="settings-title">{{ t('settings.title') }}</h2>

    <n-space vertical :size="16">
      <!-- 语言设置 -->
      <n-card>
        <div class="setting-row">
          <div class="setting-info">
            <n-icon size="20" :color="vars.primaryColor">
              <LanguageOutline />
            </n-icon>
            <span class="setting-label">{{ t('settings.language') }}</span>
          </div>
          <n-select
            :value="locale"
            :options="localeOptions"
            style="width: 160px"
            @update:value="handleLocaleChange"
          />
        </div>
      </n-card>

      <!-- 主题设置 -->
      <n-card>
        <div class="setting-row">
          <div class="setting-info">
            <n-icon size="20" :color="vars.primaryColor">
              <ColorPaletteOutline />
            </n-icon>
            <span class="setting-label">{{ t('settings.theme') }}</span>
          </div>
          <n-select
            :value="currentTheme"
            :options="themeOptions"
            style="width: 160px"
            @update:value="handleThemeChange"
          />
        </div>
      </n-card>
    </n-space>
  </div>
</template>

<style scoped>
.settings {
  max-width: 760px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  color: v-bind('vars.textColor1');
  margin: 0px 10px 10px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: v-bind('vars.textColor1');
}

.settings {
  /* 使用 v-bind 引用主题变量 */
  color: v-bind('vars.textColor1');
  background-color: v-bind('vars.cardColor');
}
</style>
