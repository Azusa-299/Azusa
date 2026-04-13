<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import ChatModelPanel from './ChatModelPanel.vue'

const { t } = useI18n()
const activeTab = ref('chatModel')
</script>

<template>
  <div class="model-page">
    <n-tabs v-model:value="activeTab" type="line" class="model-tabs">
      <n-tab-pane :name="'chatModel'" :tab="t('model.chatModel')">
        <ChatModelPanel />
      </n-tab-pane>
      <!-- 后续加 tab 在这追加就行，比如：
      <n-tab-pane name="imageModel" :tab="t('model.imageModel')">
        <ImageModelPanel />
      </n-tab-pane>
      -->
    </n-tabs>
  </div>
</template>

<style scoped>
.model-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.model-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 让 tab 内容区撑满剩余高度 */
.model-tabs :deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: auto;
}
</style>
