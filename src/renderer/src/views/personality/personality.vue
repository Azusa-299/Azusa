<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dialog } from '@varlet/ui'
import { Add, CreateOutline as EditIcon, TrashOutline as DeleteIcon } from '@vicons/ionicons5'

const { t } = useI18n()

const showModal = ref(false)
const isEditing = ref(false)
const editingCardId = ref<string | null>(null)
const activeCardId = ref<string | null>(null)

const formData = ref({
  userName: '',
  roleName: '',
  prompt: ''
})

const roleCards = ref<Array<{ id: string; userName: string; roleName: string; prompt: string }>>([])

const handleSave = () => {
  if (isEditing.value && editingCardId.value) {
    const index = roleCards.value.findIndex((card) => card.id === editingCardId.value)
    if (index !== -1) {
      roleCards.value[index] = {
        id: editingCardId.value,
        userName: formData.value.userName,
        roleName: formData.value.roleName,
        prompt: formData.value.prompt
      }
    }
  } else {
    roleCards.value.push({
      id: Date.now().toString(),
      userName: formData.value.userName,
      roleName: formData.value.roleName,
      prompt: formData.value.prompt
    })
  }

  showModal.value = false
  isEditing.value = false
  editingCardId.value = null
  formData.value = { userName: '', roleName: '', prompt: '' }
}

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

const handleDelete = async (cardId: string) => {
  try {
    await Dialog({
      title: t('personality.deleteTitle'),
      message: t('personality.confirmDelete'),
      confirmButtonText: t('personality.confirm'),
      cancelButtonText: t('personality.cancel'),
      cancelButton: true
    })

    const index = roleCards.value.findIndex((card) => card.id === cardId)
    if (index !== -1) {
      roleCards.value.splice(index, 1)
    }
    if (activeCardId.value === cardId) {
      activeCardId.value = null
    }
  } catch {
    // canceled
  }
}

const handleEnable = (cardId: string, enabled: boolean) => {
  if (!enabled) {
    activeCardId.value = null
    return
  }
  activeCardId.value = cardId
}

const maxLength = 50
const truncateText = (text: string) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
</script>

<template>
  <div class="personality-header">
    <h2 class="personality-title">{{ t('personality.title') }}</h2>
    <var-button text round class="icon-btn" @click="showModal = true">
      <component :is="Add" class="icon" />
    </var-button>
  </div>

  <div class="cards-container">
    <var-card v-for="card in roleCards" :key="card.id" :title="card.roleName" class="role-card">
      <div class="card-content">{{ truncateText(card.prompt) }}</div>

      <template #extra>
        <div class="card-actions">
          <var-switch
            :model-value="activeCardId === card.id"
            :active-value="true"
            :inactive-value="false"
            @change="(val) => handleEnable(card.id, Boolean(val))"
          />
          <div class="card-actions-right">
            <var-button text round class="icon-btn" @click="handleEdit(card)">
              <component :is="EditIcon" class="icon small" />
            </var-button>
            <var-button text round class="icon-btn danger" @click="handleDelete(card.id)">
              <component :is="DeleteIcon" class="icon small" />
            </var-button>
          </div>
        </div>
      </template>
    </var-card>
  </div>

  <var-popup v-model:show="showModal" position="center" :close-on-click-overlay="false" class="popup-wrap">
    <div class="modal-card">
      <h3 class="modal-title">{{ isEditing ? t('personality.editCard') : t('personality.roleCard') }}</h3>

      <div class="modal-form">
        <label>{{ t('personality.userName') }}</label>
        <var-input v-model:model-value="formData.userName" :placeholder="t('personality.userNamePlaceholder')" />

        <label>{{ t('personality.roleName') }}</label>
        <var-input v-model:model-value="formData.roleName" :placeholder="t('personality.roleNamePlaceholder')" />

        <label>{{ t('personality.prompt') }}</label>
        <var-input
          v-model:model-value="formData.prompt"
          textarea
          :rows="4"
          :placeholder="t('personality.promptPlaceholder')"
        />
      </div>

      <div class="modal-actions">
        <var-button block type="primary" @click="handleSave">{{ t('personality.save') }}</var-button>
      </div>
    </div>
  </var-popup>
</template>

<style scoped>
.personality-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.personality-title {
  margin: 0;
  color: var(--azusa-text);
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.role-card {
  width: 280px;
  border: 1px solid var(--azusa-border);
  background: var(--azusa-surface-soft);
}

.card-content {
  min-height: 48px;
  color: var(--azusa-text);
  line-height: 1.5;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-actions-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  width: 30px;
  min-width: 30px;
  color: var(--azusa-text-soft);
}

.icon-btn.danger {
  color: #ca5583;
}

.icon {
  width: 18px;
  height: 18px;
}

.icon.small {
  width: 16px;
  height: 16px;
}

.popup-wrap :deep(.var-popup__content) {
  background: transparent;
  box-shadow: none;
}

.modal-card {
  width: min(520px, 92vw);
  border-radius: 14px;
  border: 1px solid var(--azusa-border);
  background: var(--azusa-surface-strong);
  padding: 18px;
  box-sizing: border-box;
}

.modal-title {
  margin: 0 0 12px;
  color: var(--azusa-text);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-form label {
  font-size: 13px;
  color: var(--azusa-text-soft);
}

.modal-actions {
  margin-top: 14px;
}
</style>
