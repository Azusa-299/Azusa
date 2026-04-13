<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NIcon } from 'naive-ui'
import { RocketOutline } from '@vicons/ionicons5'

const { t } = useI18n()
</script>

<template>
  <div class="welcome">
    <div class="welcome-icon">
      <n-icon size="48" color="#00a488">
        <RocketOutline />
      </n-icon>
    </div>
    <h1 class="welcome-title">{{ t('welcome.title') }}</h1>
    <p class="welcome-subtitle">{{ t('welcome.subtitle') }}</p>
    <p class="welcome-hint">{{ t('welcome.hint') }}</p>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 128px);
  text-align: center;
  gap: 12px;
  background: var(--n-color, transparent);
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--n-text-color, #2c3e50);
  margin: 0;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--n-text-color-3, #7f8c8d);
  margin: 0;
}

.welcome-hint {
  font-size: 13px;
  color: var(--n-text-color-3, #7f8c8d);
  margin: 0;
  opacity: 0.7;
}
</style>