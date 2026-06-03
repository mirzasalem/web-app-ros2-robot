import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AdminUsersPage from './pages/AdminUsersPage'
import DashboardPage from './pages/DashboardPage'
import MappingPage from './pages/MappingPage'
import BuddyRobotDocsPage from './pages/BuddyRobotDocsPage'
import DocumentationPage from './pages/DocumentationPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="docs" element={<DocumentationPage />} />
              <Route path="docs/buddy" element={<BuddyRobotDocsPage />} />
              <Route
                path="mapping"
                element={
                  <ProtectedRoute adminOnly>
                    <MappingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
