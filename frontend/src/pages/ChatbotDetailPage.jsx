import { ArrowLeft, Check, ChevronDown, Copy, MessageSquare, Pencil, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'

const newVisitorId = () => globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
const formatDate = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

function EmbedCode({ chatbotId }) {
  const [copyState, setCopyState] = useState('idle')
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const snippet = `<script src="${apiBase}/widget.js" data-chatbot-id="${chatbotId}"></script>`

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyState('copied')
    } catch (_) {
      const textarea = document.createElement('textarea')
      textarea.value = snippet
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      setCopyState(copied ? 'copied' : 'failed')
    }
    window.setTimeout(() => setCopyState('idle'), 2200)
  }

  return <section className="panel mt-10 p-6 sm:p-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><p className="text-sm font-medium text-violet-400">Install on your website</p><h2 className="mt-2 text-xl font-semibold">Embed Code</h2><p className="mt-2 text-sm text-slate-400">Paste this snippet immediately before the closing <code className="text-slate-300">&lt;/body&gt;</code> tag on your website.</p></div>
      <button type="button" className="btn-secondary shrink-0" onClick={copy} disabled={!apiBase}>{copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />} {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy to clipboard'}</button>
    </div>
    <pre className="mt-5 overflow-x-auto rounded-xl border border-line bg-[#090c12] p-4 text-sm leading-6 text-slate-300"><code>{snippet}</code></pre>
    {!apiBase && <p className="mt-3 text-sm text-amber-300">Set VITE_API_BASE_URL to generate the embed code.</p>}
  </section>
}

export default function ChatbotDetailPage() {
  const { id } = useParams()
  const [bot, setBot] = useState(null)
  const [conversations, setConversations] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [message, setMessage] = useState('')
  const [visitorId] = useState(newVisitorId)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  async function loadConversations() {
    const { data } = await api.get(`/chatbots/${id}/conversations`)
    setConversations(data)
  }
  useEffect(() => {
    Promise.all([api.get(`/chatbots/${id}`), api.get(`/chatbots/${id}/conversations`)])
      .then(([botData, conversationData]) => { setBot(botData.data); setConversations(conversationData.data) })
      .catch(e => setError(errorMessage(e, 'Could not load this chatbot.'))).finally(() => setLoading(false))
  }, [id])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function send(event) {
    event.preventDefault()
    const text = message.trim(); if (!text || sending) return
    setMessage(''); setError(''); setChatMessages(items => [...items, { role: 'user', content: text }]); setSending(true)
    try {
      const { data } = await api.post(`/chatbots/${id}/chat`, { visitor_identifier: visitorId, message: text })
      setChatMessages(items => [...items, { role: 'bot', content: data.reply }])
      await loadConversations()
    } catch (e) { setError(errorMessage(e, 'The assistant could not reply.')); setChatMessages(items => items.slice(0, -1)); setMessage(text) }
    finally { setSending(false) }
  }

  if (loading) return <div className="grid min-h-72 place-items-center text-slate-400"><span className="flex items-center gap-3"><Spinner /> Loading chatbot…</span></div>
  if (!bot) return <><Alert>{error || 'Chatbot not found.'}</Alert><Link to="/dashboard" className="btn-secondary mt-5">Back to dashboard</Link></>
  return <>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Dashboard</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">{bot.name}</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">{bot.business_info || 'No business information added yet.'}</p></div><Link className="btn-secondary" to={`/chatbots/${id}/edit`}><Pencil size={16} /> Edit chatbot</Link></div>
    <div className="mt-6"><Alert>{error}</Alert></div>
    <section className="panel mt-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><div><h2 className="font-semibold">Live test</h2><p className="text-xs text-slate-500">New simulated visitor session</p></div></div><MessageSquare size={19} className="text-violet-400" /></div>
      <div className="h-[430px] overflow-y-auto bg-slate-50 p-4 dark:bg-[#0c1017] sm:p-5"><div className="space-y-4">
        {chatMessages.length === 0 && <div className="grid h-80 place-items-center text-center"><div><MessageSquare className="mx-auto text-slate-700" size={36} /><p className="mt-4 text-sm text-slate-400">Send a message to test your assistant.</p><p className="mt-1 text-xs text-slate-600">{bot.welcome_message || 'Your test conversation will appear here.'}</p></div></div>}
        {chatMessages.map((item, index) => <div key={index} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${item.role === 'user' ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-line dark:bg-panel dark:text-slate-200'}`}>{item.content}</div></div>)}
        {sending && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-line dark:bg-panel dark:text-slate-400"><Spinner /> Thinking…</div></div>}<div ref={bottomRef} />
      </div></div>
      <form onSubmit={send} className="flex gap-3 border-t border-line p-4"><input className="input" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask your chatbot a question…" disabled={sending} /><button className="btn-primary shrink-0" aria-label="Send message" disabled={sending || !message.trim()}><Send size={17} /><span className="hidden sm:inline">Send</span></button></form>
    </section>

    <EmbedCode chatbotId={id} />

    <section className="mt-10"><h2 className="text-2xl font-semibold">Past Conversations</h2><p className="mt-2 text-sm text-slate-400">Review messages from every visitor session.</p><div className="mt-5 space-y-3">
      {conversations.length === 0 ? <div className="panel p-7 text-sm text-slate-500">No past conversations yet. Send a test message above to create one.</div> : conversations.map(conversation => <details className="panel group" key={conversation.id}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="font-medium">Visitor {conversation.visitor_identifier.slice(0, 12)}{conversation.visitor_identifier.length > 12 ? '…' : ''}</p><p className="mt-1 text-xs text-slate-500">{formatDate(conversation.started_at)} · {conversation.messages.length} messages</p></div><ChevronDown size={18} className="text-slate-500 transition group-open:rotate-180" /></summary><div className="space-y-3 border-t border-line px-5 py-5">{conversation.messages.map(item => <div key={item.id} className="flex gap-3 text-sm"><span className={`w-10 shrink-0 pt-0.5 text-xs font-semibold uppercase ${item.role === 'bot' ? 'text-violet-400' : 'text-slate-500'}`}>{item.role}</span><div><p className="whitespace-pre-wrap leading-6 text-slate-300">{item.content}</p><p className="mt-1 text-xs text-slate-600">{formatDate(item.created_at)}</p></div></div>)}</div></details>)}
    </div></section>
  </>
}
