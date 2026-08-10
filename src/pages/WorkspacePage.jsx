import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import useWorkspaceStore from '../store/workspaceStore'
import ThumbnailSidebar from '../components/ThumbnailSidebar'
import MainCanvas from '../components/MainCanvas'
import PropertiesPanel from '../components/PropertiesPanel'
import axios from 'axios'
import { ArrowLeft, Loader2, AlertCircle, Scissors, FileUp, CheckCircle, List, Flag, MessageSquare, Sun, Moon, Download } from 'lucide-react'
import { exportBlob, fetchChecklists, fetchDocumentChecklistResults } from '../api/client'
import useThemeStore from '../store/themeStore'
import useToastStore from '../store/toastStore'

export default function WorkspacePage() {
  const { blobId } = useParams()
  const navigate = useNavigate()
  const { blob, pages, documents, loading, error, loadBlob, selectedDocumentId, saveChecklistResults, markAsComplete } = useWorkspaceStore()
  const { theme, toggleTheme } = useThemeStore()
  const { showToast } = useToastStore()
  const [globalChecklists, setGlobalChecklists] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)
  const [results, setResults] = useState([])
  const [openCommentFor, setOpenCommentFor] = useState(null)
  const [saving, setSaving] = useState(false)
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

  const openChecklist = async () => {
    const doc = documents.find(d => d.id === selectedDocumentId) || documents[0]
    setResults(globalChecklists.map(item => ({ checklistItemId: item.id, text: item.text, answer: 'Yes', comment: '', flagged: false })))
    setOpenCommentFor(null)
    setShowChecklist(true)
    if (!doc) return
    try {
      const { data } = await fetchDocumentChecklistResults(doc.id)
      const savedMap = {}
      data.data.forEach(r => { savedMap[r.checklistItemId] = r })
      setResults(prev => prev.map(p => savedMap[p.checklistItemId]
        ? { ...p, answer: savedMap[p.checklistItemId].answer || 'Yes', comment: savedMap[p.checklistItemId].comment || '', flagged: savedMap[p.checklistItemId].flagged }
        : p))
    } catch (e) {
      console.warn('Failed to load checklist results', e)
    }
  }

  const updateResult = (checklistItemId, patch) => {
    setResults(prev => prev.map(r => r.checklistItemId === checklistItemId ? { ...r, ...patch } : r))
  }

  const commentTimers = useRef({})

  const persistResult = async (checklistItemId, patch) => {
    const doc = documents.find(d => d.id === selectedDocumentId) || documents[0]
    const item = results.find(r => r.checklistItemId === checklistItemId)
    if (!doc || !item) return
    const payload = {
      checklistItemId,
      answer: patch.answer ?? item.answer,
      comment: patch.comment ?? item.comment,
      flagged: patch.flagged ?? item.flagged,
    }
    try {
      await saveChecklistResults(doc.id, [payload])
    } catch (e) {
      showToast('Failed to save: ' + (e.response?.data?.error || e.message), 'error')
    }
  }

  const toggleAnswer = (item) => {
    const next = item.answer === 'Yes' ? 'No' : 'Yes'
    updateResult(item.checklistItemId, { answer: next })
    persistResult(item.checklistItemId, { answer: next })
  }

  const toggleFlag = (item) => {
    const next = !item.flagged
    updateResult(item.checklistItemId, { flagged: next })
    persistResult(item.checklistItemId, { flagged: next })
  }

  const onCommentChange = (checklistItemId, value) => {
    updateResult(checklistItemId, { comment: value })
    clearTimeout(commentTimers.current[checklistItemId])
    commentTimers.current[checklistItemId] = setTimeout(() => {
      persistResult(checklistItemId, { comment: value })
    }, 600)
  }

  const saveCommentNow = (checklistItemId, value) => {
    clearTimeout(commentTimers.current[checklistItemId])
    persistResult(checklistItemId, { comment: value })
  }

  const saveChecklist = async () => {
    const doc = documents.find(d => d.id === selectedDocumentId) || documents[0]
    if (!doc) return false
    setSaving(true)
    try {
      const payload = results.map(r => ({ checklistItemId: r.checklistItemId, answer: r.answer, comment: r.comment, flagged: r.flagged }))
      await saveChecklistResults(doc.id, payload)
      showToast('Missing document checklist saved', 'success')
      return true
    } catch (e) {
      showToast('Failed to save checklist: ' + (e.response?.data?.error || e.message), 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  const completeChecklist = async () => {
    const ok = await saveChecklist()
    if (ok) {
      setShowChecklist(false)
      showToast('Missing document checklist completed', 'success')
    }
  }

  const createFollowUp = () => {
    showToast('Follow-up request created', 'success')
  }

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

  const rawErr = blob?.engineError?.payload;
  let cleanErr = rawErr;
  if (rawErr) {
    try {
      const parsed = JSON.parse(rawErr);
      cleanErr = parsed.error?.message || parsed.message || rawErr;
    } catch (e) {}
  }

  return (
    <div className="h-screen flex flex-col bg-main overflow-hidden relative">
      {blob?.status === 'FAILED' && blob?.engineError && (
        <div className="w-full bg-red-600 text-white p-3 text-sm flex items-center justify-between">
          <div>
            <strong>Engine processing failed:</strong>
            <div className="text-xs mt-1 break-words">{cleanErr}</div>
          </div>
          <div className="text-xs opacity-80">{new Date(blob.engineError.createdAt).toLocaleString()}</div>
        </div>
      )}
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

          <button 
            onClick={openChecklist}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all active:scale-95"
          >
            <List className="w-3.5 h-3.5" />
            Checklist
          </button>

          {showChecklist && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowChecklist(false)}>
              <div className="w-[min(94vw,1100px)] max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
                  <h3 className="text-[15px] font-semibold text-[#334155] dark:text-slate-100">Missing Document Checklist</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-md bg-[#F4F5FC] dark:bg-slate-800 text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">
                      TaskStatus: {blob?.status || '—'}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-[#F4F5FC] dark:bg-slate-800 text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">
                      Loan Number: {blob?.batchNo || '—'}
                    </span>
                  </div>
                </div>

                {/* Column headers */}
                <div className="flex items-center px-6 py-2 bg-[#F3F5FF] dark:bg-slate-800/50">
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400">Question</span>
                  <span className="w-28 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400 text-center">Answer</span>
                  <span className="w-28 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400 text-center">Comment</span>
                  <span className="w-28 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400 text-center">Flag</span>
                </div>

                {/* Question rows */}
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    const doc = documents.find(d => d.id === selectedDocumentId) || documents[0]
                    if (!doc) return <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-6 py-4">Select a document to see its checklist.</p>
                    if (globalChecklists.length === 0) return <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-6 py-4">No global checklist requirements defined. Add them in Admin → Checklists.</p>
                    return results.map((item) => (
                      <div key={item.checklistItemId}>
                        <div className={`flex items-center px-6 py-2.5 bg-[#FAFAFA] dark:bg-slate-800/20 border-b border-[#D3D3D3] dark:border-slate-700/60 ${item.flagged ? 'border-l-2 border-l-amber-400' : ''}`}>
                          <span className="flex-1 text-[13px] leading-snug text-[#5C6B7A] dark:text-slate-300 pr-6">{item.text}</span>
                          <div className="w-28 flex justify-center">
                            <button
                              onClick={() => toggleAnswer(item)}
                              className="text-[13px] text-[#5C6B7A] dark:text-slate-300 text-center cursor-pointer select-none hover:text-[#334155] dark:hover:text-slate-100"
                            >
                              {item.answer || '—'}
                            </button>
                          </div>
                          <div className="w-28 flex justify-center">
                            <button
                              onClick={() => setOpenCommentFor(openCommentFor === item.checklistItemId ? null : item.checklistItemId)}
                              title={item.comment ? 'Edit comment' : 'Add comment'}
                              className={`p-1.5 rounded-md transition-colors ${item.comment ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-[#9AA8B8] dark:text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 hover:text-[#5C6B7A]'}`}
                            >
                              <MessageSquare className={`w-3.5 h-3.5 ${item.comment ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <div className="w-28 flex justify-center">
                            <button
                              onClick={() => toggleFlag(item)}
                              title={item.flagged ? 'Remove flag' : 'Flag this question'}
                              className={`p-1.5 rounded-md transition-colors ${item.flagged ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-[#9AA8B8] dark:text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 hover:text-[#5C6B7A]'}`}
                            >
                              <Flag className={`w-3.5 h-3.5 ${item.flagged ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                        {openCommentFor === item.checklistItemId && (
                          <div className="px-6 py-2.5 bg-[#F5F7FB] dark:bg-slate-800/40 border-b border-[#D3D3D3] dark:border-slate-700/60">
                            <input
                              autoFocus
                              value={item.comment || ''}
                              onChange={e => onCommentChange(item.checklistItemId, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { saveCommentNow(item.checklistItemId, e.target.value); setOpenCommentFor(null) } }}
                              onBlur={e => saveCommentNow(item.checklistItemId, e.target.value)}
                              placeholder="Add a comment for this checklist question..."
                              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#D3D3D3] dark:border-slate-600 text-[12px] text-[#5C6B7A] dark:text-slate-300 outline-none focus:border-[#2E7EFA] transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  })()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-slate-900">
                  <button
                    onClick={createFollowUp}
                    className="px-4 py-[7px] rounded-lg bg-white dark:bg-slate-800 border border-[#A8BFD6] dark:border-slate-600 text-[12px] font-medium text-[#6A93B0] dark:text-slate-300 hover:bg-[#F7FAFD] dark:hover:bg-slate-700 transition-colors"
                  >
                    Create Follow-Up
                  </button>
                  <button
                    onClick={completeChecklist}
                    className="px-4 py-[7px] rounded-lg bg-[#2E7EFA] hover:bg-[#1f6ff3] text-white text-[12px] font-medium transition-colors"
                  >
                    Complete
                  </button>
                  <button
                    onClick={saveChecklist}
                    disabled={saving}
                    className="px-4 py-[7px] rounded-lg bg-white dark:bg-slate-800 border border-[#A8BFD6] dark:border-slate-600 text-[12px] font-medium text-[#6A93B0] dark:text-slate-300 hover:bg-[#F7FAFD] dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowChecklist(false)}
                    className="px-4 py-[7px] rounded-lg bg-white dark:bg-slate-800 border border-[#A8BFD6] dark:border-slate-600 text-[12px] font-medium text-[#6A93B0] dark:text-slate-300 hover:bg-[#F7FAFD] dark:hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

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
