<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSplit, NCard, NForm, NFormItem, NSelect, NInput, NButton, NSwitch, NIcon, NTag, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { AddOutline, TrashOutline, RefreshOutline } from '@vicons/ionicons5'
import { allProviders } from '@plugins/providers/providers'

const { t } = useI18n()

// Provider 下拉选项（固定列表）
const providerOptions = allProviders.map(p => ({
  label: p.name,
  value: p.id
}))

// ---- 表单 ----
const form = ref({
  provider: '',
  id: '',
  apiKey: '',
  baseUrl: '',
  enable: true
})

// ---- 源列表 ----
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

// ---- 模型列表 ----
const modelList = ref<string[]>([])
const modelsLoading = ref(false)

// 初始化：从 config.json 读源列表
onMounted(async () => {
  const config = await window.api.config.read()
  if (config.providers) {
    savedSources.value = Object.entries(config.providers).map(([id, val]: [string, any]) => ({
      id,
      provider: val.provider || '',
      apiKey: val.apiKey || '',
      baseUrl: val.baseUrl || '',
      enable: val.enable !== false
    }))
  }
})

// 选已有源 → 填充表单
function selectSource(source: SourceItem) {
  isNew.value = false
  selectedSourceId.value = source.id
  // 逐字段赋值，保持响应式引用
  form.value.provider = source.provider
  form.value.id = source.id
  form.value.apiKey = source.apiKey
  form.value.baseUrl = source.baseUrl
  form.value.enable = source.enable
  // 先清空再加载
  modelList.value = []
  loadCachedModels(source.id)
}

// 点「新建」
function clickNew() {
  isNew.value = true
  selectedSourceId.value = null
  form.value = { provider: '', id: '', apiKey: '', baseUrl: '', enable: true }
  modelList.value = []
}

// 从 config 读缓存的模型
async function loadCachedModels(sourceId: string) {
  const config = await window.api.config.read()
  modelList.value = config.providers?.[sourceId]?.models || []
}

// 刷新模型列表
async function refreshModels() {
  if (!form.value.provider || !form.value.apiKey) return
  modelsLoading.value = true
  try {
    const models = await window.api.models.fetch(
      form.value.provider,
      form.value.apiKey,
      form.value.baseUrl || undefined
    )
    modelList.value = models
  } finally {
    modelsLoading.value = false
  }
}

// 保存源到 config.json
async function saveSource() {
  if (!form.value.id) return
  const config = await window.api.config.read()
  if (!config.providers) config.providers = {}

  config.providers[form.value.id] = {
    provider: form.value.provider,
    apiKey: form.value.apiKey,
    baseUrl: form.value.baseUrl,
    enable: form.value.enable,
    models: modelList.value
  }
  await window.api.config.write(config)

  // 刷新左侧列表
  isNew.value = false
  selectedSourceId.value = form.value.id
  // 重新加载列表
  const newConfig = await window.api.config.read()
  savedSources.value = Object.entries(newConfig.providers).map(([id, val]: [string, any]) => ({
    id,
    provider: val.provider || '',
    apiKey: val.apiKey || '',
    baseUrl: val.baseUrl || '',
    enable: val.enable !== false
  }))
}

// 删除源
async function deleteSource(id: string) {
  const config = await window.api.config.read()
  delete config.providers[id]
  await window.api.config.write(config)

  savedSources.value = savedSources.value.filter(s => s.id !== id)
  if (selectedSourceId.value === id) {
    clickNew()
  }
}

// Provider 变更时自动填充默认 baseUrl，同时清空模型列表
function onProviderChange(val: string) {
  const provider = allProviders.find(p => p.id === val)
  if (provider) {
    form.value.baseUrl = provider.baseUrl
  }
  modelList.value = []
}
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
            @click="selectSource(source)"
          >
            <span class="source-name">{{ source.id }}</span>
            <n-button quaternary circle size="tiny" @click.stop="deleteSource(source.id)">
              <template #icon><n-icon><TrashOutline /></n-icon></template>
            </n-button>
          </div>

          <div class="add-source" :class="{ active: isNew }" @click="clickNew">
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
              <n-select
                v-model:value="form.provider"
                :options="providerOptions"
                :placeholder="t('model.selectModel')"
                @update:value="onProviderChange"
              />
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

          <!-- 模型列表 -->
          <div class="model-list-section">
            <div class="model-list-header">
              <span>模型列表</span>
              <n-button
                size="tiny"
                :loading="modelsLoading"
                :disabled="!form.provider || !form.apiKey"
                @click="refreshModels"
              >
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
                刷新
              </n-button>
            </div>
            <div class="model-tags" v-if="modelList.length">
              <n-tag v-for="m in modelList" :key="m" size="small" style="margin: 2px;">{{ m }}</n-tag>
            </div>
            <div v-else class="model-empty">点击刷新获取模型列表</div>
          </div>

          <div class="panel-actions">
            <n-button type="primary" size="small" @click="saveSource">{{ t('model.save') }}</n-button>
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

.model-list-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);
}

.model-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-empty {
  color: var(--n-text-color-disabled);
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

</style>