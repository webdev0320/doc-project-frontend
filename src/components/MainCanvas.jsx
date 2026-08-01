import { useState, useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import useWorkspaceStore from '../store/workspaceStore'
import {
  ZoomIn, ZoomOut, RotateCcw,
  ChevronLeft, ChevronRight, Download, MousePointer2,
  Hand
} from 'lucide-react'

const S3_BASE = import.meta.env.VITE_STORAGE_BASE || 'https://doc-proj-backend.vercel.app/api/storage/pages'

const imageUrl = (s3Path, retry = 0) => {
  const baseUrl = `${S3_BASE}/${s3Path}`
  return retry ? `${baseUrl}?retry=${retry}` : baseUrl
}

export default function MainCanvas() {
  const { pages, selectedPageId, selectPage, rotatePage, filterLabel } = useWorkspaceStore()
  const [imgError, setImgError] = useState(false)
  const [imgRetry, setImgRetry] = useState(0)
  const [isPanning, setIsPanning] = useState(true)
  const scrollCooldown = useRef(0)

  // Filter pages if a label is selected
  const filteredPages = filterLabel 
    ? pages.filter(p => (p.aiLabel || 'Unclassified') === filterLabel)
    : pages

  const page = filteredPages.find((p) => p.id === selectedPageId) || filteredPages[0]
  const idx = filteredPages.findIndex((p) => p.id === (page?.id || selectedPageId))
  const isRotated = page && (page.rotation % 180) !== 0

  useEffect(() => {
    setImgError(false)
    setImgRetry(0)
  }, [page?.s3Path])

  const prev = () => idx > 0 && selectPage(filteredPages[idx - 1].id)
  const next = () => idx < filteredPages.length - 1 && selectPage(filteredPages[idx + 1].id)

  const handleWheel = (e) => {
    // Prevent accidental triggers from trackpads or slow scrolls
    if (Math.abs(e.deltaY) < 20) return

    const now = Date.now()
    if (now - scrollCooldown.current < 500) return // 500ms cooldown

    if (e.deltaY > 0) {
      next()
      scrollCooldown.current = now
    } else if (e.deltaY < 0) {
      prev()
      scrollCooldown.current = now
    }
  }

  return (
    <div className="flex h-full bg-transparent relative">
      {page ? (
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          panning={{ disabled: !isPanning }}
          centerOnInit={true}
          centerZoomedOut={true}
          wheel={{ disabled: true }}
          limitToBounds={false}
          doubleClick={{ disabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              <div className="flex-1 relative overflow-hidden" onWheel={handleWheel}>
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
                                key={`${page.id}-${page.rotation}-${imgRetry}`}
                                src={imageUrl(page.s3Path, imgRetry)}
                                alt={`Page ${idx + 1}`}
                                className="w-full h-full object-contain select-none pointer-events-none"
                                onLoad={() => {
                                  setImgError(false)
                                  setTimeout(() => centerView(), 200)
                                }}
                                onError={() => {
                                  if (imgRetry < 4) {
                                    const nextRetry = imgRetry + 1
                                    setTimeout(() => setImgRetry(nextRetry), nextRetry * 800)
                                  } else {
                                    setImgError(true)
                                  }
                                }}
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
              </div>

              <ViewerToolRail
                idx={idx}
                page={page}
                pagesLength={pages.length}
                isPanning={isPanning}
                onPrev={prev}
                onNext={next}
                onPan={() => setIsPanning(true)}
                onSelect={() => setIsPanning(false)}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onRotate={() => rotatePage(page?.id)}
                onDownload={() => window.open(`${S3_BASE}/${page?.s3Path}`, '_blank')}
              />
            </>
          )}
        </TransformWrapper>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <div className="flex flex-col items-center gap-4 text-slate-700">
            <Hand className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Capture a page from the strip to view</p>
          </div>
        </div>
      )}

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

function ViewerToolRail({
  idx,
  page,
  pagesLength,
  isPanning,
  onPrev,
  onNext,
  onPan,
  onSelect,
  onZoomIn,
  onZoomOut,
  onRotate,
  onDownload,
}) {
  return (
    <aside className="w-16 shrink-0 border-l border-main bg-surface/90 backdrop-blur-xl flex items-center justify-center py-4">
      <div className="flex flex-col items-center gap-2">
        <RailButton title="Previous page" onClick={onPrev} disabled={idx <= 0}>
          <ChevronLeft className="w-4 h-4" />
        </RailButton>

        <RailDivider />

        <RailButton title="Pan mode" active={isPanning} onClick={onPan}>
          <Hand className="w-4 h-4" />
        </RailButton>
        <RailButton title="Select mode" active={!isPanning} onClick={onSelect}>
          <MousePointer2 className="w-4 h-4" />
        </RailButton>

        <RailDivider />

        <RailButton title="Zoom out" onClick={() => onZoomOut()}>
          <ZoomOut className="w-4 h-4" />
        </RailButton>
        <RailButton title="Zoom in" onClick={() => onZoomIn()}>
          <ZoomIn className="w-4 h-4" />
        </RailButton>

        <RailDivider />

        <RailButton title="Rotate page" onClick={onRotate}>
          <RotateCcw className="w-4 h-4" />
        </RailButton>
        <RailButton title="Open page image" onClick={onDownload} disabled={!page?.s3Path}>
          <Download className="w-4 h-4" />
        </RailButton>

        <RailDivider />

        <RailButton title="Next page" onClick={onNext} disabled={idx >= pagesLength - 1}>
          <ChevronRight className="w-4 h-4" />
        </RailButton>
      </div>
    </aside>
  )
}

function RailButton({ children, title, onClick, active = false, disabled = false }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-10 h-10 flex items-center justify-center rounded-xl border transition-all
        disabled:opacity-35 disabled:cursor-not-allowed
        ${active
          ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
          : 'bg-main text-muted border-main hover:text-main hover:bg-black/5 dark:hover:bg-white/10'}
      `}
    >
      {children}
    </button>
  )
}

function RailDivider() {
  return <div className="w-8 h-px bg-slate-300/70 dark:bg-white/10 my-1" />
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
