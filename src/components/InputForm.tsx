import { useRef, useState } from 'react'
import { ImageIcon, User, X, Loader2, Video, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateImage, generateVideo, searchStockPhoto, type GenerateParams } from '../services/aiService'
import { db } from '../db/db'

interface FilePreview {
  dataUrl: string
  name: string
}

export function InputForm() {
  const { apiKey, hfToken, falKey, pexelsKey, showToast, setActiveTab, refreshHistory, setShowSettings } = useApp()
  const [bgFile, setBgFile] = useState<FilePreview | null>(null)
  const [personFile, setPersonFile] = useState<FilePreview | null>(null)
  const [description, setDescription] = useState('')
  const [speak, setSpeak] = useState('')
  const [loadingImg, setLoadingImg] = useState(false)
  const [loadingVid, setLoadingVid] = useState(false)
  const [loadingStock, setLoadingStock] = useState(false)

  const bgRef = useRef<HTMLInputElement>(null)
  const personRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result as string)
      reader.onerror = rej
      reader.readAsDataURL(file)
    })

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: FilePreview | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFile(file)
    setter({ dataUrl, name: file.name })
    e.target.value = ''
  }

  const handleGenerate = async (type: 'image' | 'video') => {
    if (!apiKey) {
      showToast('กรุณาตั้งค่า API Key ในหน้า Settings ก่อนใช้งาน', 'error')
      setShowSettings(true)
      return
    }

    const setLoading = type === 'image' ? setLoadingImg : setLoadingVid
    setLoading(true)
    showToast(
      type === 'image'
        ? 'กำลังสร้างภาพด้วย Google AI... (อาจใช้เวลา 10-20 วินาที)'
        : falKey
          ? 'กำลังสร้างวิดีโอด้วย Wan2.1 (Fal.ai)... อาจใช้เวลา 1-3 นาที'
          : 'กำลังสร้างวิดีโอด้วย Veo... อาจใช้เวลา 1–2 นาที',
      'loading'
    )

    try {
      const params: GenerateParams = {
        backgroundImage: bgFile?.dataUrl,
        personImage: personFile?.dataUrl,
        description: description.trim() || undefined,
        speak: speak.trim() || undefined,
      }

      const dataUrl = type === 'image'
        ? await generateImage(apiKey, hfToken, params)
        : await generateVideo(apiKey, falKey, params)

      await db.history.add({
        type,
        dataUrl,
        mimeType: type === 'image' ? 'image/png' : 'video/mp4',
        prompt: [description.trim(), speak.trim()].filter(Boolean).join(' | ') || `Generated ${type}`,
        createdAt: Date.now(),
      })

      await refreshHistory()
      showToast(type === 'image' ? 'สร้างภาพสำเร็จแล้ว!' : 'สร้างวิดีโอสำเร็จแล้ว!', 'success')
      setActiveTab('history')
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStockSearch = async () => {
    if (!pexelsKey) {
      showToast('กรุณาตั้งค่า Pexels API Key ในหน้า Settings ก่อนใช้งาน', 'error')
      setShowSettings(true)
      return
    }
    if (!description.trim()) {
      showToast('กรุณากรอก Description เพื่อใช้เป็นคำค้นหารูปภาพ', 'error')
      return
    }

    setLoadingStock(true)
    showToast('กำลังค้นหารูปภาพจาก Pexels...', 'loading')

    try {
      const dataUrl = await searchStockPhoto(pexelsKey, apiKey, {
        description: description.trim(),
      })

      await db.history.add({
        type: 'image',
        dataUrl,
        mimeType: 'image/jpeg',
        prompt: description.trim(),
        createdAt: Date.now(),
      })

      await refreshHistory()
      showToast('พบรูปภาพแล้ว!', 'success')
      setActiveTab('history')
    } catch (err) {
      showToast((err as Error).message, 'error')
    } finally {
      setLoadingStock(false)
    }
  }

  const isLoading = loadingImg || loadingVid || loadingStock

  return (
    <div className="space-y-5">

      {/* Image uploads — side by side */}
      <div className="grid grid-cols-2 gap-3">

        {/* Background Image */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Background{' '}
            <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          {bgFile ? (
            <div className="relative rounded-xl overflow-hidden h-24 bg-slate-800">
              <img
                src={bgFile.dataUrl}
                alt="Background preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setBgFile(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => bgRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 active:bg-indigo-500/5 transition-colors bg-slate-800/40"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-xs text-center leading-tight px-1">Upload Background</span>
            </button>
          )}
          <input
            ref={bgRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e, setBgFile)}
          />
        </div>

        {/* Person Image */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Person / Character{' '}
            <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          {personFile ? (
            <div className="relative rounded-xl overflow-hidden h-24 bg-slate-800">
              <img
                src={personFile.dataUrl}
                alt="Person preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setPersonFile(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => personRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 active:bg-indigo-500/5 transition-colors bg-slate-800/40"
            >
              <User className="w-5 h-5" />
              <span className="text-xs text-center leading-tight px-1">Upload Person / Character</span>
            </button>
          )}
          <input
            ref={personRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e, setPersonFile)}
          />
        </div>

      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description{' '}
          <span className="text-slate-500 font-normal text-xs">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="อธิบายบริบทหรือสไตล์ที่ต้องการ เช่น cinematic sunset beach, anime style..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
        />
      </div>

      {/* Speak */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Speak / Caption{' '}
          <span className="text-slate-500 font-normal text-xs">(optional)</span>
        </label>
        <textarea
          value={speak}
          onChange={e => setSpeak(e.target.value)}
          placeholder="บทพูดหรือข้อความที่ต้องการให้ปรากฏในภาพหรือวิดีโอ..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => handleGenerate('image')}
          disabled={isLoading}
          className="h-13 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 py-3.5"
        >
          {loadingImg
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ImageIcon className="w-4 h-4" />
          }
          Generate Image
        </button>

        <button
          onClick={() => handleGenerate('video')}
          disabled={isLoading}
          className="h-13 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-600 hover:to-pink-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 py-3.5"
        >
          {loadingVid
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Video className="w-4 h-4" />
          }
          Generate Video
        </button>
      </div>

      {/* Stock Photo (Pexels) */}
      <button
        onClick={handleStockSearch}
        disabled={isLoading}
        className="w-full h-12 rounded-xl font-semibold text-sm text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loadingStock
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Search className="w-4 h-4" />
        }
        ค้นหารูปภาพจาก Pexels (Stock Photo)
      </button>
    </div>
  )
}
