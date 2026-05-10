import { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import useWorkspaceStore from '../store/workspaceStore'
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2,
  ChevronLeft, ChevronRight, Download, MousePointer2,
  Hand
} from 'lucide-react'

const S3_BASE = import.meta.env.VITE_STORAGE_BASE || 'https://doc-proj-backend.vercel.app/api/storage/pages'

export default function MainCanvas() {
  const { pages, selectedPageId, selectPage, rotatePage } = useWorkspaceStore()
  const [imgError, setImgError] = useState(false)
  const [isPanning, setIsPanning] = useState(true)

  const page = pages.find((p) => p.id === selectedPageId)
  const idx = pages.findIndex((p) => p.id === selectedPageId)
  const isRotated = page && (page.rotation % 180) !== 0

  const prev = () => idx > 0 && selectPage(pages[idx - 1].id)
  const next = () => idx < pages.length - 1 && selectPage(pages[idx + 1].id)

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {page ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={5}
            panning={{ disabled: !isPanning }}
            centerOnInit={true}
            centerZoomedOut={true}
            wheel={{ step: 0.1 }}
            limitToBounds={false}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
              <>
                {/* Toolbar - Floating & Glassy */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 glass rounded-2xl shadow-2xl border-main">
                  <button className="btn-ghost p-2" onClick={prev} disabled={idx <= 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="h-6 w-px dark:bg-white/10 bg-surface/10 mx-2" />

                  <button className={`p-2 rounded-xl transition-all ${isPanning ? 'bg-indigo-600 text-white' : 'text-muted hover:bg-black/5 dark:hover:bg-white/5'}`} onClick={() => setIsPanning(true)}>
                    <Hand className="w-4 h-4" />
                  </button>
                  <button className={`p-2 rounded-xl transition-all ${!isPanning ? 'bg-indigo-600 text-white' : 'text-muted hover:bg-black/5 dark:hover:bg-white/5'}`} onClick={() => setIsPanning(false)}>
                    <MousePointer2 className="w-4 h-4" />
                  </button>

                  <div className="h-6 w-px dark:bg-white/10 bg-surface/10 mx-2" />

                  <button 
                    id="zoom-out" 
                    className="btn-ghost p-2 text-muted hover:text-main"
                    onClick={() => zoomOut()}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button 
                    id="zoom-in" 
                    className="btn-ghost p-2 text-muted hover:text-main"
                    onClick={() => zoomIn()}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="h-6 w-px dark:bg-white/10 bg-surface/10 mx-2" />

                  <button className="btn-ghost p-2 text-muted hover:text-main" onClick={() => rotatePage(page?.id)}>
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button 
                    className="btn-ghost p-2 text-muted hover:text-main"
                    onClick={() => window.open(`${S3_BASE}/${page?.s3Path}`, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <div className="h-6 w-px dark:bg-white/10 bg-surface/10 mx-2" />

                  <button className="btn-ghost p-2" onClick={next} disabled={idx >= pages.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: '100%',
                    minHeight: '100%'
                  }}
                >
                   <div className="relative group p-8">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div 
                        className="relative flex items-center justify-center p-12 transition-all duration-500"
                        style={{ 
                          width: isRotated ? 'max-content' : 'auto',
                          height: isRotated ? 'max-content' : 'auto'
                        }}
                       >
                        {imgError ? (
                          <div className="w-[600px] aspect-[3/4] flex items-center justify-center bg-main text-slate-600 rounded-lg">
                             Image format error
                          </div>
                        ) : (
                          <div className="relative">
                            {/* The document itself with its own shadow and background */}
                            <div 
                              className="relative bg-white dark:shadow-[0_40px_100px_-10px_rgba(0,0,0,0.9)] shadow-[0_40px_100px_-10px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden transition-all duration-400 ease-out"
                              style={{ 
                                transform: `rotate(${page.rotation}deg)`,
                                width: isRotated ? 'min(80vh, 1200px)' : 'min(90vw, 850px)',
                                aspectRatio: isRotated ? '4/3' : '3/4'
                              }}
                            >
                              <img
                                key={`${page.id}-${page.rotation}`}
                                src={`${S3_BASE}/${page.s3Path}`}
                                alt={`Page ${idx + 1}`}
                                className="w-full h-full object-contain select-none pointer-events-none"
                                onLoad={() => {
                                  setImgError(false)
                                  setTimeout(() => centerView(), 200)
                                }}
                                onError={() => setImgError(true)}
                              />
                            </div>

                            {/* AI Ribbon - Pinned to the top of the viewing area, not the rotated content */}
                            {page.aiLabel && (
                               <div className="absolute -top-16 left-0 right-0 flex items-center justify-between px-5 py-3 bg-surface/80 backdrop-blur-2xl border border-main rounded-2xl shadow-2xl z-40 animate-in slide-in-from-top-4 duration-500">
                                 <div className="flex items-center gap-3">
                                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
                                   <div className="flex flex-col">
                                     <span className="text-[10px] uppercase font-bold text-muted tracking-tighter">Classification</span>
                                     <span className="text-[13px] font-black text-main tracking-wide uppercase">{page.aiLabel}</span>
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                   <div className="h-8 w-px dark:bg-white/10 bg-surface/10" />
                                   <ConfidenceBadge score={page.confidenceScore} />
                                 </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                   </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-700">
            <Hand className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Capture a page from the strip to view</p>
          </div>
        )}
      </div>

      {/* Page Selector Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 glass rounded-full text-[11px] font-mono text-muted">
         <span>DOCUMENT_FLIGHT_PATH</span>
         <div className="h-3 w-px dark:bg-white/10 bg-surface/10" />
         <span className="text-main font-bold">{idx + 1} OF {pages.length}</span>
         {page?.filename && (
           <span className="opacity-50 text-[9px] truncate max-w-[100px]">{page.filename}</span>
         )}
      </div>
    </div>
  )
}

function ConfidenceBadge({ score }) {
  const pct = Math.round((score ?? 0) * 100)
  const isHigh = pct >= 85
  return (
    <div className={`
      px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors
      ${isHigh ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}
    `}>
      {pct}% AI CONFIDENCE
    </div>
  )
}
