<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Menu, Send, Add, ChatbubblesOutline, TrashOutline, StopCircleOutline } from '@vicons/ionicons5'

const { t } = useI18n()

const drawerActive = ref(false)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  sourceId: string
  modelId: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const inputValue = ref('')
const currentSessionId = ref<string>('')
const sessions = ref<ChatSession[]>([])
const messages = ref<ChatMessage[]>([])
const isStreaming = ref(false)

const selectedOption = ref<string>('')
const selectOptions = ref<{ label: string; value: string }[]>([])

async function saveCurrentSession() {
  if (!currentSessionId.value) return
  const session = sessions.value.find((s) => s.id === currentSessionId.value)
  if (!session) return

  session.messages = [...messages.value]
  const [sourceId, modelId] = selectedOption.value.split('/')
  session.sourceId = sourceId || ''
  session.modelId = modelId || ''

  if (session.title === t('chat.newConversation') && messages.value.length > 0) {
    const firstUserMsg = messages.value.find((m) => m.role === 'user')
    if (firstUserMsg) {
      session.title = `${firstUserMsg.content.slice(0, 20)}${firstUserMsg.content.length > 20 ? '...' : ''}`
    }
  }

  await window.api.sessions.write(
    JSON.parse(
      JSON.stringify({
        id: session.id,
        title: session.title,
        sourceId: session.sourceId,
        modelId: session.modelId,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: Date.now()
      })
    )
  )
}

async function createNewChat() {
  if (currentSessionId.value) {
    await saveCurrentSession()
  }

  const [sourceId, modelId] = selectedOption.value.split('/')
  const newSession: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: t('chat.newConversation'),
    sourceId: sourceId || '',
    modelId: modelId || '',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  await window.api.sessions.write(newSession)
  sessions.value.unshift(newSession)
  currentSessionId.value = newSession.id
  messages.value = []
  inputValue.value = ''
  drawerActive.value = false
}

async function switchSession(sessionId: string) {
  await saveCurrentSession()
  const session = sessions.value.find((s) => s.id === sessionId)
  if (!session) return

  const fullSession = await window.api.sessions.read(sessionId)
  if (fullSession) {
    session.messages = fullSession.messages || []
  }

  currentSessionId.value = sessionId
  messages.value = [...session.messages]

  if (session.sourceId && session.modelId) {
    const optionValue = `${session.sourceId}/${session.modelId}`
    if (selectOptions.value.some((o) => o.value === optionValue)) {
      selectedOption.value = optionValue
    }
  }

  drawerActive.value = false
}

async function deleteSession(sessionId: string) {
  await window.api.sessions.delete(sessionId)
  const index = sessions.value.findIndex((s) => s.id === sessionId)
  if (index > -1) {
    sessions.value.splice(index, 1)
  }

  if (currentSessionId.value === sessionId) {
    if (sessions.value.length > 0) {
      await switchSession(sessions.value[0].id)
    } else {
      createNewChat()
    }
  }
}

async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text) return

  messages.value.push({ role: 'user', content: text })
  inputValue.value = ''

  messages.value.push({ role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1
  isStreaming.value = true

  const [sourceId, modelId] = selectedOption.value.split('/')
  const session = sessions.value.find((s) => s.id === currentSessionId.value)
  if (session) {
    session.sourceId = sourceId || ''
    session.modelId = modelId || ''
  }

  window.api.chat.onChunk((chunk: string) => {
    messages.value[assistantIndex].content += chunk
  })

  window.api.chat.onEnd(async () => {
    isStreaming.value = false
    await saveCurrentSession()
    window.api.chat.removeAllListeners()
  })

  window.api.chat.onError(async (err: string) => {
    isStreaming.value = false
    messages.value[assistantIndex].content += `\n[请求失败: ${err}]`
    await saveCurrentSession()
    window.api.chat.removeAllListeners()
  })

  await window.api.chat.stream({
    sourceId,
    modelId,
    messages: JSON.parse(JSON.stringify(messages.value.slice(0, -1)))
  })
}

function stopStreaming() {
  window.api.chat.abort()
  setTimeout(async () => {
    if (isStreaming.value) {
      isStreaming.value = false
      await saveCurrentSession()
      window.api.chat.removeAllListeners()
    }
  }, 1000)
}

onUnmounted(async () => {
  await saveCurrentSession()
  window.api.chat.removeAllListeners()
})

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) {
    return t('chat.yesterday')
  }
  if (days < 7) {
    return t('chat.daysAgo', { days })
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

onMounted(async () => {
  const config = await window.api.config.read()
  const models: any[] = config.provider || []
  const sources: Record<string, any> = config.provider_sources || {}
  const opts: { label: string; value: string }[] = []

  for (const model of models) {
    if (!model.enable) continue
    const source = sources[model.provider_source_id]
    if (!source?.enable) continue
    opts.push({
      label: model.model,
      value: `${model.provider_source_id}/${model.model}`
    })
  }

  selectOptions.value = opts
  if (opts.length) selectedOption.value = opts[0].value

  const allSessions: any[] = await window.api.sessions.list()
  sessions.value = allSessions

  if (sessions.value.length > 0) {
    const latest = sessions.value[0]
    currentSessionId.value = latest.id
    const fullSession = await window.api.sessions.read(latest.id)
    if (fullSession) {
      latest.messages = fullSession.messages || []
      messages.value = [...latest.messages]
    }

    if (latest.sourceId && latest.modelId) {
      const optionValue = `${latest.sourceId}/${latest.modelId}`
      if (opts.some((o) => o.value === optionValue)) {
        selectedOption.value = optionValue
      }
    }
  } else {
    createNewChat()
  }
})
</script>

<template>
  <div class="chat-container">
    <header class="chat-header">
      <var-button text round class="icon-btn" @click="drawerActive = true">
        <component :is="Menu" class="icon" />
      </var-button>
      <var-button text round class="icon-btn" @click="createNewChat">
        <component :is="Add" class="icon" />
      </var-button>
    </header>

    <div class="chat-body">
      <div class="messages-list">
        <template v-if="messages.length">
          <div v-for="(msg, i) in messages" :key="i" :class="['msg-row', msg.role]">
            <div :class="['msg-bubble', msg.role]">{{ msg.content }}</div>
          </div>
        </template>
        <div v-else class="chat-empty">{{ t('chat.startConversation') }}</div>
      </div>
    </div>

    <div class="chat-footer">
      <div class="input-box">
        <var-select v-model:model-value="selectedOption" :options="selectOptions" style="width: 180px" />

        <var-input
          v-model:model-value="inputValue"
          :placeholder="t('chat.inputPlaceholder')"
          clearable
          @keyup.enter="!isStreaming && sendMessage()"
        />

        <var-button v-if="isStreaming" text round class="icon-btn danger" @click="stopStreaming">
          <component :is="StopCircleOutline" class="icon" />
        </var-button>
        <var-button v-else text round class="icon-btn primary" :disabled="!inputValue.trim()" @click="sendMessage">
          <component :is="Send" class="icon" />
        </var-button>
      </div>
    </div>

    <var-popup v-model:show="drawerActive" position="right" class="drawer-popup">
      <div class="drawer-content">
        <div class="drawer-header">
          <var-button block type="primary" @click="createNewChat">
            <component :is="Add" class="icon tiny" />
            {{ t('chat.newConversation') }}
          </var-button>
        </div>

        <div class="sessions-list">
          <div
            v-for="session in sessions"
            :key="session.id"
            :class="['session-item', { active: currentSessionId === session.id }]"
            @click="switchSession(session.id)"
          >
            <div class="session-icon"><component :is="ChatbubblesOutline" class="icon tiny" /></div>
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-meta">
                <span>{{ formatTime(session.updatedAt) }}</span>
                <span>{{ session.messages.length }} {{ t('chat.messageCount') }}</span>
              </div>
            </div>
            <var-button text round class="icon-btn tiny-btn" @click.stop="deleteSession(session.id)">
              <component :is="TrashOutline" class="icon tiny" />
            </var-button>
          </div>

          <div v-if="sessions.length === 0" class="chat-empty">{{ t('chat.emptyConversations') }}</div>
        </div>
      </div>
    </var-popup>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  flex-shrink: 0;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.messages-list {
  max-width: 760px;
  margin: 0 auto;
  padding: 14px 18px;
}

.msg-row {
  display: flex;
  margin-bottom: 10px;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 72%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-bubble.user {
  background: linear-gradient(135deg, var(--azusa-accent) 0%, var(--azusa-accent-soft) 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-bubble.assistant {
  background-color: var(--azusa-surface-soft);
  color: var(--azusa-text);
  border: 1px solid var(--azusa-border);
  border-bottom-left-radius: 4px;
}

.chat-empty {
  text-align: center;
  color: var(--azusa-text-soft);
  padding: 40px 0;
}

.chat-footer {
  flex-shrink: 0;
  padding: 8px 12px 12px;
}

.input-box {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 8px;
  align-items: center;
  border-radius: 14px;
  background: var(--azusa-surface-soft);
  border: 1px solid var(--azusa-border);
  padding: 8px;
}

.icon-btn {
  width: 32px;
  min-width: 32px;
  color: var(--azusa-text-soft);
}

.icon-btn.primary {
  color: #9f4ace;
}

.icon-btn.danger {
  color: #cb4f7d;
}

.icon-btn.tiny-btn {
  width: 24px;
  min-width: 24px;
}

.icon {
  width: 18px;
  height: 18px;
}

.icon.tiny {
  width: 14px;
  height: 14px;
}

.drawer-popup :deep(.var-popup__content) {
  width: min(360px, 92vw);
  height: 100%;
  background: var(--azusa-surface-strong);
}

.drawer-content {
  height: 100%;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  margin-bottom: 10px;
}

.sessions-list {
  overflow-y: auto;
  flex: 1;
}

.session-item {
  cursor: pointer;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.session-item:hover {
  background: var(--azusa-hover);
}

.session-item.active {
  background: var(--azusa-active);
}

.session-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--azusa-chip-bg);
  color: var(--azusa-text-soft);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  color: var(--azusa-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--azusa-text-soft);
}

@media (max-width: 900px) {
  .input-box {
    grid-template-columns: 1fr;
  }
}
</style>
