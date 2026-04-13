<script setup lang="ts">
import { NConfigProvider, darkTheme } from 'naive-ui'
import MainInterface from './layout/index.vue'
import { useTheme } from './hook/useTheme'

const { activeTheme } = useTheme()
</script>

<template>
  <n-config-provider :theme="activeTheme === 'dark' ? darkTheme : undefined">
    <MainInterface />
  </n-config-provider>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
}

/* 默认浅色背景，深色由 JS 动态切换 */
body {
  background-color: #f5f5f5;
}
</style>
