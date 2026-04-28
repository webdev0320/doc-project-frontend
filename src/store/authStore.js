import { create } from 'zustand'
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://doc-proj-backend.vercel.app/api',
  withCredentials: true
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      set({ user: data.data })
      return true
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed' })
      return false
    }
  },

  register: async (email, password, name) => {
    set({ error: null })
    try {
      const { data } = await api.post('/auth/register', { email, password, name })
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      set({ user: data.data })
      return true
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed' })
      return false
    }
  },

  logout: async () => {
    await api.post('/auth/logout')
    localStorage.removeItem('token')
    set({ user: null })
  }
}))

export default useAuthStore
