<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeMode } from '@renderer/hook/useTheme'
import { LanguageOutline, ColorPaletteOutline } from '@vicons/ionicons5'

const { t, locale } = useI18n()
const { currentTheme, setTheme } = useTheme()

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const themeOptions = [
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
  { label: t('theme.auto'), value: 'auto' }
]

const handleLocaleChange = (val: string) => {
  locale.value = val
  localStorage.setItem('locale', val)
}

const handleThemeChange = (val: string | number) => {
  setTheme(val as ThemeMode)
}
</script>

<template>
  <div class="settings">
    <h2 class="settings-title">{{ t('settings.title') }}</h2>

    <section class="settings-panel">
      <div class="setting-row">
        <div class="setting-info">
          <component :is="LanguageOutline" class="setting-svg" />
          <div class="setting-texts">
            <span class="setting-label">{{ t('settings.language') }}</span>
            <span class="setting-desc">UI / i18n</span>
          </div>
        </div>
        <var-select
          :model-value="locale"
          :options="localeOptions"
          style="width: 200px"
          @change="handleLocaleChange"
        />
      </div>

      <div class="setting-divider" />

      <div class="setting-row">
        <div class="setting-info">
          <component :is="ColorPaletteOutline" class="setting-svg" />
          <div class="setting-texts">
            <span class="setting-label">{{ t('settings.theme') }}</span>
            <span class="setting-desc">Light / Dark / Auto</span>
          </div>
        </div>
        <var-select
          :model-value="currentTheme"
          :options="themeOptions"
          style="width: 200px"
          @change="handleThemeChange"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  max-width: 820px;
}

.settings-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--azusa-text);
  margin: 0 0 12px;
}

.settings-panel {
  border: 1px solid var(--azusa-border);
  border-radius: 16px;
  background: var(--azusa-surface-soft);
  overflow: hidden;
}

.setting-divider {
  height: 1px;
  background: var(--azusa-border);
  opacity: 0.8;
  margin: 0 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-svg {
  width: 20px;
  height: 20px;
  color: var(--azusa-accent);
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--azusa-text);
}

.setting-desc {
  font-size: 12px;
  color: var(--azusa-text-soft);
}

:deep(.var-select .var-field-decorator) {
  min-height: 40px;
  border: none;
  background: var(--azusa-select-bg);
}

@media (max-width: 900px) {
  .setting-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
