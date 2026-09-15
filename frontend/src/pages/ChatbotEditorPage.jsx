import { ArrowLeft, Check, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'

const emptyBot = { name: '', business_info: '', tone: '', welcome_message: '', primary_color: '#8b5cf6', logo_url: '' }
const emptyEntry = { question: '', answer: '' }

export default function ChatbotEditorPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyBot)
  const [entries, setEntries] = useState([])
  const [newEntry, setNewEntry] = useState(emptyEntry)
  const [editEntry, setEditEntry] = useState(null)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [entrySaving, setEntrySaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!editing) return
    Promise.all([api.get(`/chatbots/${id}`), api.get(`/chatbots/${id}/knowledge`)])
      .then(([bot, knowledge]) => {
        setForm(Object.fromEntries(Object.keys(emptyBot).map(key => [key, bot.data[key] ?? (key === 'primary_color' ? '#8b5cf6' : '')])))
        setEntries(knowledge.data)
      }).catch(e => setError(errorMessage(e, 'Could not load this chatbot.'))).finally(() => setLoading(false))
  }, [editing, id])

  async function saveBot(event) {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || null]))
      payload.name = form.name.trim()
      const { data } = editing ? await api.put(`/chatbots/${id}`, payload) : await api.post('/chatbots', payload)
      if (!editing) navigate(`/chatbots/${data.id}/edit`, { replace: true })
      else setNotice('Chatbot settings saved.')
    } catch (e) { setError(errorMessage(e, 'Could not save chatbot.')) }
    finally { setSaving(false) }
  }

  async function addEntry(event) {
    event.preventDefault(); setError(''); setEntrySaving(true)
    try {
      const { data } = await api.post(`/chatbots/${id}/knowledge`, newEntry)
      setEntries([...entries, data]); setNewEntry(emptyEntry)
    } catch (e) { setError(errorMessage(e, 'Could not add the knowledge entry.')) }
    finally { setEntrySaving(false) }
  }

  async function updateEntry(event) {
    event.preventDefault(); setError(''); setEntrySaving(true)
    try {
      const { data } = await api.put(`/chatbots/${id}/knowledge/${editEntry.id}`, { question: editEntry.question, answer: editEntry.answer })
      setEntries(entries.map(entry => entry.id === data.id ? data : entry)); setEditEntry(null)
    } catch (e) { setError(errorMessage(e, 'Could not update the knowledge entry.')) }
    finally { setEntrySaving(false) }
  }

  async function removeEntry(entryId) {
    if (!window.confirm('Delete this knowledge entry?')) return
    setError('')
    try { await api.delete(`/chatbots/${id}/knowledge/${entryId}`); setEntries(entries.filter(entry => entry.id !== entryId)) }
    catch (e) { setError(errorMessage(e, 'Could not delete the knowledge entry.')) }
  }

  if (loading) return <div className="grid min-h-72 place-items-center text-slate-400"><span className="flex items-center gap-3"><Spinner /> Loading editor…</span></div>
  return <>
    <Link to={editing ? `/chatbots/${id}` : '/dashboard'} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> {editing ? 'Back to chatbot' : 'Back to dashboard'}</Link>
    <div className="mt-6"><p className="text-sm font-medium text-violet-400">{editing ? 'Chatbot settings' : 'New chatbot'}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{editing ? `Edit ${form.name}` : 'Create a chatbot'}</h1></div>
    <div className="mt-6 space-y-3"><Alert>{error}</Alert><Alert tone="success">{notice}</Alert></div>
    <form onSubmit={saveBot} className="panel mt-8 p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="label">Name *</span><input className="input" required maxLength="255" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Support" /></label>
        <label className="sm:col-span-2"><span className="label">Business information</span><textarea className="input min-h-32 resize-y" value={form.business_info} onChange={e => setForm({ ...form, business_info: e.target.value })} placeholder="Describe your business, products, policies, and customers." /></label>
        <label><span className="label">Tone</span><input className="input" maxLength="100" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} placeholder="Friendly and concise" /></label>
        <label><span className="label">Welcome message</span><input className="input" value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} placeholder="How can I help?" /></label>
        <label><span className="label">Primary color</span><div className="flex gap-3"><input className="h-12 w-14 cursor-pointer rounded-xl border border-line bg-transparent p-1" type="color" value={/^#[0-9a-f]{6}$/i.test(form.primary_color) ? form.primary_color : '#8b5cf6'} onChange={e => setForm({ ...form, primary_color: e.target.value })} /><input className="input" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} /></div></label>
        <label><span className="label">Logo URL</span><input className="input" type="url" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" /></label>
      </div>
      <div className="mt-7 flex justify-end"><button className="btn-primary" disabled={saving}>{saving ? <Spinner /> : <Save size={17} />} {saving ? 'Saving…' : editing ? 'Save changes' : 'Create chatbot'}</button></div>
    </form>

    <section className="mt-10">
      <div><p className="text-sm font-medium text-violet-400">Training context</p><h2 className="mt-2 text-2xl font-semibold">Knowledge Base</h2><p className="mt-2 text-sm text-slate-400">Give your assistant reliable answers to common questions.</p></div>
      {!editing ? <div className="panel mt-5 p-6 text-sm text-slate-400">Create the chatbot first, then add knowledge entries here.</div> : <>
        <div className="mt-5 space-y-3">{entries.length === 0 && <div className="panel p-6 text-sm text-slate-500">No knowledge entries yet.</div>}{entries.map(entry => <div className="panel p-5" key={entry.id}>
          {editEntry?.id === entry.id ? <form onSubmit={updateEntry} className="space-y-4"><input className="input" required value={editEntry.question} onChange={e => setEditEntry({ ...editEntry, question: e.target.value })} /><textarea className="input min-h-24" required value={editEntry.answer} onChange={e => setEditEntry({ ...editEntry, answer: e.target.value })} /><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEditEntry(null)}><X size={16} /> Cancel</button><button className="btn-primary" disabled={entrySaving}><Check size={16} /> Save</button></div></form> : <div className="flex gap-4"><div className="min-w-0 flex-1"><h3 className="font-medium text-slate-100">{entry.question}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{entry.answer}</p></div><div className="flex shrink-0 items-start"><button className="btn-danger text-slate-300" aria-label="Edit entry" onClick={() => setEditEntry({ ...entry })}><Pencil size={16} /></button><button className="btn-danger" aria-label="Delete entry" onClick={() => removeEntry(entry.id)}><Trash2 size={16} /></button></div></div>}
        </div>)}</div>
        <form onSubmit={addEntry} className="panel mt-5 p-6"><h3 className="font-semibold">Add an entry</h3><div className="mt-5 grid gap-4"><label><span className="label">Question *</span><input className="input" required value={newEntry.question} onChange={e => setNewEntry({ ...newEntry, question: e.target.value })} placeholder="What is your return policy?" /></label><label><span className="label">Answer *</span><textarea className="input min-h-24" required value={newEntry.answer} onChange={e => setNewEntry({ ...newEntry, answer: e.target.value })} placeholder="Returns are accepted within 30 days…" /></label></div><div className="mt-5 flex justify-end"><button className="btn-secondary" disabled={entrySaving}>{entrySaving ? <Spinner /> : <Plus size={17} />} Add entry</button></div></form>
      </>}
    </section>
  </>
}
