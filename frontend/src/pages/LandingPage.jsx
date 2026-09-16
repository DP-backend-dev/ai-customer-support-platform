import { motion } from 'framer-motion'
import { Bot, Braces, Building2, CheckCircle2, Code2, Database, Globe2, MessageCircleMore, Palette, Send } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, publicApi } from '../api'
import Spinner from '../components/Spinner'

function getDemoVisitorId() {
  const key = 'aicsp_landing_demo_visitor_id'
  try {
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(key, id)
    }
    return id
  } catch (_) {
    return `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: 'easeOut' },
}

function Hero() {
  const heroRef = useRef(null)
  const layersRef = useRef([])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const pointerQuery = window.matchMedia('(pointer: fine) and (min-width: 768px)')
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let point = { x: 0, y: 0 }

    function paint() {
      frame = 0
      layersRef.current.forEach(layer => {
        if (!layer) return
        const depth = Number(layer.dataset.depth || 0)
        layer.style.transform = `translate3d(${point.x * depth}px, ${point.y * depth}px, 0)`
      })
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(paint)
    }
    function move(event) {
      if (!pointerQuery.matches || reducedQuery.matches) return
      const box = hero.getBoundingClientRect()
      point = {
        x: (event.clientX - box.left) / box.width - 0.5,
        y: (event.clientY - box.top) / box.height - 0.5,
      }
      schedule()
    }
    function reset() { point = { x: 0, y: 0 }; schedule() }
    hero.addEventListener('mousemove', move, { passive: true })
    hero.addEventListener('mouseleave', reset)
    return () => {
      hero.removeEventListener('mousemove', move)
      hero.removeEventListener('mouseleave', reset)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <section ref={heroRef} className="hero-stage relative min-h-[720px] overflow-hidden border-b border-white/[0.06]">
    <div ref={node => { layersRef.current[0] = node }} data-depth="8" className="parallax-layer"><div className="hero-glow" /></div>
    <div ref={node => { layersRef.current[1] = node }} data-depth="18" className="parallax-layer"><div className="hero-ring" /></div>
    <div ref={node => { layersRef.current[2] = node }} data-depth="30" className="parallax-layer"><span className="hero-twinkle-dot hero-dot-one" /></div>
    <div ref={node => { layersRef.current[3] = node }} data-depth="35" className="parallax-layer"><span className="hero-twinkle-dot hero-dot-two" /></div>
    <div ref={node => { layersRef.current[4] = node }} data-depth="28" className="parallax-layer"><span className="hero-twinkle-dot hero-dot-three" /></div>
    <div ref={node => { layersRef.current[5] = node }} data-depth="26" className="parallax-layer"><div className="hero-blob-a" /></div>
    <div ref={node => { layersRef.current[6] = node }} data-depth="40" className="parallax-layer"><div className="hero-blob-b" /></div>
    <div ref={node => { layersRef.current[7] = node }} data-depth="55" className="parallax-layer"><div className="hero-blob-c" /></div>
    <div className="relative z-10 mx-auto flex min-h-[720px] max-w-6xl items-center px-5 pb-20 pt-32 sm:pt-36">
      <div className="hero-copy max-w-[540px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#a58ef5]">AI Customer Support · Move your mouse</p>
        <h1 className="mt-5 text-5xl font-medium leading-[1.12] tracking-[-0.035em] text-[#f5f5f5] sm:text-6xl">Support that answers itself</h1>
        <p className="mt-6 max-w-[500px] text-base leading-[1.7] text-[#9997a3] sm:text-lg">Give every visitor an AI assistant trained on your business, branded to match, live in minutes.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/signup" className="landing-cta-glow inline-flex items-center justify-center rounded-lg bg-[#37DEE8] px-[18px] py-[11px] text-sm font-medium text-[#061217] hover:bg-[#78F4F7]">Get started</Link>
          <a href="#demo" className="inline-flex items-center justify-center rounded-lg border border-[#0B5D6D] px-[18px] py-[11px] text-sm font-medium text-[#f5f5f5] transition hover:border-[#37DEE8] hover:bg-[#37DEE8]/[0.06]">See demo</a>
        </div>
      </div>
    </div>
  </section>
}

function DemoChat() {
  const [demoId, setDemoId] = useState(null)
  const [config, setConfig] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [visitorId] = useState(getDemoVisitorId)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesRef = useRef(null)

  useEffect(() => {
    let active = true
    publicApi.get('/demo-chatbot-id')
      .then(({ data }) => Promise.all([Promise.resolve(data.chatbot_id), publicApi.get(`/chatbots/${data.chatbot_id}/public-config`)]))
      .then(([id, response]) => {
        if (!active) return
        setDemoId(id); setConfig(response.data)
        setMessages([{ role: 'bot', content: response.data.welcome_message || 'Hi! How can I help?' }])
      })
      .catch(err => { if (active) setError(errorMessage(err, 'The live demo is currently unavailable.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useLayoutEffect(() => {
    const messagesContainer = messagesRef.current
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight
  }, [messages, sending])

  async function submit(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending || !demoId) return
    setInput(''); setError(''); setSending(true)
    setMessages(items => [...items, { role: 'user', content: text }])
    try {
      const { data } = await publicApi.post(`/chatbots/${demoId}/chat`, { visitor_identifier: visitorId, message: text })
      setMessages(items => [...items, { role: 'bot', content: data.reply }])
    } catch (err) {
      const message = errorMessage(err, 'The assistant could not reply. Please try again.')
      setMessages(items => [...items, { role: 'error', content: message }])
      setError(message)
    } finally { setSending(false) }
  }

  return <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#10131a] shadow-2xl shadow-violet-950/20">
    <header className="flex min-h-20 items-center gap-3 border-b border-white/[0.07] px-5" style={{ background: config?.primary_color ? `${config.primary_color}18` : undefined }}>
      <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-amber-500/15 text-amber-300">{config?.logo_url ? <img src={config.logo_url} alt="" className="h-full w-full object-cover" /> : <Bot size={21} />}</span>
      <div><h3 className="font-semibold">{config?.name || 'Live demo assistant'}</h3><p className="mt-1 text-xs text-slate-500">Real AI response · Demo business</p></div>
    </header>
    <div ref={messagesRef} className="h-[420px] overflow-y-auto bg-[#0b0e14] p-5 [overflow-anchor:none]" aria-live="polite">
      {loading ? <div className="grid h-full place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><Spinner /> Preparing the demo…</span></div> : error && !demoId ? <div className="grid h-full place-items-center text-center text-sm text-rose-300"><div><Bot className="mx-auto mb-4 opacity-60" /><p>The live demo is currently unavailable.</p><p className="mt-2 text-xs text-slate-600">Please try again shortly.</p></div></div> : <div className="space-y-4">{messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-violet-600 text-white' : message.role === 'error' ? 'border border-rose-500/20 bg-rose-500/10 text-rose-200' : 'border border-white/[0.08] bg-[#151a23] text-slate-200'}`}>{message.content}</div></div>)}{sending && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#151a23] px-4 py-3 text-sm text-slate-400"><Spinner /> Thinking…</div></div>}</div>}
    </div>
    <form onSubmit={submit} className="flex gap-3 border-t border-white/[0.07] p-4"><input className="input" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about hours, location, or the menu…" disabled={!demoId || sending} /><button className="btn-primary shrink-0" aria-label="Send demo message" disabled={!demoId || sending || !input.trim()}><Send size={17} /><span className="hidden sm:inline">Send</span></button></form>
  </div>
}

export default function LandingPage() {
  const steps = [
    { icon: Building2, title: 'Add Your Business Info', text: 'Tell your chatbot about your business: hours, services, pricing, policies, anything customers ask about. Structured Q&A entries, not walls of text.' },
    { icon: Palette, title: 'Customize Its Voice', text: 'Set the tone, welcome message, and brand colors so it sounds and looks like your business, not a generic bot.' },
    { icon: Code2, title: 'Embed With One Snippet', text: 'Copy one script tag, paste it into your site. Live in minutes, no backend work required on your end.' },
    { icon: MessageCircleMore, title: 'Watch Real Conversations Happen', text: 'Every visitor chat is saved. See what customers are actually asking, right from your dashboard.' },
  ]
  const features = [
    { icon: Braces, accent: 'cyan', title: 'Branded chatbots', text: 'Match your assistant to your brand with a custom color, logo, tone, and welcome message.' },
    { icon: Database, accent: 'teal', title: 'Knowledge base answers', text: 'Give customers consistent answers grounded in the business information you provide.' },
    { icon: Globe2, accent: 'pink', title: 'Embed anywhere', text: 'Add a polished support experience to any website with one small script tag.' },
  ]
  return <div className="landing-shell min-h-screen bg-[#0A131E] text-slate-100">
    <nav className="absolute inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-[#0A131E]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5"><Link to="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B5D6D] text-[#78F4F7]"><Bot size={19} /></span>SupportAI</Link><div className="hidden items-center gap-7 text-sm text-slate-400 md:flex"><a className="hover:text-white" href="#product">Product</a><a className="hover:text-white" href="#how-it-works">How it works</a><a className="hover:text-white" href="#pricing">Pricing</a><a className="hover:text-white" href="#docs">Docs</a></div><div className="flex items-center gap-2"><Link className="hidden px-3 py-2 text-sm font-medium text-slate-300 hover:text-white sm:block" to="/login">Sign In</Link><Link className="btn-primary landing-cta-glow" to="/signup">Get Started</Link></div></div>
    </nav>
    <Hero />
    <main>
      <motion.section id="demo" className="scroll-mt-12 border-b border-white/[0.06] px-5 py-24 sm:py-32" {...reveal}><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#37DEE8]">Try it now</p><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Ask a real business assistant.</h2><p className="mt-6 text-lg leading-8 text-slate-400">This is the same product your customers will use. Every message reaches our public API, uses the demo restaurant's knowledge base, and receives a live Gemini response.</p><div className="mt-8 space-y-3 text-sm text-slate-400"><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-[#37DEE8]" /> Try asking when the restaurant is open</p><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-[#37DEE8]" /> Ask about dietary options or reservations</p><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-[#37DEE8]" /> Responses are saved like real conversations</p></div></div><DemoChat /></div></motion.section>
      <section id="how-it-works" className="scroll-mt-20 border-b border-white/[0.06] px-5 py-24 sm:py-32"><motion.div className="mx-auto max-w-6xl" {...reveal}><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#37DEE8]">How it works</p><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">From business context to live support.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Four focused steps take your assistant from setup to real customer conversations.</p></div><div className="mt-14 grid gap-5 md:grid-cols-2">{steps.map(({ icon: Icon, title, text }, index) => <motion.article key={title} className="how-step-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1B27] p-7 sm:p-8" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: .5, delay: index * .08 }}><span className="absolute right-6 top-5 text-5xl font-semibold tracking-[-.08em] text-[#37DEE8]/[0.10]">{String(index + 1).padStart(2, '0')}</span><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#37DEE8]/20 bg-[#0B5D6D]/45 text-[#78F4F7]"><Icon size={22} /></span><span className="text-xs font-semibold uppercase tracking-[.18em] text-[#37DEE8]">Step {index + 1}</span></div><h3 className="mt-7 pr-12 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{text}</p></motion.article>)}</div></motion.div></section>
      <section id="product" className="scroll-mt-20 px-5 py-24 sm:py-32"><motion.div className="mx-auto max-w-6xl" {...reveal}><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#37DEE8]">One simple workflow</p><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">From your knowledge to every customer.</h2><p className="mt-5 text-lg leading-8 text-slate-400">Build, teach, test, and publish from one focused workspace.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{features.map(({ icon: Icon, accent, title, text }, index) => <motion.article key={title} className={`feature-card feature-card-${accent} rounded-2xl border p-7`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: .5, delay: index * .1 }}><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0B5D6D]/40 text-[#37DEE8]"><Icon size={21} /></span><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></motion.article>)}</div></motion.div></section>
    </main>
    <footer className="border-t border-white/[0.07] px-5 py-10"><div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 font-medium text-slate-300"><Bot size={17} className="text-violet-400" /> SupportAI</div><div className="flex gap-6"><a id="pricing" href="#pricing" className="hover:text-slate-300">Pricing · coming soon</a><a id="docs" href="#docs" className="hover:text-slate-300">Docs · coming soon</a></div><p>© {new Date().getFullYear()} SupportAI</p></div></footer>
  </div>
}
