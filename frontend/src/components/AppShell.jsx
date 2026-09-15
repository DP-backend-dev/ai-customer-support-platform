import { Bot, LogOut, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AppShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('aicsp_dashboard_theme') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('aicsp_dashboard_theme', theme)
    return () => document.documentElement.classList.remove('dark')
  }, [theme])

  return <div className="app-shell min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-ink dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white/85 backdrop-blur dark:border-line dark:bg-ink/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <Link to="/dashboard" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Bot size={19} /></span>
          <span>SupportAI <span className="hidden text-slate-500 sm:inline">Console</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-3" type="button" onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
          <button className="btn-secondary px-3 sm:px-4" onClick={() => { logout(); navigate('/login') }}><LogOut size={16} /> <span className="hidden sm:inline">Log out</span></button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10"><Outlet /></main>
  </div>
}
