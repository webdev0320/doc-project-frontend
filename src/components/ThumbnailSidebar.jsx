import { useRef, useEffect, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchConfiguredDocTypes } from '../api/client'
import useWorkspaceStore from '../store/workspaceStore'
import { Scissors, Flag, RotateCw, GripVertical, AlertTriangle, Trash2, MoreVertical, Eye, Download, X, RefreshCw, FileEdit, LayoutGrid, ChevronLeft } from 'lucide-react'

const S3_BASE = import.meta.env.VITE_STORAGE_BASE || 'https://doc-proj-backend.vercel.app/api/storage/pages'
console.log(S3_BASE);
export default function ThumbnailSidebar() {
  const {
    pages, selectedPageIds, selectPage, splitAfterPage,
    rotatePage, staplePages, reorderPages, selectNext, selectPrev, filterLabel,
    documents, selectedDocumentId
  } = useWorkspaceStore()

  // Filter pages by label or selected document
  let filteredPages = pages
  if (filterLabel) {
    filteredPages = pages.filter(p => (p.aiLabel || 'Unclassified') === filterLabel)
  } else if (selectedDocumentId) {
    const selectedDoc = documents.find(d => d.id === selectedDocumentId)
    if (selectedDoc) {
      const docPageIds = selectedDoc.pages.map(dp => dp.pageId)
      filteredPages = pages.filter(p => docPageIds.includes(p.id))
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) reorderPages(active.id, over.id)
  }

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'arrowdown') selectNext?.()
      if (key === 'arrowup') selectPrev?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectNext, selectPrev])

  return (
    <div className="flex flex-col h-full bg-transparent shadow-2xl">
      <div className="p-4 border-b border-main flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted">
          Capture Strip ({filteredPages.length})
        </h3>
        {selectedPageIds.length > 1 && (
          <button
            onClick={staplePages}
            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-lg hover:bg-indigo-500 transition-all animate-in fade-in slide-in-from-top-2"
          >
            <GripVertical className="w-3 h-3" /> Staple ({selectedPageIds.length})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pt-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredPages.map(p => p.id)} strategy={verticalListSortingStrategy}>
             <div className="space-y-4">
               {filteredPages.map((page) => {
                 const absoluteIndex = pages.findIndex(p => p.id === page.id)
                 return (
                   <SortableItem 
                     key={page.id} 
                     page={page} 
                     index={absoluteIndex} 
                   />
                 )
               })}
             </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 bg-surface border-t border-main flex gap-2">
         <ActionBtn icon={<RotateCw className="w-4 h-4" />} tip="Rotate Selected" onClick={() => rotatePage()} />
         <ActionBtn icon={<Flag className="w-4 h-4" />} tip="Flag Selected" onClick={() => rotatePage()} />
      </div>
    </div>
  )
}

function SortableItem({ page, index }) {
  const {
    pages, selectedPageIds, selectPage, splitAfterPage, removePage
  } = useWorkspaceStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: page.id })

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || isMenuOpen ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
    padding: '0 8px'
  }

  const isSelected = selectedPageIds.includes(page.id)
  const isLast = index === pages.length - 1
  const lowConfidence = (page.confidenceScore ?? 0) < 0.85

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this page?')) {
      removePage(page.id)
    }
  }

  return (
    <div ref={setNodeRef} style={itemStyle} className="flex flex-col gap-1 relative group">
      <div
        onClick={(e) => selectPage(page.id, e.metaKey || e.ctrlKey || e.shiftKey)}
        {...attributes}
        {...listeners}
        className={`
          group relative rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden
          ${isSelected ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 bg-indigo-500/20' : 'border-main hover:dark:border-white/20 border-black/20 bg-surface'}
          ${lowConfidence ? 'ring-2 ring-red-500/50 ring-inset' : ''}
        `}
      >
        <img
          src={`${S3_BASE}/${page.s3Path}`}
          alt={`Page ${index + 1}`}
          style={{ transform: `rotate(${page.rotation}deg)` }}
          className="w-full aspect-[3/4] object-cover bg-surface-700 pointer-events-none"
        />

        <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
           <span className="bg-black/80 backdrop-blur-md text-main text-[10px] px-1.5 py-0.5 rounded font-mono border border-main">
            {index + 1}
          </span>
          {page.isFlagged && (
            <span className="bg-red-500 text-main p-0.5 rounded shadow-lg">
              <AlertTriangle className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {isSelected && !isDragging && (
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-lg border border-indigo-500 z-10">
             <div className="w-2 h-2 bg-indigo-600 rounded-full" />
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-2 pt-6 pointer-events-none">
           <p className="text-[10px] font-bold text-main truncate uppercase tracking-tight">
             {page.aiLabel || 'Classifying...'}
           </p>
           <div className="flex items-center gap-1.5 mt-1">
             <div className="flex-1 h-1 dark:bg-white/10 bg-surface/10 rounded-full overflow-hidden">
               <div
                 className={`h-full rounded-full transition-all duration-500 ${lowConfidence ? 'bg-red-500' : 'bg-indigo-400'}`}
                 style={{ width: `${(page.confidenceScore ?? 0) * 100}%` }}
               />
             </div>
             <span className={`text-[9px] font-mono font-bold ${lowConfidence ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
               {Math.round((page.confidenceScore || 0) * 100)}%
             </span>
           </div>
        </div>
      </div>

      {/* 3-Dots Menu Button (Outside overflow-hidden) */}
      <PageContextMenu 
        page={page} 
        index={index} 
        isOpen={isMenuOpen} 
        setIsOpen={setIsMenuOpen} 
      />

      {!isLast && (
        <button
          onClick={(e) => { e.stopPropagation(); splitAfterPage(page.id) }}
          className="
            relative h-6 w-full flex items-center justify-center
            hover:bg-indigo-500/10 rounded-md transition-all
          "
        >
          <div className="absolute inset-x-2 h-px dark:bg-white/10 bg-surface/10 group-hover:bg-indigo-500/50" />
          <div className="
            z-10 scale-90 hover:scale-110 transition-all
            bg-indigo-600/80 text-main p-1 rounded-full shadow-lg border border-main
          ">
            <Scissors className="w-3.5 h-3.5" />
          </div>
        </button>
      )}
    </div>
  )
}

function ActionBtn({ icon, tip, onClick }) {
  return (
    <button
      title={tip}
      onClick={onClick}
      className="p-2.5 rounded-xl bg-main text-muted hover:text-main hover:dark:bg-white/10 bg-surface/10 border border-main transition-all shadow-lg active:scale-95"
    >
      {icon}
    </button>
  )
}

function PageContextMenu({ page, index, isOpen, setIsOpen }) {
  const menuRef = useRef(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [availableTypes, setAvailableTypes] = useState([])
  const { 
    splitAfterPage, rotatePage, flagPage, removePage, renamePage, selectPage 
  } = useWorkspaceStore()

  useEffect(() => {
    fetchConfiguredDocTypes()
      .then(res => setAvailableTypes(res.data.data || []))
      .catch(err => console.error('Failed to fetch types', err))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleAction = (e, action, close = true) => {
    e.stopPropagation()
    if (close) setIsOpen(false)
    action()
  }

  const menuItems = [
    { label: 'Split', icon: <LayoutGrid className="w-3.5 h-3.5" />, action: () => splitAfterPage(page.id) },
    { label: 'Rename', icon: <FileEdit className="w-3.5 h-3.5" />, action: () => setShowPopup(true) },
    { label: 'View', icon: <Eye className="w-3.5 h-3.5" />, action: () => selectPage(page.id) },
    { label: 'Rotate', icon: <RotateCw className="w-3.5 h-3.5" />, action: () => rotatePage(page.id) },
    { label: 'Download', icon: <Download className="w-3.5 h-3.5" />, action: () => {
      window.open(`${S3_BASE}/${page.s3Path}`, '_blank')
    }},
    { label: 'Reject', icon: <X className="w-3.5 h-3.5" />, action: () => flagPage(page.id, true) },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, action: () => {
      if (window.confirm('Delete this page?')) removePage(page.id)
    }, danger: true },
    { label: 'Re-Generate Thumbnail', icon: <RefreshCw className="w-3.5 h-3.5" />, action: () => {
      alert('Thumbnail regeneration started...')
    }},
  ]

  return (
    <div className="absolute top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className={`
          p-1.5 rounded-lg transition-all shadow-xl active:scale-95 pointer-events-auto border border-main
          ${isOpen ? 'bg-white text-black' : 'bg-surface/40 text-main backdrop-blur-md hover:bg-surface/60 opacity-0 group-hover:opacity-100'}
        `}
      >
        <MoreVertical className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-surface border border-main rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 pointer-events-auto z-[100]">
          <div className="py-1.5">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => handleAction(e, item.action, !item.stayOpen)}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-2.5 text-[11px] font-semibold transition-all
                  ${item.danger ? 'text-red-600 dark:text-red-400 hover:bg-red-500/10' : 'text-muted hover:dark:bg-white/10 bg-surface/10 hover:text-main'}
                `}
              >
                <span className={item.danger ? 'text-red-600 dark:text-red-400' : 'text-muted group-hover:text-main transition-colors'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rename Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-surface border border-main rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-main">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-main uppercase tracking-widest">Select Document Type</h3>
              </div>
              <button onClick={() => setShowPopup(false)} className="p-2 hover:bg-main rounded-full text-muted hover:text-main transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
               {availableTypes.length > 0 ? (
                 availableTypes.map(type => (
                   <button
                    key={type.id}
                    onClick={() => {
                      renamePage(page.id, type.label)
                      setShowPopup(false)
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-main hover:bg-indigo-600 border border-main hover:border-indigo-400 transition-all text-left group"
                   >
                     <span className="text-xs font-semibold text-muted group-hover:text-main">{type.label}</span>
                     <div className="w-5 h-5 rounded-full bg-main group-hover:dark:bg-white/20 bg-surface/20 flex items-center justify-center">
                        <ChevronLeft className="w-3 h-3 rotate-180" />
                     </div>
                   </button>
                 ))
               ) : (
                 <div className="py-12 text-center text-muted text-xs italic">
                    Loading available types...
                 </div>
               )}
            </div>
            <div className="px-6 py-4 bg-main text-[10px] text-muted">
              Select a type to classify this page. This will update the AI labels across the document.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
