<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NModal, NForm, NFormItem, NInput, NCard, NSwitch, useDialog } from 'naive-ui'
import { Add, CreateOutline as EditIcon, TrashOutline as DeleteIcon } from '@vicons/ionicons5'

const { t } = useI18n()
const dialog = useDialog()

const showModal = ref(false)
const isEditing = ref(false)
const editingCardId = ref<string | null>(null)
const activeCardId = ref<string | null>(null)

const formData = ref({
  userName: '',
  roleName: '',
  prompt: ''
})

// 角色卡片列表
const roleCards = ref<Array<{ id: string; userName: string; roleName: string; prompt: string }>>([])

// 保存角色卡片
const handleSave = () => {
  if (isEditing.value && editingCardId.value) {
    const index = roleCards.value.findIndex(card => card.id === editingCardId.value)
    if (index !== -1) {
      roleCards.value[index] = {
        id: editingCardId.value,
        userName: formData.value.userName,
        roleName: formData.value.roleName,
        prompt: formData.value.prompt
      }
    }
  } else {
    const newCard = {
      id: Date.now().toString(),
      userName: formData.value.userName,
      roleName: formData.value.roleName,
      prompt: formData.value.prompt
    }
    roleCards.value.push(newCard)
  }
  showModal.value = false
  isEditing.value = false
  editingCardId.value = null
  formData.value = { userName: '', roleName: '', prompt: '' }
}

// 编辑角色卡片
const handleEdit = (card: { id: string; userName: string; roleName: string; prompt: string }) => {
  isEditing.value = true
  editingCardId.value = card.id
  formData.value = {
    userName: card.userName,
    roleName: card.roleName,
    prompt: card.prompt
  }
  showModal.value = true
}

// 删除角色卡片
const handleDelete = (cardId: string) => {
  dialog.warning({
    title: t('personality.deleteTitle'),
    content: t('personality.confirmDelete'),
    positiveText: t('personality.confirm'),
    negativeText: t('personality.cancel'),
    onPositiveClick: () => {
      const index = roleCards.value.findIndex(card => card.id === cardId)
      if (index !== -1) {
        roleCards.value.splice(index, 1)
      }
      if (activeCardId.value === cardId) {
        activeCardId.value = null
      }
    }
  })
}

// 启用/禁用角色卡片
const handleEnable = (cardId: string) => {
  if (activeCardId.value === cardId) {
    activeCardId.value = null
  } else {
    activeCardId.value = cardId
  }
}

// 截断文本
const maxLength = 50
const truncateText = (text: string) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
</script>

<template>
  <div class="personality">
    <h2 class="personality-title">{{ t('personality.title') }}</h2>
    <n-button quaternary circle size="small" style="margin-left: auto;" @click="showModal = true">
      <template #icon>
        <n-icon :size="18"><Add /></n-icon>
      </template>
    </n-button>
  </div>

  <!-- 角色卡片列表 -->
  <div class="cards-container">
    <n-card v-for="card in roleCards" :key="card.id" :title="card.roleName" class="role-card">
      <div class="card-content">
        {{ truncateText(card.prompt) }}
      </div>
      <template #action>
        <div class="card-actions">
          <div class="card-actions-left">
            <n-switch :value="activeCardId === card.id" @update:value="handleEnable(card.id)" />
          </div>
          <div class="card-actions-right">
            <n-button quaternary circle size="small" @click="handleEdit(card)">
              <template #icon>
                <n-icon :size="18"><EditIcon /></n-icon>
              </template>
            </n-button>
            <n-button quaternary circle size="small" type="error" @click="handleDelete(card.id)">
              <template #icon>
                <n-icon :size="18"><DeleteIcon /></n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </template>
    </n-card>
  </div>

  <!-- 角色卡片配置弹窗 -->
  <n-modal v-model:show="showModal" preset="card" :title="isEditing ? t('personality.editCard') : t('personality.roleCard')" style="width: 480px;">
    <n-form>
      <n-form-item :label="t('personality.userName')">
        <n-input v-model:value="formData.userName" :placeholder="t('personality.userNamePlaceholder')" />
      </n-form-item>
      <n-form-item :label="t('personality.roleName')">
        <n-input v-model:value="formData.roleName" :placeholder="t('personality.roleNamePlaceholder')" />
      </n-form-item>
      <n-form-item :label="t('personality.prompt')">
        <n-input
          v-model:value="formData.prompt"
          type="textarea"
          :placeholder="t('personality.promptPlaceholder')"
          :rows="4"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-button type="primary" block @click="handleSave">{{ t('personality.save') }}</n-button>
    </template>
  </n-modal>
</template>

<style scoped>
.personality {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 20px;
}

.role-card {
  width: 280px;
  transition: all 0.3s ease;
}

.role-card :deep(.n-card__action) {
  padding: 8px 12px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions-left {
  display: flex;
  align-items: center;
}

.card-actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  white-space: normal;
  line-height: 1.5;
  max-height: 4.5em;
}

.card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.card-value {
  font-size: 14px;
  color: var(--n-text-color);
}
</style>
