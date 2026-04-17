<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Snackbar } from '@varlet/ui'
import { useI18n } from 'vue-i18n'
import { AddOutline, TrashOutline, RefreshOutline } from '@vicons/ionicons5'
import { allProviders } from '@plugins/providers/providers'

const { t } = useI18n()

const providerOptions = allProviders.map((p) => ({
  label: p.name,
  value: p.id
}))

const form = ref({
  provider: '',
  id: '',
  apiKey: '',
  baseUrl: '',
  enable: true
})

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
const modelList = ref<{ id: string }[]>([])
const modelsLoading = ref(false)
const enabledModelIds = ref<string[]>([])

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

function toggleModel(modelId: string, val: boolean) {
  if (val) {
    if (!enabledModelIds.value.includes(modelId)) enabledModelIds.value.push(modelId)
  } else {
    enabledModelIds.value = enabledModelIds.value.filter((id) => id !== modelId)
  }
}

function selectSource(source: SourceItem) {
  isNew.value = false
  selectedSourceId.value = source.id
  form.value.provider = source.provider
  form.value.id = source.id
  form.value.apiKey = source.apiKey
  form.value.baseUrl = source.baseUrl
  form.value.enable = source.enable
  modelList.value = []
  enabledModelIds.value = []
  loadCachedModels(source.id)
}

function clickNew() {
  isNew.value = true
  selectedSourceId.value = null
  form.value = { provider: '', id: '', apiKey: '', baseUrl: '', enable: true }
  modelList.value = []
  enabledModelIds.value = []
}

async function loadCachedModels(sourceId: string) {
  const config = await window.api.config.read()
  const sourceModels = config.provider?.filter((m: any) => m.provider_source_id === sourceId) || []
  modelList.value = sourceModels.map((m: any) => ({ id: m.model }))
  enabledModelIds.value = sourceModels.filter((m: any) => m.enable).map((m: any) => m.model)
}

async function refreshModels() {
  if (!form.value.provider || (!isOllama.value && !form.value.apiKey)) {
    return
  }

  modelsLoading.value = true
  try {
    const models = await window.api.models.fetch(form.value.provider, form.value.apiKey, form.value.baseUrl || undefined)
    modelList.value = models.map((model: string) => ({ id: model }))
  } catch {
    Snackbar.error(t('model.saveFailed'))
  } finally {
    modelsLoading.value = false
  }
}

async function saveSource() {
  if (!form.value.id) {
    Snackbar.warning(t('model.inputIdPlaceholder'))
    return
  }

  try {
    const config = await window.api.config.read()

    if (!config.provider_sources) config.provider_sources = {}
    if (!config.provider) config.provider = []

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

    for (const model of modelList.value) {
      const modelId = `${form.value.id}/${model.id}`
      const existingIndex = config.provider.findIndex((m: any) => m.id === modelId)

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
    Snackbar.success(t('model.saveSuccess'))

    isNew.value = false
    selectedSourceId.value = form.value.id
    savedSources.value = Object.entries(config.provider_sources).map(([id, val]: [string, any]) => ({
      id,
      provider: val.provider || '',
      apiKey: val.key?.[0] || '',
      baseUrl: val.api_base || '',
      enable: val.enable !== false
    }))
  } catch {
    Snackbar.error(t('model.saveFailed'))
  }
}

async function deleteSource(id: string) {
  const config = await window.api.config.read()
  delete config.provider_sources[id]
  config.provider = config.provider?.filter((m: any) => m.provider_source_id !== id) || []
  await window.api.config.write(config)

  savedSources.value = savedSources.value.filter((s) => s.id !== id)
  if (selectedSourceId.value === id) {
    clickNew()
  }
}

function onProviderChange(val: string | number) {
  const provider = allProviders.find((p) => p.id === val)
  if (provider) {
    form.value.baseUrl = provider.baseUrl
    if (isNew.value && !form.value.id) {
      form.value.id = String(val)
    }
  }
  modelList.value = []
}

const isOllama = computed(() => {
  const currentProvider = allProviders.find((p) => p.id === form.value.provider)
  return currentProvider?.id === 'ollama' || currentProvider?.name.toLowerCase().includes('ollama')
})
</script>

<template>
  <div class="chat-model-panel">
    <div class="split left-panel">
      <div
        v-for="source in savedSources"
        :key="source.id"
        class="source-item"
        :class="{ active: selectedSourceId === source.id }"
        @click="selectSource(source)"
      >
        <span class="source-name">{{ source.id }}</span>
        <var-button text round class="tiny-btn" @click.stop="deleteSource(source.id)">
          <component :is="TrashOutline" class="icon tiny" />
        </var-button>
      </div>

      <div class="add-source" :class="{ active: isNew }" @click="clickNew">
        <component :is="AddOutline" class="icon tiny" />
        <span>{{ t('model.addProvider') }}</span>
      </div>
    </div>

    <div class="split right-panel">
      <div class="right-content">
        <div class="field-grid">
          <label>{{ t('model.chatModel') }}</label>
          <var-select
            v-model:model-value="form.provider"
            :options="providerOptions"
            :placeholder="t('model.selectModel')"
            @change="onProviderChange"
          />

          <label>{{ t('model.inputId') }}</label>
          <var-input v-model:model-value="form.id" :placeholder="t('model.inputIdPlaceholder')" :disabled="!isNew" />

          <label>{{ t('model.apiKey') }}</label>
          <var-input v-model:model-value="form.apiKey" type="password" :placeholder="t('model.inputApiKey')" />

          <label>{{ t('model.baseUrl') }}</label>
          <var-input v-model:model-value="form.baseUrl" :placeholder="t('model.inputBaseUrl')" />
        </div>

        <div class="model-list-section">
          <div class="model-list-header">
            <span>{{ t('model.modelList') }}</span>
            <var-button
              size="small"
              :loading="modelsLoading"
              :disabled="!form.provider || (!isOllama && !form.apiKey)"
              @click="refreshModels"
            >
              <component :is="RefreshOutline" class="icon tiny" />
              {{ t('model.refresh') }}
            </var-button>
          </div>

          <div v-if="modelList.length" class="model-list">
            <div v-for="row in modelList" :key="row.id" class="model-row">
              <span class="model-id">{{ row.id }}</span>
              <var-switch
                :model-value="enabledModelIds.includes(row.id)"
                :active-value="true"
                :inactive-value="false"
                @change="(v) => toggleModel(row.id, Boolean(v))"
              />
            </div>
          </div>
          <div v-else class="model-empty">{{ t('model.refreshHint') }}</div>
        </div>

        <div class="panel-actions">
          <var-button type="primary" size="small" @click="saveSource">{{ t('model.save') }}</var-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-model-panel {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(220px, 32%) 1fr;
  gap: 12px;
}

.split {
  border: 1px solid var(--azusa-border);
  border-radius: 12px;
  background: var(--azusa-surface-soft);
  min-height: 0;
}

.left-panel {
  padding: 10px;
  overflow-y: auto;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.source-item:hover {
  background: var(--azusa-hover);
}

.source-item.active {
  background: var(--azusa-active);
}

.source-name {
  color: var(--azusa-text);
  font-size: 13px;
}

.add-source {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--azusa-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--azusa-text-soft);
}

.add-source:hover,
.add-source.active {
  border-color: var(--azusa-accent);
  color: var(--azusa-accent);
}

.right-panel {
  overflow: hidden;
}

.right-content {
  padding: 14px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.field-grid label {
  font-size: 13px;
  color: var(--azusa-text-soft);
}

.model-list-section {
  margin-top: 14px;
  border-top: 1px solid var(--azusa-border);
  padding-top: 12px;
}

.model-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--azusa-text);
  font-weight: 600;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-row {
  height: 38px;
  border-radius: 8px;
  padding: 0 10px;
  border: 1px solid var(--azusa-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-id {
  font-size: 13px;
  color: var(--azusa-text);
}

.model-empty {
  color: var(--azusa-text-soft);
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

.panel-actions {
  margin-top: 14px;
}

.tiny-btn {
  width: 24px;
  min-width: 24px;
}

.icon.tiny {
  width: 14px;
  height: 14px;
}

@media (max-width: 980px) {
  .chat-model-panel {
    grid-template-columns: 1fr;
  }
}
</style>
