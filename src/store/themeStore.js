import { create } from 'zustand'

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    
    // Direct DOM manipulation as a fail-safe
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    
    return { theme: next }
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  }
}))

export default useThemeStore
