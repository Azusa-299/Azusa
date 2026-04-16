<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import {
  NSplit,
  NForm,
  NFormItem,
  NSelect,
  NInput,
  NButton,
  NSwitch,
  NIcon,
  NDataTable,
  NScrollbar,
  useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { AddOutline, TrashOutline, RefreshOutline } from '@vicons/ionicons5'
import { allProviders } from '@plugins/providers/providers'

const { t } = useI18n()
const message = useMessage()

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
const modelList = ref<{ id: string }[]>([])
const modelsLoading = ref(false)

// ---- 模型启用状态 ----
const enabledModelIds = ref<string[]>([])

// 初始化：从 config.json 读源列表
onMounted(async () => {
  const config = await window.api.config.read()
  if (config.provider_sources) {
    savedSources.value = Object.entries(config.provider_sources).map(([id, val]: [string, any]) => ({
      id,
      provider: val.provider || '',
      apiKey: val.key?.[0] || '',
      baseUrl: val.api_base || '',
      enable: val.enable !== false
    }))
  }
})

const modelColumns = [
  { title: 'ID', key: 'id' },
  {
    title: '',
    key: 'enable',
    width: 60,
    align: 'center' as const,
    render(row: { id: string }) {
      return h(NSwitch, {
        value: enabledModelIds.value.includes(row.id),
        onUpdateValue: (val: boolean) => toggleModel(row.id, val)
      })
    }
  }
]


// 切换源时同步已启用模型
// async function syncEnabledModels() {
//   const config = await window.api.config.read()
//   const sourceModels = config.providers?.[form.value.id]?.enabledModels || []
//   enabledModelIds.value = sourceModels
// }

// 切换开关
function toggleModel(modelId: string, val: boolean) {
  if (val) {
    if (!enabledModelIds.value.includes(modelId)) enabledModelIds.value.push(modelId)
  } else {
    enabledModelIds.value = enabledModelIds.value.filter(id => id !== modelId)
  }
}

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
  enabledModelIds.value = []
  loadCachedModels(source.id)
}

// 点「新建」
function clickNew() {
  isNew.value = true
  selectedSourceId.value = null
  form.value = { provider: '', id: '', apiKey: '', baseUrl: '', enable: true }
  modelList.value = []
  enabledModelIds.value = []
}

// 从 config 读缓存的模型
async function loadCachedModels(sourceId: string) {
  const config = await window.api.config.read()
  // 从 provider 数组中过滤出属于当前 source 的模型
  const sourceModels = config.provider?.filter((m: any) => m.provider_source_id === sourceId) || []
  modelList.value = sourceModels.map((m: any) => ({ id: m.model }))
  enabledModelIds.value = sourceModels.filter((m: any) => m.enable).map((m: any) => m.model)
}

// 刷新模型列表
async function refreshModels() {
  console.log('refreshModels called, form:', JSON.stringify(form.value))

  // Ollama 可能不需要 API Key，其他供应商必须有 API Key
  if (!form.value.provider || (!isOllama && !form.value.apiKey)) {
    console.log('blocked: provider or apiKey is empty')
    return
  }

  modelsLoading.value = true
  try {
    // 调用主进程 API 获取模型列表
    const models = await window.api.models.fetch(
      form.value.provider,
      form.value.apiKey,
      form.value.baseUrl || undefined
    )
    // 将字符串数组转换为 { id: string }[] 格式
    modelList.value = models.map((model: string) => ({ id: model }))
    console.log('fetched models:', modelList.value)
  } catch (e) {
    console.error('fetchModels error:', e)
  } finally {
    modelsLoading.value = false
  }
}


// 保存源到 config.json
async function saveSource() {
  if (!form.value.id) {
    message.warning(t('model.inputIdPlaceholder'))
    return
  }

  try {
    message.success(t('model.saveSuccess'))
    const config = await window.api.config.read()

    // 确保配置结构
    if (!config.provider_sources) config.provider_sources = {}
    if (!config.provider) config.provider = []

    // 1. 保存 provider source
    config.provider_sources[form.value.id] = {
      id: form.value.id,
      provider: form.value.provider,
      type: 'openai_chat_completion',
      provider_type: 'chat_completion',
      key: form.value.apiKey ? [form.value.apiKey] : [],
      timeout: 120,
      api_base: form.value.baseUrl || (form.value.provider === 'ollama' ? 'http://localhost:11434/v1' : ''),
      custom_headers: {},
      enable: form.value.enable
    }

    // 2. 保存每个模型
    for (const model of modelList.value) {
      const modelId = `${form.value.id}/${model.id}`
      const existingIndex = config.provider.findIndex(m => m.id === modelId)

      const modelConfig = {
        id: modelId,
        enable: enabledModelIds.value.includes(model.id),
        provider_source_id: form.value.id,
        model: model.id,
        modalities: ['text'],
        custom_extra_body: {},
        max_context_tokens: 0
      }

      if (existingIndex >= 0) {
        config.provider[existingIndex] = modelConfig
      } else {
        config.provider.push(modelConfig)
      }
    }

    await window.api.config.write(config)

    // 刷新左侧列表
    isNew.value = false
    selectedSourceId.value = form.value.id
    savedSources.value = Object.entries(config.provider_sources).map(([id, val]: [string, any]) => ({
      id,
      provider: val.provider || '',
      apiKey: val.apiKey || '',
      baseUrl: val.baseUrl || '',
      enable: val.enable !== false
    }))
  } catch (error) {
    message.error(t('model.saveFailed'))
  }
}

// 删除源
async function deleteSource(id: string) {
  const config = await window.api.config.read()
  delete config.provider_sources[id]
  // 同时删除关联的模型
  config.provider = config.provider?.filter((m: any) => m.provider_source_id !== id) || []
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
    if (isNew.value && !form.value.id) {
      form.value.id = val
    }
  }
  modelList.value = []
}

const isOllama = computed(() => {
  const currentProvider = allProviders.find(p => p.id === form.value.provider)
  return currentProvider?.id === 'ollama' || currentProvider?.name.toLowerCase().includes('ollama')
})
</script>

<!-- BUG FIX: 模型列表无法滚动 -->
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
        <n-scrollbar class="right-panel">
          <div class="right-content">
          <n-form label-placement="top" class="model-form">
            <n-form-item :label="t('model.chatModel')">
              <n-select
                v-model:value="form.provider"
                :options="providerOptions"
                :placeholder="t('model.selectModel')"
                @update:value="onProviderChange"
              />
            </n-form-item>
            <n-form-item :label="t('model.inputId')">
              <n-input v-model:value="form.id" :placeholder="t('model.inputIdPlaceholder')" :disabled="!isNew" />
            </n-form-item>
            <n-form-item :label="t('model.apiKey')">
              <n-input v-model:value="form.apiKey" type="password" show-password-on="click" :placeholder="t('model.inputApiKey')" />
            </n-form-item>
            <n-form-item :label="t('model.baseUrl')">
              <n-input v-model:value="form.baseUrl" :placeholder="t('model.inputBaseUrl')" />
            </n-form-item>
          </n-form>

          <!-- 模型列表 -->
          <div class="model-list-section">
            <div class="model-list-header">
              <span>{{ t('model.modelList') }}</span>
              <n-button
                size="tiny"
                :loading="modelsLoading"
                :disabled="!form.provider || (!isOllama && !form.apiKey)"
                @click="refreshModels"
              >
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
                {{ t('model.refresh') }}
              </n-button>
            </div>
            <n-data-table
              :columns="modelColumns"
              :data="modelList"
              :bordered="false"
              size="small"
              :row-key="(row: any) => row.id"
              max-height="300"
              v-if="modelList.length"
            />

            <div v-else class="model-empty">{{ t('model.refreshHint') }}</div>
          </div>

          <div class="panel-actions">
            <n-button type="primary" size="small" @click="saveSource">{{ t('model.save') }}</n-button>
          </div>
          </div>
        </n-scrollbar>
      </template>
    </n-split>
  </div>
</template>

<style scoped>
.chat-model-panel {
  height: 100%;
}
.chat-model-panel :deep(.n-split-pane-1),
.chat-model-panel :deep(.n-split-pane-2) {
  overflow: hidden;
  min-height: 0;
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
  height: 100%;
}

.right-content {
  padding: 16px 20px;
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
