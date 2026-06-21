import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function LoginPage() {
  const { login } = useApp()
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async () => {
    if (!pin) return
    setStatus('loading')
    const result = await login(pin)
    if (!result.ok) {
      setStatus('error')
      setErrorMessage(result.message)
    }
  }

  return (
    <div className="min-h-svh bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800/70 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-white font-bold text-lg">AIGentleman</h1>
          <p className="text-xs text-slate-500">กรอก PIN 6 หลักของคุณ เพื่อเข้าใช้งานและดึง API Key ที่บันทึกไว้</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="PIN 6 หลัก"
          autoComplete="off"
          autoFocus
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.4em] text-slate-200 placeholder:text-sm placeholder:tracking-normal placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={handleLogin}
          disabled={!pin || status === 'loading'}
          className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'เข้าสู่ระบบ'}
        </button>
        {status === 'error' && <p className="text-xs text-red-400 text-center">{errorMessage}</p>}
        <p className="text-xs text-slate-600 text-center">
          ใครก็ตามที่รู้ PIN นี้จะเข้าถึง API Key ชุดนี้ได้ — เก็บ PIN ไว้เป็นความลับ และจำไว้ให้ดี เพราะลืมแล้วกู้คืนไม่ได้
        </p>
      </div>
    </div>
  )
}
