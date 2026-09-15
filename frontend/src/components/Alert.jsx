export default function Alert({ children, tone = 'error' }) {
  if (!children) return null
  const colors = tone === 'success'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
    : 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200'
  return <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${colors}`}>{children}</div>
}
