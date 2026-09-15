import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, errorMessage } from '../api'
import { useAuth } from '../auth/AuthContext'
import Alert from '../components/Alert'
import AuthLayout from '../components/AuthLayout'
import Spinner from '../components/Spinner'

export default function SignupPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (token) return <Navigate to="/dashboard" replace />

  async function submit(event) {
    event.preventDefault(); setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/signup', form)
      login(data.access_token); navigate('/dashboard', { replace: true })
    } catch (err) { setError(errorMessage(err, 'Unable to create your account.')) }
    finally { setLoading(false) }
  }

  return <AuthLayout title="Create your account" subtitle="Set up your first support assistant in minutes." footer={<>Already have an account? <Link className="text-violet-400 hover:text-violet-300" to="/login">Sign in</Link></>}>
    <form className="space-y-5" onSubmit={submit}>
      <Alert>{error}</Alert>
      <label><span className="label">Name</span><input className="input" autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label><span className="label">Email address</span><input className="input" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label><span className="label">Password</span><input className="input" type="password" minLength="8" autoComplete="new-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><span className="mt-2 block text-xs text-slate-500">At least 8 characters</span></label>
      <button className="btn-primary w-full" disabled={loading}>{loading && <Spinner />} {loading ? 'Creating account…' : 'Create account'}</button>
    </form>
  </AuthLayout>
}
