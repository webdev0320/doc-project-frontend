import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fetchConfiguredDocTypes } from '../api/client'
import useWorkspaceStore from '../store/workspaceStore'
import { CheckCircle2, ChevronDown, FileText, Layers, Merge, AlertTriangle, List, Square, FileJson, Download } from 'lucide-react'
import useToastStore from '../store/toastStore'


export default function PropertiesPanel() {
  const {
    blob, pages, documents, selectedPageId, selectedDocumentId,
    selectDocument, verifyDocument, renameDocument, mergeDocuments,
    filterLabel, setFilterLabel
  } = useWorkspaceStore()

  const page = pages.find((p) => p.id === selectedPageId)
  const doc = documents.find((d) => d.id === selectedDocumentId)

  const { showToast } = useToastStore()
  const [docType, setDocType] = useState('')
  const [docName, setDocName] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [availableTypes, setAvailableTypes] = useState([])
  const [showRawJson, setShowRawJson] = useState(false)
  const [qaValues, setQaValues] = useState({})
  const [savingValues, setSavingValues] = useState(false)

  useEffect(() => {
    fetchConfiguredDocTypes()
      .then(({ data }) => setAvailableTypes(data.data || []))
      .catch(err => console.error('Error fetching doc types:', err))
  }, [])

  // Combine and flatten extracted data from all pages
  const combinedExtractedData = doc?.pages?.reduce((acc, dp) => {
    if (dp.page?.extractedData) {
      try {
        const data = typeof dp.page.extractedData === 'string' 
          ? JSON.parse(dp.page.extractedData) 
          : dp.page.extractedData;
        
        const flatten = (obj, prefix = '') => {
          return Object.keys(obj).reduce((r, k) => {
            const key = prefix ? `${prefix}_${k}` : k;
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
              Object.assign(r, flatten(obj[k], key));
            } else {
              r[key] = obj[k];
            }
            return r;
          }, {});
        };

        return { ...acc, ...flatten(data) };
      } catch (e) { return acc }
    }
    return acc
  }, {}) || {}

  // Local state for all fields (AI + Custom) to allow editing
  const [fields, setFields] = useState({})

  useEffect(() => {
    // If we have a document, show combined data. Otherwise, show current page data.
    if (doc) {
      setFields({ ...combinedExtractedData })
    } else if (page) {
      try {
        const pData = typeof page.extractedData === 'string' 
          ? JSON.parse(page.extractedData) 
          : (page.extractedData || {});
        
        const flatten = (obj, prefix = '') => {
          if (!obj || typeof obj !== 'object') return {};
          return Object.keys(obj).reduce((r, k) => {
            const key = prefix ? `${prefix}_${k}` : k;
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
              Object.assign(r, flatten(obj[k], key));
            } else {
              r[key] = obj[k];
            }
            return r;
          }, {});
        };
        setFields(flatten(pData));
      } catch (e) {
        setFields({});
      }
    } else {
      setFields({});
    }
  }, [doc?.id, page?.id, page?.extractedData])

  // Map each flattened field key -> page number(s) where the value was extracted
  const fieldPageMap = (() => {
    const map = {}
    const record = (key, pageNum) => {
      if (!map[key]) map[key] = []
      if (!map[key].includes(pageNum)) map[key].push(pageNum)
    }

    if (doc) {
      const docPagesSorted = [...doc.pages].sort((a, b) => a.order - b.order)
      docPagesSorted.forEach(dp => {
        if (!dp.page?.extractedData) return
        try {
          const data = typeof dp.page.extractedData === 'string'
            ? JSON.parse(dp.page.extractedData)
            : dp.page.extractedData

          const pageNum = (pages.find(p => p.id === dp.pageId)?.originalIndex ?? 0) + 1

          const flatten = (obj, prefix = '') => {
            return Object.keys(obj).reduce((r, k) => {
              const key = prefix ? `${prefix}_${k}` : k
              if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(r, flatten(obj[k], key))
              } else {
                r[key] = obj[k]
              }
              return r
            }, {})
          }

          Object.keys(flatten(data)).forEach(key => record(key, pageNum))
        } catch (e) {}
      })
    } else if (page) {
      const pageNum = (page.originalIndex ?? pages.findIndex(p => p.id === page.id)) + 1
      Object.keys(fields).forEach(key => record(key, pageNum))
    }
    return map
  })()

  useEffect(() => {
    if (doc) { setDocType(doc.documentType || ''); setDocName(doc.name || '') }
  }, [doc?.id])



  const handleVerify = async () => {
    if (!doc) return
    setBusy(true)
    try {
      await verifyDocument(doc.id, docType, docName, fields)
      showToast('Document verified ✓')
    } catch { showToast('Verify failed', 'error') }
    finally { setBusy(false) }
  }

  const handleRename = async () => {
    if (!doc) return
    setBusy(true)
    try {
      await renameDocument(doc.id, docName, docType)
      showToast('Document renamed ✓')
    } catch { showToast('Rename failed', 'error') }
    finally { setBusy(false) }
  }

  const handleMerge = async () => {
    if (!doc || !mergeTarget || mergeTarget === doc.id) return
    setBusy(true)
    try {
      await mergeDocuments(doc.id, mergeTarget)
      showToast('Documents merged ✓')
      setMergeTarget('')
    } catch { showToast('Merge failed', 'error') }
    finally { setBusy(false) }
  }

  const handleDownloadCSV = () => {
    if (!doc || !blob) return

    // Calculate metadata
    const docPagesSorted = [...doc.pages].sort((a, b) => a.order - b.order)
    const firstPage = pages.find(p => p.id === docPagesSorted[0]?.pageId)
    const lastPage = pages.find(p => p.id === docPagesSorted[docPagesSorted.length - 1]?.pageId)

    const metadata = [
      ['Document ID', doc.id],
      ['Document Type', doc.documentType],
      ['Total Pages (Package)', blob.pageCount],
      ['Page From', (firstPage?.originalIndex ?? 0) + 1],
      ['Page To', (lastPage?.originalIndex ?? 0) + 1],
      ['Extracted Value Page', (firstPage?.originalIndex ?? 0) + 1],
    ]

    const fieldEntries = Object.entries(fields).map(([k, v]) => [
      k,
      v,
      fieldPageMap[k]?.length ? [...fieldPageMap[k]].sort((a, b) => a - b).join(', ') : 'Manual'
    ])
    
    const rows = [
      ['Field', 'Value', 'Page'],
      ...metadata,
      ...fieldEntries
    ]

    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    
    const blobUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', `Extracted_Data_Doc_${doc.id}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Document data exported successfully', 'success')
  }

  const openExtractedValues = () => {
    setQaValues(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v ?? '')])))
    setShowRawJson(true)
  }

  const handleSaveValues = async (closeAfter) => {
    if (!doc) return
    setSavingValues(true)
    try {
      const merged = { ...fields, ...qaValues }
      setFields(merged)
      await verifyDocument(doc.id, docType, docName, merged)
      showToast(closeAfter ? 'Extracted values completed' : 'Extracted values saved', 'success')
      if (closeAfter) setShowRawJson(false)
    } catch (e) {
      showToast('Failed to save values: ' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setSavingValues(false)
    }
  }

  const createFollowUp = () => {
    showToast('Follow-up request created', 'success')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header flex justify-between items-center">
        <span>AI Properties</span>
        {doc && (
          <StatusBadge status={doc.status} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* ── LOW CONFIDENCE BANNER ── */}
        {page && (page.confidenceScore < 0.85 || (page.anomalyFlags && JSON.parse(page.anomalyFlags).length > 0)) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-600 dark:text-red-400 uppercase tracking-widest">Attention Required</p>
              <div className="text-xs text-red-700 dark:text-red-200/70 mt-1 space-y-1">
                {page.confidenceScore < 0.85 && <p>• Low AI confidence ({Math.round(page.confidenceScore * 100)}%).</p>}
                {page.anomalyFlags && JSON.parse(page.anomalyFlags).map((flag, idx) => (
                    <p key={idx}>• {flag}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Current Page Info ── */}
        {page && (
          <Section title="Current Page" icon={<FileText className="w-3.5 h-3.5" />}>
            <InfoRow label="AI Label" value={page.aiLabel || '—'} />
            <InfoRow label="Confidence" value={(page.confidenceScore !== null && page.confidenceScore !== undefined) ? `${(page.confidenceScore * 100).toFixed(1)}%` : '—'} />
            <InfoRow label="Index" value={`Page ${(pages.findIndex(p => p.id === page.id)) + 1}`} />
            {page.isFlagged && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-600 dark:text-red-400 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Flagged for review
              </div>
            )}
          </Section>
        )}

        {/* ── Verification Checklist (Document-wide) ── */}
        {doc && (
          <Section title="Verification Checklist" icon={<List className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}>
              <div className="flex items-center justify-between mb-3 border-b border-main pb-2">
                 <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Extracted Fields</span>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-300 transition-colors group"
                    >
                      <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      DOWNLOAD CSV
                    </button>
                    <button 
                      onClick={openExtractedValues}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 transition-colors group"
                    >
                      <FileJson className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      EXTRACTED VALUES
                    </button>
                 </div>
              </div>

          </Section>
        )}
        <Section title="Documents" icon={<Layers className="w-3.5 h-3.5" />}>
          <div className="space-y-4">
            <button
              onClick={() => setFilterLabel(null)}
              className={`
                w-full text-left px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors
                ${filterLabel === null 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' 
                  : 'text-muted hover:text-indigo-500'}
              `}
            >
              Show All
            </button>
            {/* Get all unique labels from pages */}
            {Array.from(new Set(pages.map(p => p.aiLabel || 'Unclassified'))).sort().map(type => {
const docsOfThisType = documents.filter(d => d.documentType === type);
              
              return (
                <div key={type} className="space-y-1">
                  <button
                    onClick={() => setFilterLabel(type)}
                    className={`
                      w-full text-left px-1 py-1 rounded text-[10px] font-bold uppercase tracking-widest pl-1 transition-colors
                      ${filterLabel === type 
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' 
                        : 'text-indigo-500 hover:text-indigo-600'}
                    `}
                  >
                    {type}
                  </button>
                  
                  {docsOfThisType.length > 0 && docsOfThisType.map((d) => (
                    <button
                      key={d.id}
                      id={`doc-select-${d.id}`}
                      onClick={() => selectDocument(d.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border
                        ${d.id === selectedDocumentId
                          ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-600 dark:text-indigo-200'
                          : 'bg-surface-700 border-main text-muted hover:dark:border-white/20 border-black/20'}
                      `}
                    >
                      <p className="font-medium truncate text-main">{d.name}</p>
                      <p className="text-muted mt-0.5">{d.documentType} · {d.pages?.length ?? 0}p</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Document Checklist ── */}

        {/* ── Document Editor ── */}
        {doc && (
          <Section title="Edit Document" icon={<FileText className="w-3.5 h-3.5" />}>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Classification</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-indigo-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <select
                  id="doc-type-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="
                    w-full bg-main border border-main rounded-xl px-4 py-3 pr-10
                    text-sm text-main appearance-none focus:outline-none focus:border-indigo-500/50
                    cursor-pointer transition-all
                  "
                >
                  <optgroup label="AI BEST GUESS" className="text-indigo-600 dark:text-indigo-400">
                    <option value={doc.documentType} className="bg-indigo-900/40">{doc.documentType} (Confident)</option>
                  </optgroup>
                  <optgroup label="COMMON MORTGAGE TYPES" className="text-muted">
                    {availableTypes.filter(t => t.code !== doc.documentType).map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
               <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Internal Name</label>
                  <input
                    id="doc-name-input"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Auto-generated name..."
                    className="
                      w-full bg-main border border-main rounded-xl px-4 py-3
                      text-sm text-main placeholder-slate-700
                      focus:outline-none focus:border-indigo-500/50 transition-all
                    "
                  />
               </div>

               <div className="flex gap-2">
                 <button
                   id="verify-doc-btn"
                   className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                   onClick={handleVerify}
                   disabled={busy}
                 >
                   <CheckCircle2 className="w-4 h-4" />
                   {busy ? 'SYNCHRONIZING...' : 'VERIFY & LOCK'}
                 </button>
               </div>
            </div>
          </Section>
        )}

        {/* ── Merge ── */}
        {doc && documents.length > 1 && (
          <Section title="Merge Into" icon={<Merge className="w-3.5 h-3.5" />}>
            <p className="text-xs text-muted mb-2">Merge current document into another:</p>
            <div className="relative">
              <select
                id="merge-target-select"
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="
                  w-full bg-surface-700 border border-main rounded-lg px-3 py-2 pr-8
                  text-sm text-main appearance-none focus:outline-none focus:border-indigo-500
                "
              >
                <option value="">Select target…</option>
                {documents.filter((d) => d.id !== doc.id).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
            <button
              id="merge-doc-btn"
              className="btn-danger w-full mt-2 text-xs justify-center"
              onClick={handleMerge}
              disabled={!mergeTarget || busy}
            >
              <Merge className="w-3.5 h-3.5" /> Merge Documents
            </button>
          </Section>
        )}
      </div>

      {/* Extracted Values Modal */}
      {showRawJson && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowRawJson(false)}
        >
          <div
            className="w-[min(94vw,1100px)] max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
              <h3 className="text-[15px] font-semibold text-[#334155] dark:text-slate-100">Note</h3>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-md bg-[#F4F5FC] dark:bg-slate-800 text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">
                  Task Status: {blob?.status || '—'}
                </span>
                <span className="px-3 py-1 rounded-md bg-[#F4F5FC] dark:bg-slate-800 text-[11px] font-medium text-[#5B6B82] dark:text-slate-300">
                  Loan Number: {blob?.batchNo || '—'}
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="flex items-center px-6 py-2 bg-[#F3F5FF] dark:bg-slate-800/50">
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400">Name</span>
              <span className="w-56 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400">OCRValue</span>
              <span className="w-56 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400">Seller Data</span>
              <span className="w-56 text-[11px] font-semibold uppercase tracking-wider text-[#7C8CA0] dark:text-slate-400">QA Value</span>
            </div>

            {/* Value rows */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const entries = Object.entries(fields)
                if (!doc) return <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-6 py-4">Select a document to see its extracted values.</p>
                if (entries.length === 0) return <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-6 py-4">No extracted values available for this document.</p>
                return entries.map(([k, v], idx) => (
                  <div
                    key={k}
                    className={`flex items-center px-6 py-2.5 border-b border-[#D3D3D3] dark:border-slate-700/60 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/40' : 'bg-[#FAFAFA] dark:bg-slate-800/20'}`}
                  >
                    <span className="flex-1 text-[13px] leading-snug text-[#5C6B7A] dark:text-slate-300 pr-6">
                      {k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <span className="w-56 text-[13px] font-mono text-[#334155] dark:text-slate-200 truncate">{String(v ?? '') || '—'}</span>
                    <span className="w-56 text-[13px] font-mono text-[#9AA8B8] dark:text-slate-500 truncate">—</span>
                    <input
                      value={qaValues[k] ?? ''}
                      onChange={e => setQaValues(prev => ({ ...prev, [k]: e.target.value }))}
                      placeholder="—"
                      className="w-56 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#D3D3D3] dark:border-slate-600 text-[12px] font-mono text-[#334155] dark:text-slate-200 outline-none focus:border-[#2E7EFA] transition-colors"
                    />
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
                onClick={() => handleSaveValues(true)}
                className="px-4 py-[7px] rounded-lg bg-[#2E7EFA] hover:bg-[#1f6ff3] text-white text-[12px] font-medium transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() => handleSaveValues(false)}
                disabled={savingValues}
                className="px-4 py-[7px] rounded-lg bg-white dark:bg-slate-800 border border-[#A8BFD6] dark:border-slate-600 text-[12px] font-medium text-[#6A93B0] dark:text-slate-300 hover:bg-[#F7FAFD] dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {savingValues ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowRawJson(false)}
                className="px-4 py-[7px] rounded-lg bg-white dark:bg-slate-800 border border-[#A8BFD6] dark:border-slate-600 text-[12px] font-medium text-[#6A93B0] dark:text-slate-300 hover:bg-[#F7FAFD] dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white/5 p-4 rounded-xl border border-main mb-4">
      <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-muted mb-4 pb-2 border-b border-main">
        <span className="text-indigo-500">{icon}</span> {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-main last:border-0 group">
      <span className="text-[11px] text-muted group-hover:dark:text-slate-400 group-hover:text-slate-600 transition-colors">{label}</span>
      <span className="text-[11px] font-bold text-main font-mono tracking-tight">{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'HUMAN_VERIFIED') return <span className="badge-verified">Verified</span>
  if (status === 'AI_CLASSIFIED') return <span className="badge-ai">AI</span>
  return null
}
