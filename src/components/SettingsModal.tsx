import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, CheckCircle2, ExternalLink } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function SettingsModal() {
  const { apiKey, saveApiKey, hfToken, saveHfToken, falKey, saveFalKey, pexelsKey, savePexelsKey, showSettings, setShowSettings, showToast } = useApp()
  const [inputKey, setInputKey] = useState(apiKey)
  const [inputHf, setInputHf] = useState(hfToken)
  const [inputFal, setInputFal] = useState(falKey)
  const [inputPexels, setInputPexels] = useState(pexelsKey)
  const [showKey, setShowKey] = useState(false)
  const [showHf, setShowHf] = useState(false)
  const [showFal, setShowFal] = useState(false)
  const [showPexels, setShowPexels] = useState(false)

  useEffect(() => {
    if (showSettings) {
      setInputKey(apiKey)
      setInputHf(hfToken)
      setInputFal(falKey)
      setInputPexels(pexelsKey)
      setShowKey(false)
      setShowHf(false)
      setShowFal(false)
      setShowPexels(false)
    }
  }, [showSettings, apiKey, hfToken, falKey, pexelsKey])

  const handleSave = () => {
    saveApiKey(inputKey)
    saveHfToken(inputHf)
    saveFalKey(inputFal)
    savePexelsKey(inputPexels)
    showToast('บันทึก Settings เรียบร้อยแล้ว', 'success')
    setTimeout(() => setShowSettings(false), 800)
  }

  if (!showSettings) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSettings(false)}
      />

      <div className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto bg-slate-900 rounded-t-3xl border-t border-slate-700/70 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">

            {/* ── Google AI Studio API Key ── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Google AI Studio API Key
                <span className="text-xs text-slate-500 font-normal">(สำหรับ Video + Vision)</span>
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {apiKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว</span>
                </div>
              )}

              <div className="mt-3 bg-slate-800/70 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">วิธีรับ Google AI Studio Key</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                  <li>ไปที่ aistudio.google.com</li>
                  <li>คลิก "Get API key" → สร้าง Key ใหม่</li>
                </ol>
                <span className="inline-flex items-center gap-1 text-indigo-400 pt-0.5">
                  <ExternalLink className="w-3 h-3" />
                  aistudio.google.com
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/60" />

            {/* ── Hugging Face Token ── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Key className="w-4 h-4 text-rose-400" />
                Hugging Face Token
                <span className="text-xs text-slate-500 font-normal">(สำหรับ Generate Image)</span>
              </label>

              <div className="relative">
                <input
                  type={showHf ? 'text' : 'password'}
                  value={inputHf}
                  onChange={e => setInputHf(e.target.value)}
                  placeholder="hf_..."
                  autoComplete="off"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowHf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showHf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {hfToken && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว</span>
                </div>
              )}

              <div className="mt-3 bg-slate-800/70 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">วิธีรับ Hugging Face Token (ฟรี)</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                  <li>สมัครที่ huggingface.co (ฟรี)</li>
                  <li>ไปที่ Settings → Access Tokens</li>
                  <li>คลิก "New token" เลือก Role: <strong className="text-slate-300">Read</strong></li>
                  <li>คัดลอก token ที่ขึ้นต้นด้วย <strong className="text-slate-300">hf_</strong></li>
                </ol>
                <span className="inline-flex items-center gap-1 text-rose-400 pt-0.5">
                  <ExternalLink className="w-3 h-3" />
                  huggingface.co/settings/tokens
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/60" />

            {/* ── Fal.ai Key ── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Key className="w-4 h-4 text-amber-400" />
                Fal.ai API Key
                <span className="text-xs text-slate-500 font-normal">(สำหรับ Generate Video)</span>
              </label>

              <div className="relative">
                <input
                  type={showFal ? 'text' : 'password'}
                  value={inputFal}
                  onChange={e => setInputFal(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxx..."
                  autoComplete="off"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowFal(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showFal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {falKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว — จะใช้ Fal.ai แทน Veo</span>
                </div>
              )}

              <div className="mt-3 bg-slate-800/70 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">วิธีรับ Fal.ai Key (เริ่มต้น $10)</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                  <li>สมัครที่ fal.ai → เติม Credit</li>
                  <li>ไปที่ Settings → API Keys → Add Key</li>
                  <li>คัดลอก Key มาวางด้านบน</li>
                  <li>ราคา ~$0.01-0.03 ต่อคลิป (Wan2.1)</li>
                </ol>
                <span className="inline-flex items-center gap-1 text-amber-400 pt-0.5">
                  <ExternalLink className="w-3 h-3" />
                  fal.ai/dashboard/settings/keys
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/60" />

            {/* ── Pexels API Key ── */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Pexels API Key
                <span className="text-xs text-slate-500 font-normal">(สำหรับค้นหา Stock Photo)</span>
              </label>

              <div className="relative">
                <input
                  type={showPexels ? 'text' : 'password'}
                  value={inputPexels}
                  onChange={e => setInputPexels(e.target.value)}
                  placeholder="563492ad6f91700001000001..."
                  autoComplete="off"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPexels(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPexels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pexelsKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว</span>
                </div>
              )}

              <div className="mt-3 bg-slate-800/70 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">วิธีรับ Pexels API Key (ฟรี)</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                  <li>สมัครที่ pexels.com/api (ฟรี)</li>
                  <li>คลิก "Get Started" แล้วเข้าสู่ระบบ</li>
                  <li>คัดลอก API Key มาวางด้านบน</li>
                </ol>
                <span className="inline-flex items-center gap-1 text-emerald-400 pt-0.5">
                  <ExternalLink className="w-3 h-3" />
                  pexels.com/api
                </span>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all"
            >
              บันทึก Settings
            </button>

            <p className="text-center text-xs text-slate-500">
              Key และ Token จะถูกเก็บใน Browser เท่านั้น ไม่มีการส่งข้อมูลไปยัง Server ใดๆ
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
