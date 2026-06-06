import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, X, Copy, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function Toast() {
  const { toast, dismissToast } = useApp()
  const [copied, setCopied] = useState(false)

  if (!toast) return null

  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
      cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
    error: {
      icon: <XCircle className="w-4 h-4 shrink-0 text-red-400" />,
      cls: 'bg-red-500/15 border-red-500/30 text-red-300',
    },
    loading: {
      icon: <Loader2 className="w-4 h-4 shrink-0 text-indigo-400 animate-spin" />,
      cls: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    },
  }[toast.type]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toast.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`fixed top-[7rem] left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-xl max-w-[88vw] min-w-[220px] ${config.cls}`}
    >
      {/* Message row */}
      <div className="flex items-start gap-2.5">
        {config.icon}
        <span className="text-sm leading-snug flex-1 whitespace-pre-line">{toast.message}</span>
        {toast.type !== 'loading' && (
          <button
            onClick={dismissToast}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1 mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Copy button — only for errors */}
      {toast.type === 'error' && (
        <button
          onClick={handleCopy}
          className="self-end flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/35 active:bg-red-500/40 transition-colors"
        >
          {copied
            ? <><Check className="w-3 h-3" /> Copied!</>
            : <><Copy className="w-3 h-3" /> Copy error</>
          }
        </button>
      )}
    </div>
  )
}
