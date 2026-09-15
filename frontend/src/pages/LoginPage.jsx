import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../api'
import { useAuth } from '../auth/AuthContext'
import Alert from '../components/Alert'
import AuthLayout from '../components/AuthLayout'
import Spinner from '../components/Spinner'

export default function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (token) return <Navigate to="/dashboard" replace />

  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.access_token)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.status === 401 ? 'The email or password is incorrect.' : errorMessage(err, 'Unable to sign in.'))
    } finally { setLoading(false) }
  }

  return <AuthLayout title="Welcome back" subtitle="Sign in to manage your support assistants." footer={<>New here? <Link className="text-violet-400 hover:text-violet-300" to="/signup">Create an account</Link></>}>
    <form className="space-y-5" onSubmit={submit}>
      <Alert>{error}</Alert>
      <label><span className="label">Email address</span><input className="input" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label><span className="label">Password</span><input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
      <button className="btn-primary w-full" disabled={loading}>{loading && <Spinner />} {loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </AuthLayout>
}
