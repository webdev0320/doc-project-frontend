import { useState, useEffect } from 'react'
import { fetchConfiguredDocTypes } from '../api/client'
import useWorkspaceStore from '../store/workspaceStore'
import { CheckCircle2, ChevronDown, FileText, Layers, Merge, AlertTriangle, List, Check, Square, FileJson, X } from 'lucide-react'


export default function PropertiesPanel() {
  const {
    pages, documents, selectedPageId, selectedDocumentId,
    selectDocument, verifyDocument, renameDocument, mergeDocuments
  } = useWorkspaceStore()

  const page = pages.find((p) => p.id === selectedPageId)
  const doc = documents.find((d) => d.id === selectedDocumentId)

  const [docType, setDocType] = useState('')
  const [docName, setDocName] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [checkedFields, setCheckedFields] = useState(new Set())
  const [isAddingField, setIsAddingField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [availableTypes, setAvailableTypes] = useState([])
  const [showRawJson, setShowRawJson] = useState(false)

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

  const filteredFields = Object.entries(fields)
    .filter(([k, v]) => k.toLowerCase().includes(searchQuery.toLowerCase()) || String(v).toLowerCase().includes(searchQuery.toLowerCase()))


  const toggleCheck = (key) => {
    const next = new Set(checkedFields)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCheckedFields(next)
  }

  const handleAddField = () => {
    if (!newFieldName.trim()) return
    setFields(prev => ({ ...prev, [newFieldName]: newFieldValue }))
    setNewFieldName('')
    setNewFieldValue('')
    setIsAddingField(false)
  }

  useEffect(() => {
    if (doc) { setDocType(doc.documentType || ''); setDocName(doc.name || '') }
  }, [doc?.id])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <span>AI Properties</span>
        {doc && (
          <StatusBadge status={doc.status} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        
        {/* ── LOW CONFIDENCE BANNER ── */}
        {page && (page.confidenceScore < 0.85 || (page.anomalyFlags && JSON.parse(page.anomalyFlags).length > 0)) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Attention Required</p>
              <p className="text-xs text-red-200/70 mt-0.5">
                {page.confidenceScore < 0.85 ? 'Low AI confidence.' : ''} 
                {page.anomalyFlags && JSON.parse(page.anomalyFlags).join(', ')} detected.
              </p>
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
              <div className="flex items-center gap-1.5 text-xs text-red-300 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Flagged for review
              </div>
            )}
          </Section>
        )}

        {/* ── Verification Checklist (Document-wide) ── */}
        {doc && (
          <Section title="Verification Checklist" icon={<List className="w-3.5 h-3.5 text-emerald-400" />}>
             <div className="flex items-center justify-between mb-3 border-b dark:border-white/5 border-black/5 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Extracted Fields</span>
                <button 
                  onClick={() => setShowRawJson(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors group"
                >
                  <FileJson className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  EXTRACTED VALUES
                </button>
             </div>

          </Section>
        )}
        <Section title="Documents" icon={<Layers className="w-3.5 h-3.5" />}>
          <div className="space-y-1">
            {documents.map((d) => (
              <button
                key={d.id}
                id={`doc-select-${d.id}`}
                onClick={() => selectDocument(d.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 border
                  ${d.id === selectedDocumentId
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-surface-700 dark:border-white/5 border-black/5 dark:text-slate-300 text-slate-700 hover:dark:border-white/20 border-black/20'}
                `}
              >
                <p className="font-medium truncate">{d.name}</p>
                <p className="text-slate-500 mt-0.5">{d.documentType} · {d.pages?.length ?? 0}p</p>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Document Checklist ── */}

        {/* ── Document Editor ── */}
        {doc && (
          <Section title="Edit Document" icon={<FileText className="w-3.5 h-3.5" />}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Classification</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-indigo-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <select
                  id="doc-type-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="
                    w-full bg-[#13161e] border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 pr-10
                    text-sm dark:text-white text-slate-900 appearance-none focus:outline-none focus:border-indigo-500/50
                    cursor-pointer transition-all
                  "
                >
                  <optgroup label="AI BEST GUESS" className="text-indigo-400">
                    <option value={doc.documentType} className="bg-indigo-900/40">{doc.documentType} (Confident)</option>
                  </optgroup>
                  <optgroup label="COMMON MORTGAGE TYPES" className="text-slate-500">
                    {availableTypes.filter(t => t.code !== doc.documentType).map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Name</label>
                  <input
                    id="doc-name-input"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Auto-generated name..."
                    className="
                      w-full bg-[#13161e] border dark:border-white/10 border-black/10 rounded-xl px-4 py-3
                      text-sm dark:text-white text-slate-900 placeholder-slate-700
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
            <p className="text-xs text-slate-500 mb-2">Merge current document into another:</p>
            <div className="relative">
              <select
                id="merge-target-select"
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="
                  w-full bg-surface-700 border dark:border-white/10 border-black/10 rounded-lg px-3 py-2 pr-8
                  text-sm dark:text-white text-slate-900 appearance-none focus:outline-none focus:border-indigo-500
                "
              >
                <option value="">Select target…</option>
                {documents.filter((d) => d.id !== doc.id).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-slate-600 pointer-events-none" />
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

      {/* Toast notification */}
      {toast && (
        <div className={`
          absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl text-xs font-medium
          flex items-center gap-2 shadow-xl border fade-up
          ${toast.type === 'error'
            ? 'bg-red-600/20 border-red-500/30 text-red-200'
            : 'bg-green-600/20 border-green-500/30 text-green-200'}
        `}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      {/* Extracted Values Modal */}
      {showRawJson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0d0f14] border dark:border-white/10 border-black/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/5 border-black/5 shrink-0">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-widest">Extracted Values</h3>
              </div>
              <button onClick={() => setShowRawJson(false)} className="p-2 hover:dark:bg-white/5 bg-black/5 rounded-full text-slate-500 hover:dark:text-white text-slate-900 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-surface-900/50">
               <div className="space-y-4">
                 {/* Search Bar */}
                 <div className="relative">
                   <input 
                     placeholder="Search extracted data..." 
                     className="w-full bg-[#13161e] border dark:border-white/5 border-black/5 rounded-lg px-4 py-3 text-sm dark:text-white text-slate-900 placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-all"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                   />
                   <List className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                 </div>

                 <div className="space-y-3">
                   {filteredFields.map(([k, v]) => (
                     <div 
                       key={k} 
                       className={`
                         flex items-start gap-3 p-4 rounded-xl transition-all border group
                         ${checkedFields.has(k) 
                           ? 'bg-emerald-500/10 border-emerald-500/30' 
                           : 'dark:bg-white/5 bg-black/5 dark:border-white/5 border-black/5 hover:border-indigo-500/30'}
                       `}
                     >
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleCheck(k); }}
                          className={`
                            mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0
                            ${checkedFields.has(k) ? 'bg-emerald-500 border-emerald-500 dark:text-white text-slate-900' : 'dark:border-white/20 border-black/20 text-transparent hover:border-white/40'}
                          `}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-xs font-bold uppercase tracking-wide truncate mb-1 ${checkedFields.has(k) ? 'text-emerald-400' : 'dark:text-slate-400 text-slate-600'}`}>
                              {k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </p>
                            {checkedFields.has(k) && <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in" />}
                          </div>
                          <input 
                            value={v}
                            onChange={(e) => {
                               const newVal = e.target.value;
                               setFields(prev => ({ ...prev, [k]: newVal }));
                            }}
                            className={`
                              w-full bg-[#1a1d24]/80 border dark:border-white/5 border-black/5 rounded-lg px-3 py-2 text-sm font-mono mt-1 outline-none focus:border-indigo-500/50 transition-all
                              ${checkedFields.has(k) ? 'text-emerald-100' : 'text-indigo-200'}
                            `}
                          />
                        </div>
                     </div>
                   ))}
                   
                   {filteredFields.length === 0 && searchQuery && (
                     <div className="text-center py-8 text-slate-600 text-sm italic">No matches for "{searchQuery}"</div>
                   )}
                 </div>

                 {/* Add Field Input */}
                 {isAddingField ? (
                    <div className="dark:bg-white/5 bg-black/5 border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-in fade-in shadow-2xl mt-4">
                       <input 
                         placeholder="Label (e.g. Loan Number)" 
                         className="w-full bg-[#13161e] border dark:border-white/10 border-black/10 rounded-lg px-3 py-2.5 text-sm dark:text-white text-slate-900 placeholder-slate-700 outline-none focus:border-indigo-500/50"
                         value={newFieldName}
                         onChange={e => setNewFieldName(e.target.value)}
                         autoFocus
                       />
                       <input 
                         placeholder="Value" 
                         className="w-full bg-[#13161e] border dark:border-white/10 border-black/10 rounded-lg px-3 py-2.5 text-sm dark:text-white text-slate-900 placeholder-slate-700 outline-none focus:border-indigo-500/50"
                         value={newFieldValue}
                         onChange={e => setNewFieldValue(e.target.value)}
                       />
                       <div className="flex gap-3 pt-2">
                          <button onClick={handleAddField} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95">ADD FIELD</button>
                          <button onClick={() => setIsAddingField(false)} className="px-4 py-2.5 dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 rounded-lg text-xs font-bold transition-all">CANCEL</button>
                       </div>
                    </div>
                 ) : (
                    <button 
                      onClick={() => setIsAddingField(true)}
                      className="w-full mt-4 py-4 border border-dashed dark:border-white/10 border-black/10 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group"
                    >
                       <div className="w-6 h-6 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                          <Check className="w-4 h-4" />
                       </div> 
                       ADD MANUAL FIELD
                    </button>
                 )}
               </div>
            </div>

            <div className="p-4 dark:bg-white/5 bg-black/5 flex justify-end gap-3 shrink-0 border-t dark:border-white/5 border-black/5">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(combinedExtractedData, null, 2))
                  alert('JSON copied to clipboard')
                }}
                className="px-4 py-2 dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 bg-black/10 dark:text-slate-300 text-slate-700 text-[10px] font-bold rounded-lg transition-all active:scale-95"
              >
                COPY RAW JSON
              </button>
              <button 
                onClick={() => {
                  const keys = Object.keys(fields);
                  if (keys.length === 0) return;
                  let csvContent = "data:text/csv;charset=utf-8,Field,Value\n";
                  keys.forEach(k => {
                    const escapedKey = `"${k.replace(/"/g, '""')}"`;
                    const escapedValue = `"${String(fields[k] || '').replace(/"/g, '""')}"`;
                    csvContent += `${escapedKey},${escapedValue}\n`;
                  });
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `${docName || 'extracted_data'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 dark:text-white text-slate-900 text-[10px] font-bold rounded-lg transition-all active:scale-95 flex items-center gap-2"
              >
                EXPORT TO EXCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b dark:border-white/5 border-black/5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium dark:text-slate-200 text-slate-800 font-mono">{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'HUMAN_VERIFIED') return <span className="badge-verified">Verified</span>
  if (status === 'AI_CLASSIFIED') return <span className="badge-ai">AI</span>
  return null
}
