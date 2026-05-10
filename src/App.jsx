import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import DashboardPage from './pages/DashboardPage'
import WorkspacePage from './pages/WorkspacePage'
import AdminPage from './pages/AdminPage'
import SplitMergePage from './pages/SplitMergePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import useThemeStore from './store/themeStore'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const AppRoutes = () => {
  const { init } = useAuthStore()
  const { theme } = useThemeStore()
  
  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workspace/:blobId" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route path="/workspace/:blobId/split" element={<ProtectedRoute><SplitMergePage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
