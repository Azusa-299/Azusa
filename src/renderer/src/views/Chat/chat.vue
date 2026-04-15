<script setup lang="ts">
import { ref } from 'vue'
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
import { Menu, Send, Add, ChatbubblesOutline, TrashOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const drawerActive = ref(false)
const placement = ref<DrawerPlacement>('right')

const inputValue = ref('')

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// 当前激活的会话ID
const currentSessionId = ref<string>('')

// 会话列表
const sessions = ref<ChatSession[]>([])

// 当前会话的消息
const messages = ref<ChatMessage[]>([])

// 选择模型
const selectedOption = ref<string>('')
const selectOptions = ref([
  { label: '选项1', value: 'option1' },
  { label: '选项2', value: 'option2' },
  { label: '选项3', value: 'option3' }
])

// 初始化：创建默认会话
function initSessions() {
  if (sessions.value.length === 0) {
    const defaultSession: ChatSession = {
      id: Date.now().toString(),
      title: t('chat.newConversation'),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    sessions.value.push(defaultSession)
    currentSessionId.value = defaultSession.id
  }
}

// 新建会话
function createNewChat() {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: t('chat.newConversation'),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  sessions.value.unshift(newSession)
  currentSessionId.value = newSession.id
  messages.value = []
  inputValue.value = ''
  drawerActive.value = false
}

// 切换会话
function switchSession(sessionId: string) {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    currentSessionId.value = sessionId
    messages.value = [...session.messages]
    drawerActive.value = false
  }
}

// 删除会话
function deleteSession(sessionId: string) {
  const index = sessions.value.findIndex(s => s.id === sessionId)
  if (index > -1) {
    sessions.value.splice(index, 1)

    // 如果删除的是当前会话
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        // 切换到第一个会话
        currentSessionId.value = sessions.value[0].id
        messages.value = [...sessions.value[0].messages]
      } else {
        // 没有会话了，创建新会话
        createNewChat()
      }
    }
  }
}

// 更新当前会话
function updateCurrentSession() {
  const session = sessions.value.find(s => s.id === currentSessionId.value)
  if (session) {
    session.messages = [...messages.value]
    session.updatedAt = new Date()
    // 自动生成标题（取第一条用户消息的前20个字符）
    if (session.title === t('chat.newConversation') && messages.value.length > 0) {
      const firstUserMsg = messages.value.find(m => m.role === 'user')
      if (firstUserMsg) {
        session.title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
      }
    }
  }
}

function sendMessage() {
  const text = inputValue.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text })
  inputValue.value = ''
  updateCurrentSession()
  // 模拟AI回复（实际项目中这里应该调用API）
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: t('chat.mockReply') 
    })
    updateCurrentSession()
  }, 500)
}

// 格式化时间
function formatTime(date: Date): string {
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
initSessions()
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
          style="width: 100px; margin-right: 8px"
          />
        <n-input
          v-model:value="inputValue"
          :placeholder="t('chat.inputPlaceholder')"
          :bordered="false"
          round
          clearable
          @keyup.enter="sendMessage"
        />
        <n-button
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
  width: 500px;
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