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
