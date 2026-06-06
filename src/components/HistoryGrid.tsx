import { useState } from 'react'
import { Download, Trash2, ImageIcon, Video, Clock, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { type HistoryItem } from '../db/db'

function downloadItem(item: HistoryItem) {
  const ext = item.type === 'image' ? 'jpg' : 'mp4'
  const filename = `aigentleman-${item.id}.${ext}`

  if (item.dataUrl.startsWith('data:')) {
    const [header, base64] = item.dataUrl.split(',')
    const mimeType = header.replace(/^data:/, '').replace(/;base64$/, '')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } else {
    window.open(item.dataUrl, '_blank')
  }
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function Lightbox({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Media */}
      <div
        className="max-w-full max-h-full"
        onClick={e => e.stopPropagation()}
      >
        {item.type === 'image' ? (
          <img
            src={item.dataUrl}
            alt={item.prompt}
            className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-2xl object-contain shadow-2xl"
          />
        ) : (
          <video
            src={item.dataUrl}
            className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-2xl object-contain shadow-2xl"
            controls
            autoPlay
            loop
            playsInline
          />
        )}

        {/* Prompt caption */}
        {item.prompt && (
          <p className="mt-3 text-center text-sm text-white/70 line-clamp-2 px-2">
            {item.prompt}
          </p>
        )}
      </div>
    </div>
  )
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const [lightbox, setLightbox] = useState(false)
  const { deleteHistoryItem, showToast } = useApp()

  const handleDelete = async () => {
    if (!item.id) return
    await deleteHistoryItem(item.id)
    showToast('ลบออกจากประวัติแล้ว', 'success')
  }

  const handleDownload = () => {
    downloadItem(item)
    showToast('กำลังดาวน์โหลด...', 'success')
  }

  return (
    <>
      {lightbox && <Lightbox item={item} onClose={() => setLightbox(false)} />}

      <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 hover:bg-slate-800 transition-colors">
        {/* Thumbnail — tap to open lightbox */}
        <button
          onClick={() => setLightbox(true)}
          className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700 shrink-0 active:scale-95 transition-transform"
        >
          {item.type === 'image' ? (
            <img
              src={item.dataUrl}
              alt={item.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <video
              src={item.dataUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}
        </button>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Type badge + date */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0
            ${item.type === 'image'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-600/40'
              : 'bg-violet-600/30 text-violet-300 border border-violet-600/40'
            }`}
          >
            {item.type === 'image'
              ? <ImageIcon className="w-2.5 h-2.5" />
              : <Video className="w-2.5 h-2.5" />
            }
            {item.type === 'image' ? 'Image' : 'Video'}
          </span>
          <span className="text-xs text-slate-500 truncate">{formatDate(item.createdAt)}</span>
        </div>

        {/* Prompt */}
        <p className="text-sm text-slate-300 leading-snug line-clamp-2 break-words">
          {item.prompt}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={handleDownload}
          aria-label="Download"
          className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-indigo-600 active:bg-indigo-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
        </button>
        <button
          onClick={handleDelete}
          aria-label="Delete"
          className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>
    </div>
    </>
  )
}

export function HistoryGrid() {
  const { history } = useApp()

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">ยังไม่มีประวัติการสร้าง</p>
        <p className="text-slate-600 text-sm mt-1">สร้างภาพหรือวิดีโอก่อน จะปรากฏที่นี่</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map(item => (
        <HistoryRow key={item.id} item={item} />
      ))}
    </div>
  )
}
