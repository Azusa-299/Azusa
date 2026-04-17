<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NIcon,
  NInput,
  NInfiniteScroll,
  NList,
  NListItem,
  NEmpty,
  NSelect
} from 'naive-ui'
import type { DrawerPlacement } from 'naive-ui'
import { Menu, Send, Add, ChatbubblesOutline, TrashOutline, StopCircleOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const drawerActive = ref(false)
const placement = ref<DrawerPlacement>('right')

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

// 输入框
const inputValue = ref('')

// 当前激活的会话ID
const currentSessionId = ref<string>('')

// 会话列表（摘要，不含 messages）
const sessions = ref<ChatSession[]>([])

// 当前会话的消息
const messages = ref<ChatMessage[]>([])

// 是否正在流式输出
const isStreaming = ref(false)

// 选择模型
const selectedOption = ref<string>('')
const selectOptions = ref<{ label: string; value: string }[]>([])

// 保存当前会话到磁盘
async function saveCurrentSession() {
  if (!currentSessionId.value) return
  const session = sessions.value.find(s => s.id === currentSessionId.value)
  if (!session) return

  // 同步最新消息和模型
  session.messages = [...messages.value]
  const [sourceId, modelId] = selectedOption.value.split('/')
  session.sourceId = sourceId || ''
  session.modelId = modelId || ''

  // 自动生成标题
  if (session.title === t('chat.newConversation') && messages.value.length > 0) {
    const firstUserMsg = messages.value.find(m => m.role === 'user')
    if (firstUserMsg) {
      session.title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
    }
  }

  await window.api.sessions.write(JSON.parse(JSON.stringify({
    id: session.id,
    title: session.title,
    sourceId: session.sourceId,
    modelId: session.modelId,
    messages: session.messages,
    createdAt: session.createdAt,
    updatedAt: Date.now()
  })))
}

// 新建会话
async function createNewChat() {
  // 先保存当前会话
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
  // 写入磁盘
  await window.api.sessions.write(newSession)
  sessions.value.unshift(newSession)
  currentSessionId.value = newSession.id
  messages.value = []
  inputValue.value = ''
  drawerActive.value = false
}

// 切换会话
async function switchSession(sessionId: string) {
  // 先保存当前会话
  await saveCurrentSession()

  const session = sessions.value.find(s => s.id === sessionId)
  if (!session) return

  // 从磁盘加载完整消息
  const fullSession = await window.api.sessions.read(sessionId)
  if (fullSession) {
    session.messages = fullSession.messages || []
  }

  currentSessionId.value = sessionId
  messages.value = [...session.messages]

  // 回填模型选择
  if (session.sourceId && session.modelId) {
    const optionValue = `${session.sourceId}/${session.modelId}`
    if (selectOptions.value.some(o => o.value === optionValue)) {
      selectedOption.value = optionValue
    }
  }

  drawerActive.value = false
}

// 删除会话
async function deleteSession(sessionId: string) {
  await window.api.sessions.delete(sessionId)
  const index = sessions.value.findIndex(s => s.id === sessionId)
  if (index > -1) {
    sessions.value.splice(index, 1)
  }

  // 如果删除的是当前会话
  if (currentSessionId.value === sessionId) {
    if (sessions.value.length > 0) {
      await switchSession(sessions.value[0].id)
    } else {
      createNewChat()
    }
  }
}

// 发送消息
async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text })
  inputValue.value = ''

  // 添加空的 assistant 消息用于流式填充
  messages.value.push({ role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1
  isStreaming.value = true

  // 解析选择的模型：格式为 sourceId/modelId
  const [sourceId, modelId] = selectedOption.value.split('/')

  // 更新当前会话的模型信息
  const session = sessions.value.find(s => s.id === currentSessionId.value)
  if (session) {
    session.sourceId = sourceId || ''
    session.modelId = modelId || ''
  }

  // 设置流式回调
  window.api.chat.onChunk((chunk: string) => {
    messages.value[assistantIndex].content += chunk
  })

  // 设置流式结束回调
  window.api.chat.onEnd(async () => {
    isStreaming.value = false
    await saveCurrentSession()
    window.api.chat.removeAllListeners()
  })

  // 设置流式错误回调
  window.api.chat.onError(async (err: string) => {
    isStreaming.value = false
    messages.value[assistantIndex].content += `\n[请求失败: ${err}]`
    await saveCurrentSession()
    window.api.chat.removeAllListeners()
  })

  // 发起流式请求（apiKey 和 baseUrl 由主进程从 config 读取）
  await window.api.chat.stream({
    sourceId,
    modelId,
    messages: JSON.parse(JSON.stringify(messages.value.slice(0, -1)))
  })
}

// 停止流式输出
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

// 组件卸载时保存并清理
onUnmounted(async () => {
  await saveCurrentSession()
  window.api.chat.removeAllListeners()
})

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return t('chat.yesterday')
  } else if (days < 7) {
    return t('chat.daysAgo', { days })
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

// 初始化
onMounted(async () => {
  // 1. 加载模型列表
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

  // 2. 加载会话列表
  const allSessions: any[] = await window.api.sessions.list()
  sessions.value = allSessions

  // 3. 选中最近会话或创建新会话
  if (sessions.value.length > 0) {
    const latest = sessions.value[0]
    currentSessionId.value = latest.id
    const fullSession = await window.api.sessions.read(latest.id)
    if (fullSession) {
      latest.messages = fullSession.messages || []
      messages.value = [...latest.messages]
    }
    // 回填模型选择
    if (latest.sourceId && latest.modelId) {
      const optionValue = `${latest.sourceId}/${latest.modelId}`
      if (opts.some(o => o.value === optionValue)) {
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
    <!-- 顶部：抽屉按钮 + 新建会话按钮 -->
    <header class="chat-header">
      <n-button quaternary circle size="small" @click="drawerActive = true">
        <template #icon>
          <n-icon :size="18"><Menu /></n-icon>
        </template>
      </n-button>
      <n-button quaternary circle size="small" @click="createNewChat">
        <template #icon>
          <n-icon :size="18"><Add /></n-icon>
        </template>
      </n-button>
    </header>

    <!-- 中间：对话内容区，无限滚动 -->
    <div class="chat-body">
      <n-infinite-scroll :distance="10" class="infinite-scroll-wrapper">
        <div class="messages-list">
          <template v-if="messages.length">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              :class="['msg-row', msg.role]"
            >
              <div :class="['msg-bubble', msg.role]">{{ msg.content }}</div>
            </div>
          </template>
          <div v-else class="chat-empty">{{ t('chat.startConversation') }}</div>
        </div>
      </n-infinite-scroll>
    </div>

    <!-- 底部：输入框 + 发送按钮，固定底部居中 -->
    <div class="chat-footer">
      <div class="input-box">
         <n-select
          v-model:value="selectedOption"
          :options="selectOptions"
          placeholder="选择"
          type="textarea"
          size="medium"
          style="width: 160px; margin-right: 8px"
          />
        <n-input
          v-model:value="inputValue"
          :placeholder="t('chat.inputPlaceholder')"
          :bordered="false"
          round
          clearable
          @keyup.enter="!isStreaming && sendMessage()"
        />
        <!-- 流式输出中显示停止按钮，否则显示发送按钮 -->
        <n-button
          v-if="isStreaming"
          quaternary
          circle
          size="small"
          type="error"
          @click="stopStreaming"
        >
          <template #icon>
            <n-icon :size="18"><StopCircleOutline /></n-icon>
          </template>
        </n-button>
        <n-button
          v-else
          quaternary
          circle
          size="small"
          type="primary"
          :disabled="!inputValue.trim()"
          @click="sendMessage"
        >
          <template #icon>
            <n-icon :size="18"><Send /></n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 右侧抽屉：会话管理 -->
    <n-drawer v-model:show="drawerActive" :placement="placement" :width="320">
      <n-drawer-content :title="t('chat.conversationManage')" closable>
        <div class="drawer-header">
          <n-button type="primary" block @click="createNewChat">
            <template #icon>
              <n-icon :size="16"><Add /></n-icon>
            </template>
            {{ t('chat.newConversation') }}
          </n-button>
        </div>

        <div class="sessions-list">
          <n-list v-if="sessions.length > 0">
            <n-list-item
              v-for="session in sessions"
              :key="session.id"
              :class="['session-item', { active: currentSessionId === session.id }]"
              @click="switchSession(session.id)"
            >
              <div class="session-content">
                <div class="session-icon">
                  <n-icon :size="18"><ChatbubblesOutline /></n-icon>
                </div>
                <div class="session-info">
                  <div class="session-title">{{ session.title }}</div>
                  <div class="session-meta">
                    <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
                    <span class="session-count">{{ session.messages.length }} {{ t('chat.messageCount') }}</span>
                  </div>
                </div>
                <n-button
                  quaternary
                  circle
                  size="tiny"
                  class="delete-btn"
                  @click.stop="deleteSession(session.id)"
                >
                  <template #icon>
                    <n-icon :size="14"><TrashOutline /></n-icon>
                  </template>
                </n-button>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else :description="t('chat.emptyConversations')" class="empty-state" />
        </div>
      </n-drawer-content>
    </n-drawer>
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
  padding: 8px 16px;
  flex-shrink: 0;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.infinite-scroll-wrapper {
  height: 100%;
  overflow-y: auto;
}

.messages-list {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 24px;
}

.msg-row {
  display: flex;
  margin-bottom: 12px;
}

.msg-row.user {
  justify-content: flex-end;
}

.msg-row.assistant {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-bubble.user {
  background-color: var(--n-color-primary, #18a058);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-bubble.assistant {
  background-color: var(--n-color-modal);
  color: var(--n-text-color);
  border-bottom-left-radius: 4px;
  position: relative;

  border: 1px solid #218e00;
  border-radius: 12px 12px 12px 4px;
}

.chat-empty {
  text-align: center;
  padding: 120px 0;
  color: var(--n-text-color-disabled);
}

.chat-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 8px 24px 16px;
}

.input-box {
  display: flex;
  align-items: center;
  width: 650px;
  max-width: 100%;
  padding: 6px 6px 6px 16px;
  border-radius: 24px;
  background-color: var(--n-color-modal);
  border: 1px solid var(--n-border-color);
}

.input-box :deep(.n-select) {
  flex-shrink: 0;
  margin-right: 8px;
}

/* 抽屉样式 */
.drawer-header {
  margin-bottom: 16px;
}

.sessions-list {
  margin-top: 8px;
}

.session-item {
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.session-item:hover {
  background-color: var(--n-color-modal);
}

.session-item.active {
  background-color: var(--n-color-primary-hover);
}

.session-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.session-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: var(--n-color-modal);
  color: var(--n-text-color-secondary);
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.session-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--n-text-color-disabled);
}

.session-time,
.session-count {
  display: inline-block;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.empty-state {
  margin-top: 60px;
}
</style>
