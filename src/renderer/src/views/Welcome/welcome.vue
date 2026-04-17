<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RocketOutline } from '@vicons/ionicons5'

const { t } = useI18n()
</script>

<template>
  <div class="welcome">
    <div class="welcome-icon">
      <component :is="RocketOutline" class="icon" />
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
  height: 100%;
  text-align: center;
  gap: 10px;
}

.welcome-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, #ffd9fb, #e6c2ff 60%, #ddb2ff 100%);
}

.icon {
  width: 54px;
  height: 54px;
  color: #7f3fb8;
}

.welcome-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--azusa-text);
  margin: 0;
}

.welcome-subtitle,
.welcome-hint {
  margin: 0;
  color: var(--azusa-text-soft);
}
</style>
