<script setup lang="ts">
import MainInterface from './layout/index.vue'
</script>

<template>
  <MainInterface />
</template>

<style>
:root {
  --azusa-bg-gradient: linear-gradient(135deg, #fff1f8 0%, #f6e9ff 45%, #f2ebff 100%);
  --azusa-bg-gradient-dark: linear-gradient(145deg, #181a1f 0%, #1d2028 50%, #151820 100%);
  --azusa-surface: rgba(255, 255, 255, 0.76);
  --azusa-surface-strong: rgba(255, 255, 255, 0.92);
  --azusa-surface-soft: rgba(255, 255, 255, 0.6);
  --azusa-chip-bg: rgba(255, 255, 255, 0.45);
  --azusa-border: rgba(203, 158, 255, 0.3);
  --azusa-text: #473457;
  --azusa-text-soft: #7a618f;
  --azusa-accent: #cb6ce6;
  --azusa-accent-soft: #eab6ff;
  --azusa-hover: rgba(203, 108, 230, 0.12);
  --azusa-active: rgba(235, 184, 255, 0.34);
  --azusa-select-bg: rgba(255, 255, 255, 0.82);
  --azusa-select-menu-bg: rgba(255, 255, 255, 0.94);
  --azusa-shadow-soft: 0 10px 28px rgba(176, 122, 214, 0.16);
  --azusa-scrollbar-thumb: rgba(196, 142, 224, 0.7);
  --azusa-scrollbar-thumb-hover: rgba(176, 120, 208, 0.85);
  --azusa-scrollbar-track: rgba(255, 255, 255, 0.5);
}

:root[data-theme='dark'] {
  --azusa-surface: rgba(30, 34, 42, 0.78);
  --azusa-surface-strong: rgba(36, 40, 50, 0.92);
  --azusa-surface-soft: rgba(44, 50, 61, 0.72);
  --azusa-chip-bg: rgba(86, 94, 112, 0.32);
  --azusa-border: rgba(153, 140, 181, 0.24);
  --azusa-text: #e8eaf0;
  --azusa-text-soft: #a8afbf;
  --azusa-accent: #a990cc;
  --azusa-accent-soft: #8f7ab5;
  --azusa-hover: rgba(164, 142, 200, 0.14);
  --azusa-active: rgba(125, 140, 171, 0.28);
  --azusa-select-bg: rgba(47, 53, 66, 0.86);
  --azusa-select-menu-bg: rgba(41, 46, 58, 0.96);
  --azusa-shadow-soft: 0 12px 30px rgba(0, 0, 0, 0.34);
  --azusa-scrollbar-thumb: rgba(134, 146, 170, 0.62);
  --azusa-scrollbar-thumb-hover: rgba(156, 170, 196, 0.82);
  --azusa-scrollbar-track: rgba(41, 47, 58, 0.68);
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background: var(--azusa-bg-gradient);
  color: var(--azusa-text);
  transition: background 0.25s ease, color 0.25s ease;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--azusa-scrollbar-thumb) var(--azusa-scrollbar-track);
}

*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  background: var(--azusa-scrollbar-track);
  border-radius: 999px;
}

*::-webkit-scrollbar-thumb {
  background: var(--azusa-scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--azusa-scrollbar-thumb-hover);
  background-clip: padding-box;
}

:root[data-theme='dark'] body {
  background: var(--azusa-bg-gradient-dark);
}

.var-select {
  border-radius: 10px;
}

.var-select .var-field-decorator {
  border-radius: 10px;
  background: var(--azusa-select-bg);
  border: 1px solid var(--azusa-border);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.var-select .var-field-decorator:hover {
  border-color: var(--azusa-accent-soft);
}

.var-select:focus-within .var-field-decorator {
  border-color: var(--azusa-accent);
}

.var-select__scroller {
  background: var(--azusa-select-menu-bg);
  border: 1px solid var(--azusa-border);
  border-radius: 10px;
  box-shadow: none;
}

.var-option {
  border-radius: 8px;
}
</style>
