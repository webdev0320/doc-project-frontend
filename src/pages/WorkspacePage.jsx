import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useWorkspaceStore from '../store/workspaceStore'
import ThumbnailSidebar from '../components/ThumbnailSidebar'
import MainCanvas from '../components/MainCanvas'
import PropertiesPanel from '../components/PropertiesPanel'
import axios from 'axios'
import { ArrowLeft, Loader2, AlertCircle, Scissors, FileUp, CheckCircle, List, Check, AlertTriangle, ChevronDown, Sun, Moon, Download } from 'lucide-react'
import { exportBlob, fetchChecklists } from '../api/client'
import useThemeStore from '../store/themeStore'
import useToastStore from '../store/toastStore'

export default function WorkspacePage() {
  const { blobId } = useParams()
  const navigate = useNavigate()
  const { blob, pages, documents, loading, error, loadBlob, selectedDocumentId, saveDocumentChecklists, markAsComplete } = useWorkspaceStore()
  const { theme, toggleTheme } = useThemeStore()
  const { showToast } = useToastStore()
  const [globalChecklists, setGlobalChecklists] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportBlob(blobId)
      showToast('Document successfully exported to SFTP', 'success')
    } catch (e) {
      showToast('Export failed: ' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadReport = () => {
    if (!blob || !documents.length) return

    // Header row
    const headers = [
      'ClientLoanNo',
      'SourceFileName',
      'TotalFilePages',
      'Document ID',
      'Document Type',
      'PageFrom',
      'PageTo',
      'PageCount',
      'Document Title',
      'Total Pages',
      'Extracted Value Page'
    ]

    // Data rows
    const rows = documents.map(doc => {
      // Find the actual page objects to get their original index
      const docPagesSorted = [...doc.pages].sort((a, b) => a.order - b.order)
      const firstPage = pages.find(p => p.id === docPagesSorted[0]?.pageId)
      const lastPage = pages.find(p => p.id === docPagesSorted[docPagesSorted.length - 1]?.pageId)

      return [
        `"${blob.batchNo || '—'}"`,
        `"${blob.filename}"`,
        blob.pageCount,
        doc.id,
        `"${doc.documentType}"`,
        (firstPage?.originalIndex ?? 0) + 1,
        (lastPage?.originalIndex ?? 0) + 1,
        doc.pages.length,
        `"${doc.name || doc.documentType}.pdf"`,
        blob.pageCount,
        (firstPage?.originalIndex ?? 0) + 1
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blobUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', `Reconciliation_Report_${blob.batchNo || blob.filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Report downloaded successfully', 'success')
  }

  useEffect(() => { 
    loadBlob(blobId)
    fetchChecklists().then(({ data }) => setGlobalChecklists(data.data))
  }, [blobId])

  if (loading) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <p className="text-muted">Loading workspace…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-main flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-main overflow-hidden relative">
      {/* Premium ambient background mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] dark:from-indigo-500/10 from-indigo-500/5 dark:via-transparent via-transparent dark:to-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] dark:from-blue-500/10 from-blue-500/5 dark:via-transparent via-transparent dark:to-transparent to-transparent pointer-events-none" />
      
      {/* Top bar */}
      <header className="relative z-[60] flex items-center gap-4 px-4 py-2.5 bg-surface/80 backdrop-blur-2xl border-b border-main shrink-0 shadow-lg">
        <button
          id="back-to-dashboard"
          onClick={() => navigate('/')}
          className="btn-ghost text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>
        <div className="h-4 w-px bg-main" />
        <span className="text-sm font-medium text-main truncate">{blob?.filename}</span>
        <span className="text-xs text-muted">{blob?.pageCount} pages</span>
        <div className="ml-auto flex items-center gap-4">

          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-main text-muted dark:hover:bg-white/10 hover:bg-surface/10 transition-all border border-main"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowChecklist(!showChecklist)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all active:scale-95"
            >
              <List className="w-3.5 h-3.5" />
              Checklist
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
            </button>

            {showChecklist && (
              <div className="fixed top-14 right-4 mt-2 w-80 bg-surface border border-main rounded-2xl shadow-2xl z-[9999] p-4 animate-in slide-in-from-top-2 duration-200">
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <List className="w-3.5 h-3.5" /> Document Checklist
                </h3>
                
                {(() => {
                  const doc = documents.find(d => d.id === selectedDocumentId)
                  if (!doc) return <p className="text-[10px] text-slate-600 italic">Select a document to see its checklist.</p>
                  
                  if (globalChecklists.length === 0) return <p className="text-[10px] text-slate-600 italic">No global checklists defined.</p>

                  const checkedItems = doc.checklists || [];

                  const toggleCheck = (text) => {
                    const next = checkedItems.includes(text) 
                      ? checkedItems.filter(t => t !== text)
                      : [...checkedItems, text];
                    saveDocumentChecklists(doc.id, next);
                  };

                  return (
                    <div className="space-y-2">
                      {globalChecklists.map((item, idx) => {
                        const isChecked = checkedItems.includes(item.text);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleCheck(item.text)}
                            className="flex items-start gap-3 p-2.5 rounded-xl bg-main border border-main cursor-pointer hover:dark:bg-white/10 bg-surface/10 transition-colors"
                          >
                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500 text-main' : 'dark:border-white/20 border-black/20'}`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span className={`text-[11px] leading-tight transition-colors ${isChecked ? 'text-muted line-through' : 'text-muted'}`}>{item.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-main text-xs font-bold rounded-lg border border-main transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Download Report
          </button>

          <button
            onClick={() => navigate(`/workspace/${blobId}/split`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-main text-xs font-bold rounded-lg border border-main transition-all active:scale-95"
          >
            <Scissors className="w-3.5 h-3.5" /> Manage Flow
          </button>

          <button
            id="export-to-sftp"
            onClick={handleExport}
            disabled={exporting || blob?.status !== 'COMPLETED'}
            className={`
              flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed
              ${blob?.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20' : 'bg-slate-700'}
            `}
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {exporting ? 'Exporting...' : 'Export to SFTP'}
          </button>

          <div className="flex items-center gap-3">
            <StatusBadge status={blob?.status || 'LOADING'} />
            {blob?.status !== 'COMPLETED' && (
              <button 
                onClick={markAsComplete}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Finish Batch
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3-pane layout */}
      <div className="flex flex-1 overflow-hidden relative z-10 p-4 gap-4">
        {/* Left: Properties panel (AI Properties) - Fixed */}
        <aside className="sticky top-0 w-80 h-[calc(100vh-5rem)] panel shrink-0 rounded-2xl border border-main">
          <PropertiesPanel />
        </aside>

        {/* Center: Thumbnail sidebar */}
        <aside className="w-64 panel shrink-0 rounded-2xl border border-main">
          <ThumbnailSidebar />
        </aside>

        {/* Right: Main canvas */}
        <main className="flex-1 overflow-hidden panel rounded-2xl border border-main">
          <MainCanvas />
        </main>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    PENDING:    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-300 border-yellow-500/30',
    'IN-PROGRESS': 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
    PROCESSING: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
    COMPLETED:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    FAILED:     'bg-red-500/15 text-red-600 dark:text-red-600 dark:text-red-400 border-red-500/30',
  }
  return (
    <span className={`badge border ${map[status] || map.PENDING}`}>
      {status === 'PROCESSING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {status}
    </span>
  )
}
