import { computed, ref, watch } from 'vue'
import { StyleProvider, Themes, type StyleVars } from '@varlet/ui'

export type ThemeMode = 'light' | 'dark' | 'auto'

const currentTheme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'auto')
const activeTheme = ref<'light' | 'dark'>('light')

let mediaQuery: MediaQueryList | null = null

function applyVarletTheme(mode: 'light' | 'dark') {
  const base = mode === 'dark' ? Themes.md3Dark : Themes.md3Light
  const custom: StyleVars = {
    ...base,
    colorPrimary: mode === 'dark' ? '#a990cc' : '#cb6ce6',
    colorPrimaryContainer: mode === 'dark' ? '#343047' : '#f4d6ff',
    colorOnPrimaryContainer: mode === 'dark' ? '#e5e0f0' : '#4b2a60',
    colorSurfaceContainer: mode === 'dark' ? '#232831' : '#fff7fc',
    colorSurfaceContainerLow: mode === 'dark' ? '#1d222b' : '#fff2fa',
    colorSurfaceContainerHigh: mode === 'dark' ? '#2a303a' : '#fbe8ff',
    colorOutline: mode === 'dark' ? '#5e6675' : '#d4a9e6'
  }

  StyleProvider(custom)
}

function resolveAutoTheme() {
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  }
  return mediaQuery.matches ? 'dark' : 'light'
}

function compute(theme: ThemeMode) {
  const resolved = theme === 'auto' ? resolveAutoTheme() : theme
  activeTheme.value = resolved
  document.documentElement.setAttribute('data-theme', resolved)
  localStorage.setItem('theme', theme)
  applyVarletTheme(resolved)
}

watch(
  currentTheme,
  (theme) => {
    compute(theme)
  },
  { immediate: true }
)

if (typeof window !== 'undefined') {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (currentTheme.value === 'auto') {
      compute('auto')
    }
  })
}

export function useTheme() {
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme
  }

  const toggleTheme = () => {
    const map: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light'
    }
    currentTheme.value = map[currentTheme.value]
  }

  const isDark = computed(() => activeTheme.value === 'dark')

  return {
    currentTheme,
    activeTheme,
    isDark,
    setTheme,
    toggleTheme
  }
}
