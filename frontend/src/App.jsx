import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ChatbotEditorPage from './pages/ChatbotEditorPage'
import ChatbotDetailPage from './pages/ChatbotDetailPage'
import LandingPage from './pages/LandingPage'

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chatbots/new" element={<ChatbotEditorPage />} />
        <Route path="/chatbots/:id/edit" element={<ChatbotEditorPage />} />
        <Route path="/chatbots/:id" element={<ChatbotDetailPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
}
