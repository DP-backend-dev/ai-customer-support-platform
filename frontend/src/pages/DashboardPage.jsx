import { ArrowRight, Bot, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'

export default function DashboardPage() {
  const [chatbots, setChatbots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { api.get('/chatbots').then(r => setChatbots(r.data)).catch(e => setError(errorMessage(e, 'Could not load chatbots.'))).finally(() => setLoading(false)) }, [])

  return <>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-violet-400">Workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Your chatbots</h1><p className="mt-2 text-slate-400">Build and test support assistants grounded in your knowledge base.</p></div>
      <Link className="btn-primary w-full sm:w-auto" to="/chatbots/new"><Plus size={17} /> Create New Chatbot</Link>
    </div>
    <div className="mt-8"><Alert>{error}</Alert></div>
    {loading ? <div className="grid min-h-64 place-items-center text-slate-400"><div className="flex items-center gap-3"><Spinner /> Loading chatbots…</div></div> : chatbots.length === 0 ?
      <section className="panel mt-8 grid place-items-center px-6 py-16 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-400"><Bot /></div><h2 className="mt-5 text-lg font-semibold">Create your first chatbot</h2><p className="mt-2 max-w-sm text-sm text-slate-400">Add business context and common questions, then test your assistant in the console.</p><Link className="btn-primary mt-6" to="/chatbots/new"><Plus size={17} /> Create chatbot</Link></section>
      : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{chatbots.map(bot => <Link key={bot.id} to={`/chatbots/${bot.id}`} className="panel group p-6 transition hover:-translate-y-0.5 hover:border-violet-500/40">
        <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><Bot size={20} /></span><ArrowRight className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-400" size={18} /></div>
        <h2 className="mt-5 font-semibold">{bot.name}</h2><p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-slate-400">{bot.business_info || 'No business information added yet.'}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: bot.primary_color || '#8b5cf6' }} /> {bot.tone || 'Default tone'}</div>
      </Link>)}</div>}
  </>
}
