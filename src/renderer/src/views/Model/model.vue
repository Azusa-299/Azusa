<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatModelPanel from './ChatModelPanel.vue'

const { t } = useI18n()
const activeTab = ref('chatModel')
</script>

<template>
  <div class="model-page">
    <var-tabs v-model:active="activeTab" class="model-tabs">
      <var-tab name="chatModel">{{ t('model.chatModel') }}</var-tab>
    </var-tabs>

    <div class="tab-content">
      <ChatModelPanel v-if="activeTab === 'chatModel'" />
    </div>
  </div>
</template>

<style scoped>
.model-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.model-tabs {
  flex-shrink: 0;
  background: transparent;
}

.model-tabs :deep(.var-tabs) {
  background: transparent;
  border: 1px solid var(--azusa-border);
  border-radius: 12px;
}

.model-tabs :deep(.var-tab) {
  color: var(--azusa-text-soft);
}

.model-tabs :deep(.var-tab--active) {
  color: var(--azusa-text);
  font-weight: 600;
}

.model-tabs :deep(.var-tabs__indicator-inner) {
  background: var(--azusa-accent);
  opacity: 0.7;
}

.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 8px;
}
</style>
