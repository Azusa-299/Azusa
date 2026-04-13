<script setup lang="ts">
import { ref } from 'vue'
import { NSplit, NCard, NForm, NFormItem, NSelect, NInput, NButton, NSwitch, NIcon } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { AddOutline, TrashOutline, RefreshOutline } from '@vicons/ionicons5'

const { t } = useI18n()

// 你的数据逻辑...
const providerOptions = ref<{ label: string; value: string }[]>([])
const form = ref({ provider: '', id: '', apiKey: '', baseUrl: '', enable: true })
interface SourceItem {
  id: string
  provider: string
  apiKey: string
  baseUrl: string
  enable: boolean
}
const savedSources = ref<SourceItem[]>([])
const selectedSourceId = ref<string | null>(null)
const isNew = ref(true)
</script>

<template>
  <div class="chat-model-panel">
    <n-split :default-size="0.35" :min="0.2" :max="0.5" direction="horizontal">
      <!-- 左侧：模型源列表 -->
      <template #1>
        <div class="source-list">
          <div
            v-for="source in savedSources"
            :key="source.id"
            class="source-item"
            :class="{ active: selectedSourceId === source.id }"
            @click=""
          >
            <span class="source-name">{{ source.id }}</span>
            <n-button quaternary circle size="tiny" @click.stop="">
              <template #icon><n-icon><TrashOutline /></n-icon></template>
            </n-button>
          </div>

          <div class="add-source" :class="{ active: isNew }" @click="">
            <n-icon size="16"><AddOutline /></n-icon>
            <span>{{ t('model.addProvider') }}</span>
          </div>
        </div>
      </template>

      <!-- 右侧：配置表单 + 模型列表 -->
      <template #2>
        <div class="right-panel">
          <n-form label-placement="top" class="model-form">
            <n-form-item :label="t('model.chatModel')">
              <n-select v-model:value="form.provider" :options="providerOptions" :placeholder="t('model.selectModel')" />
            </n-form-item>
            <n-form-item label="ID">
              <n-input v-model:value="form.id" :placeholder="t('model.inputId')" :disabled="!isNew" />
            </n-form-item>
            <n-form-item label="API Key">
              <n-input v-model:value="form.apiKey" type="password" show-password-on="click" :placeholder="t('model.inputApiKey')" />
            </n-form-item>
            <n-form-item label="API Base URL">
              <n-input v-model:value="form.baseUrl" :placeholder="t('model.inputBaseUrl')" />
            </n-form-item>
          </n-form>

          <!-- 模型列表区域（后续补表格逻辑） -->
          <div class="panel-actions">
            <n-button type="primary" size="small">{{ t('model.save') }}</n-button>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

<style scoped>
.chat-model-panel {
  height: 100%;
}

.source-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  overflow-y: auto;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.source-item:hover {
  background: var(--n-color-hover);
}
.source-item.active {
  background: rgba(24, 160, 88, 0.08);
  color: var(--primary-color, #18a058);
}

.source-name {
  font-size: 13px;
  font-weight: 500;
}

.add-source {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--n-border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--n-text-color-3);
  transition: all 0.2s;
  margin-top: 4px;
}
.add-source:hover,
.add-source.active {
  border-color: var(--primary-color, #18a058);
  color: var(--primary-color, #18a058);
}

.right-panel {
  padding: 16px 20px;
  height: 100%;
  overflow-y: auto;
}

.model-form {
  margin-bottom: 12px;
}

.panel-actions {
  margin-top: 12px;
}
</style>