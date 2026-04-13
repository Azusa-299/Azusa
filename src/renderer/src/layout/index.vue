<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NMenu } from 'naive-ui'
import { ref } from 'vue'

const menuOptions = ref([
    { label: '欢迎', key: 'welcome' },
    { label: '对话', key: 'chat'    },
    { label: '模型', key: 'model'   },
    { label: '设置', key: 'setting' },
    { label: '关于', key: 'about'   },
])

const defaultExpandedKeys = ref([])

const handleUpdateExpandedKeys = (keys: string[]) => {
    console.log('Expanded keys updated:', keys)
}
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column;">
    <n-layout style="height: 100%;">
      <!-- 顶部标题栏 -->
      <n-layout-header bordered>
        <div style="padding: 0 20px; height: 64px; line-height: 64px; font-size: 18px; font-weight: bold;">
          Azusa v0.0.1
        </div>
      </n-layout-header>

      <!-- 主体区域：左侧菜单 + 右侧内容 -->
      <div style="flex: 1; display: flex; overflow: hidden;">
        <!-- 左侧菜单 -->
        <n-layout-sider
          bordered
          show-trigger
          collapse-mode="width"
          :collapsed-width="64"
          :width="240"
          :native-scrollbar="false"
        >
          <n-menu
            style="height: 100%; padding: 20px 0;"
            :options="menuOptions"
            :default-expanded-keys="defaultExpandedKeys"
            @update:expanded-keys="handleUpdateExpandedKeys"
          />
        </n-layout-sider>

        <!-- 右侧内容区域 -->
        <n-layout-content embedded content-style="padding: 20px;">
          <div>
            <slot></slot>
          </div>
        </n-layout-content>
      </div>
    </n-layout>
  </div>
</template>

<style scoped>
</style>