import { ref, watch } from 'vue'
import { useOsTheme } from 'naive-ui'

export type ThemeMode = 'light' | 'dark' | 'auto'

const currentTheme = ref<ThemeMode>(
  (localStorage.getItem('theme') as ThemeMode) || 'auto'
)
const activeTheme = ref<'light' | 'dark'>('light')

// 延迟初始化
let initialized = false

function initTheme() {
  if (initialized) return
  initialized = true

  const osTheme = useOsTheme()

  // 立即计算一次
  const compute = (theme: ThemeMode, os: string | null) => {
    if (theme === 'auto') {
      activeTheme.value = os === 'dark' ? 'dark' : 'light'
    } else {
      activeTheme.value = theme
    }
    document.documentElement.setAttribute('data-theme', activeTheme.value)
    localStorage.setItem('theme', theme)
    // 同步 body 背景，解决底部白条问题
    document.body.style.backgroundColor = activeTheme.value === 'dark' ? '#1e1e1e' : '#f5f5f5'
  }

  compute(currentTheme.value, osTheme.value)

  watch([currentTheme, osTheme], ([theme, os]) => {
    compute(theme, os)
  })
}

export function useTheme() {
  initTheme()

  const toggleTheme = () => {
    const themeMap: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light'
    }
    currentTheme.value = themeMap[currentTheme.value]
  }

  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme
  }

  return {
    currentTheme,
    activeTheme,
    toggleTheme,
    setTheme
  }
}
