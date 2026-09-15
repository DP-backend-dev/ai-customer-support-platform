import { Bot } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, footer, children }) {
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(124,58,237,.16),transparent_38%)] px-5 py-12">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-8 flex items-center justify-center gap-3 font-semibold">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600"><Bot size={20} /></span>
        SupportAI Console
      </Link>
      <section className="panel p-7 shadow-glow sm:p-9">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
      <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>
    </div>
  </main>
}
