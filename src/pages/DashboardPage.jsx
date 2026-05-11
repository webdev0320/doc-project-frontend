import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadBlob, fetchBlobs, fetchInboundFiles, deleteBlob } from '../api/client'
import {
  CloudUpload, FileText, Loader2, CheckCircle2,
  AlertCircle, Search, Calendar, Filter, ArrowRight, Settings,
  MoreVertical, Clock, Check, Trash2, X, LogOut, User as UserIcon,
  ChevronDown, ArrowUpDown, MoreHorizontal, History, Zap, Bell
} from 'lucide-react'
import { assignBlob } from '../api/client'
import { Sun, Moon } from 'lucide-react'
import useThemeStore from '../store/themeStore'
import useAuthStore from '../store/authStore'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState([]) // Tracker for current uploads
  const [blobs, setBlobs] = useState([]) // Persistent list from server
  const [search, setSearch] = useState('')
  const [filterBatchNo, setFilterBatchNo] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [loadingBlobs, setLoadingBlobs] = useState(true)
  const [assigningBlob, setAssigningBlob] = useState(null)
  const [batchNo, setBatchNo] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)


  const [inboundFiles, setInboundFiles] = useState([])

  useEffect(() => {
    loadBlobs()
    loadInboundFiles()
    const interval = setInterval(() => {
      loadBlobs()
      loadInboundFiles()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadInboundFiles = async () => {
    try {
      const { data } = await fetchInboundFiles()
      setInboundFiles(data.data)
    } catch (e) {
      console.error('Failed to load inbound files', e)
    }
  }

  const loadBlobs = async () => {
    try {
      const { data } = await fetchBlobs()
      setBlobs(data.data)
    } catch (e) {
      console.error('Failed to load blobs', e)
    } finally {
      setLoadingBlobs(false)
    }
  }

  const handleFiles = async (files) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf')
    if (pdfs.length === 0) return

    const newUploads = pdfs.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
      status: 'uploading'
    }))

    setUploads(prev => [...newUploads, ...prev])

    for (let i = 0; i < pdfs.length; i++) {
      const file = pdfs[i]
      const trackerId = newUploads[i].id

      try {
        const { data } = await uploadBlob(file, (p) => {
          setUploads(curr => curr.map(u => u.id === trackerId ? { ...u, progress: p } : u))
        })
        setUploads(curr => curr.map(u => u.id === trackerId ? { ...u, status: 'done', message: 'Sent to SFTP' } : u))
        loadInboundFiles()
      } catch (e) {
        setUploads(curr => curr.map(u => u.id === trackerId ? { ...u, status: 'error', error: e.message } : u))
      }
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const filteredBlobs = blobs.filter(b => {
    const matchSearch = b.filename.toLowerCase().includes(search.toLowerCase())
    const matchBatch = filterBatchNo ? b.batchNo?.toLowerCase().includes(filterBatchNo.toLowerCase()) : true
    const matchUser = filterUser ? b.assignedTo?.name?.toLowerCase().includes(filterUser.toLowerCase()) : true
    const matchStatus = filterStatus ? b.status === filterStatus : true
    const matchDate = filterDate ? new Date(b.createdAt).toISOString().split('T')[0] === filterDate : true
    
    return matchSearch && matchBatch && matchUser && matchStatus && matchDate
  })

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this blob and all its data? This cannot be undone.')) return
    try {
      await deleteBlob(id)
      setBlobs(curr => curr.filter(b => b.id !== id))
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  const handleAssign = async () => {
    if (!batchNo.trim()) return alert('Please enter a batch number')
    setIsAssigning(true)
    try {
      await assignBlob(assigningBlob.id, batchNo)
      setAssigningBlob(null)
      setBatchNo('')
      loadBlobs()
    } catch (e) {
      alert('Assignment failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setIsAssigning(false)
    }
  }

  const stats = {
    inQueue: blobs.filter(b => b.status === 'PENDING' || b.status === 'PROCESSING').length,
    inProgress: blobs.filter(b => b.status === 'IN-PROGRESS').length,
    rejected: blobs.filter(b => b.status === 'FAILED').length,
    completed: blobs.filter(b => b.status === 'COMPLETED').length,
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }


  return (
    <div className="min-h-screen bg-main text-main">
      {/* Search Header */}
      <header className="sticky top-0 z-10 glass border-b border-main px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-5 h-5 dark:text-white text-slate-900" />
            </div>
            <span className="font-bold text-lg tracking-tight dark:text-white text-slate-900">Workbench</span>
          </div>

          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search blobs by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-main rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin')}
              className="mr-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all border border-indigo-500/20 text-xs font-bold flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Admin Console
            </button>
          )}

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold dark:text-white text-slate-900 leading-none">{user?.name || 'Operator'}</span>
            <span className="text-[10px] text-muted uppercase tracking-tighter">{user?.role}</span>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl dark:bg-white/5 bg-black/5 text-muted dark:hover:bg-white/10 hover:bg-black/10 dark:hover:text-white hover:text-slate-900 transition-all border border-main"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="p-2.5 rounded-xl dark:bg-white/5 bg-black/5 text-muted hover:bg-red-500/10 hover:text-red-400 transition-all border border-main"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{getGreeting()}, {user?.name?.split(' ')[0] || 'Operator'}</h2>
            <p className="text-muted text-sm mt-1">Here is what is happening with your loan pipeline today.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-surface border border-main rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">{blobs.length} Active Blobs</span>
             </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard label="In Queue" value={stats.inQueue} color="text-indigo-400" sub="Waiting for AI" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-blue-400" sub="Human Review" />
          <StatCard label="Rejected" value={stats.rejected} color="text-red-400" sub="Failed extraction" />
          <StatCard label="Completed" value={stats.completed} color="text-emerald-400" sub="Ready for SFTP" />

          {/* Ageing Card */}
          <div className="card-surface border border-main rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Ageing</h4>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden dark:bg-white/5 bg-black/5 mb-4">
                <div className="w-1/3 bg-red-500/40" />
                <div className="w-1/2 bg-yellow-500/40" />
                <div className="w-1/6 bg-emerald-500/40" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">3</div>
                  <div className="text-[10px] text-muted mt-1">0-5 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">0</div>
                  <div className="text-[10px] text-muted mt-1">6-10 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">1</div>
                  <div className="text-[10px] text-muted mt-1">11-15 Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* SLA Card */}
          <div className="card-surface border border-main rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Nearing SLA</h4>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden dark:bg-white/5 bg-black/5 mb-4">
                <div className="w-[10%] bg-red-500/40" />
                <div className="w-[20%] bg-orange-500/40" />
                <div className="w-[30%] bg-yellow-500/40" />
                <div className="w-[40%] bg-emerald-500/40" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">0</div>
                  <div className="text-[10px] text-muted mt-1">5m</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">0</div>
                  <div className="text-[10px] text-muted mt-1">10m</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">0</div>
                  <div className="text-[10px] text-muted mt-1">30m</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold dark:text-white text-slate-900">0</div>
                  <div className="text-[10px] text-muted mt-1">1hr</div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Ingestion Card */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
            className={`
              relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
              flex flex-col items-center justify-center p-6
              ${dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-main card-surface hover:border-indigo-500/30 hover:bg-surface'}
            `}
          >
            <input ref={inputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CloudUpload className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-sm font-bold dark:text-white text-slate-900 mb-1">Smart Ingestion</h2>
              <p className="text-[10px] text-muted leading-tight">
                Drag & drop mortgage packages. AI will <span className="text-indigo-400">explode</span> & <span className="text-indigo-400">classify</span>.
              </p>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />
          </div>
        </div>



        {/* Active Uploads Monitoring */}
        {uploads.length > 0 && (
          <section className="fade-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">Live Monitors</h3>
              <button onClick={() => setUploads([])} className="text-xs text-slate-600 hover:text-muted">Clear Finished</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {uploads.map(u => (
                <UploadCard 
                  key={u.id} 
                  upload={u} 
                  onOpen={() => navigate(`/workspace/${u.blobId}`)} 
                  onCancel={() => setUploads(curr => curr.filter(x => x.id !== u.id))}
                />
              ))}
            </div>
          </section>
        )}

        {/* SFTP Inbound Files Monitoring */}
        {inboundFiles.length > 0 && (
          <section className="fade-up space-y-4">
            <div className="flex items-center justify-between border-b border-main pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">SFTP Inbound Queue</h3>
              <div className="flex items-center gap-2 text-xs text-muted font-mono">
                Queued: {inboundFiles.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {inboundFiles.map((file, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-surface border-main transition-all duration-300 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold dark:text-white text-slate-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-muted">Waiting for SFTP Poller...</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main List */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-main pb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">Recent Blobs</h3>
              <div className="flex items-center gap-2 text-xs text-muted font-mono">
                Total: {blobs.length} | Processed: {blobs.filter(b => b.status === 'COMPLETED').length}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Batch No Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Filter by Batch No..." 
                  value={filterBatchNo}
                  onChange={e => setFilterBatchNo(e.target.value)}
                  className="w-full bg-surface border border-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* User Filter */}
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Filter by User..." 
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-surface border border-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full bg-surface border border-main rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all dark:[color-scheme:dark]"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-surface border border-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN-PROGRESS">IN-PROGRESS</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-main bg-surface/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="card-surface border-b border-main text-[10px] font-bold text-muted uppercase tracking-widest">
                  <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded bg-surface-700 border-main" /></th>
                  <th className="px-4 py-4">Batch Completed Date</th>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Batch No.</th>
                  <th className="px-4 py-4">Received Date</th>
                  <th className="px-4 py-4">Available Date</th>
                  <th className="px-4 py-4 text-center">Total Pages</th>
                  <th className="px-4 py-4">Time Taken</th>
                  <th className="px-4 py-4">Batch Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingBlobs ? (
                  <tr>
                    <td colSpan="13" className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
                      <p className="text-sm text-muted">Fetching repository...</p>
                    </td>
                  </tr>
                ) : filteredBlobs.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="py-20 text-center">
                      <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-muted">No blobs found matching your search</p>
                    </td>
                  </tr>
                ) : (
                  filteredBlobs.map(blob => {
                    const calculateTimeTaken = (blob) => {
                      if (!blob.assignedAt) return '-'
                      const end = blob.completedAt ? new Date(blob.completedAt) : new Date()
                      const start = new Date(blob.assignedAt)
                      const diffMs = end - start
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)
                      
                      if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`
                      if (diffMins > 0) return `${diffMins}m ${diffSecs}s`
                      return `${diffSecs}s`
                    }

                    return (
                      <tr 
                        key={blob.id} 
                        className="group hover:dark:bg-white/5 bg-black/5 transition-colors cursor-pointer"
                        onClick={() => navigate(`/workspace/${blob.id}`)}
                      >
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" className="rounded bg-surface-700 border-main" />
                        </td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {blob.completedAt ? new Date(blob.completedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4">
                          {blob.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                                {blob.assignedTo.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-xs dark:text-white text-slate-900">{blob.assignedTo.name || 'SYSTEM'}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setAssigningBlob(blob) }}
                              className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                            >
                              Assign to Me
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-indigo-400 font-medium">{blob.batchNo || '-'}</td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {new Date(blob.createdAt).toLocaleDateString()}<br/>
                          <span className="text-[10px] text-muted">{new Date(blob.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {new Date(blob.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-xs dark:text-slate-300 text-slate-700 text-center font-bold">{blob.pageCount}</td>
                        <td className="px-4 py-4 text-xs text-muted">
                          {calculateTimeTaken(blob)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={blob.status} />
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleDelete(e, blob.id)}
                            className="p-2 rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })

                )}
              </tbody>
            </table>
          </div>

          {/* Assignment Modal */}
          {assigningBlob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-surface border border-main rounded-2xl w-full max-w-md shadow-2xl fade-up overflow-hidden">
                <div className="px-6 py-4 border-b border-main flex items-center justify-between">
                  <h3 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-widest">Assign Document</h3>
                  <button onClick={() => setAssigningBlob(null)} className="text-muted hover:dark:text-white text-slate-900"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-xs text-muted mb-1">Document Name</p>
                    <p className="text-sm font-bold dark:text-white text-slate-900 truncate">{assigningBlob.filename}</p>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Batch Number</label>
                    <input 
                      type="text"
                      placeholder="Enter batch number (e.g. 2025020401)"
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                      className="w-full bg-main border border-main rounded-xl px-4 py-3 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => setAssigningBlob(null)}
                      className="flex-1 px-4 py-2.5 rounded-xl dark:bg-white/5 bg-black/5 text-muted hover:dark:bg-white/10 bg-black/10 text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAssign}
                      disabled={isAssigning || !batchNo.trim()}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:text-white text-slate-900 text-xs font-bold transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                    >
                      {isAssigning ? 'Assigning...' : 'Proceed'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  )
}

function UploadCard({ upload, onOpen, onCancel }) {
  const isDone = upload.status === 'done'
  const isError = upload.status === 'error'

  return (
    <div className={`
      p-4 rounded-2xl border transition-all duration-300
      ${isDone ? 'bg-green-500/5 border-green-500/20' : isError ? 'bg-red-500/5 border-red-500/20' : 'bg-surface border-main'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {isDone ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold dark:text-white text-slate-900 truncate w-40">{upload.name}</p>
            <p className="text-[10px] text-muted">{isDone ? 'Sent to SFTP Inbound' : 'Uploading...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDone && upload.blobId && (
            <button onClick={onOpen} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:dark:bg-white/5 bg-black/5 text-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isDone && !isError && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>Progress</span>
            <span>{upload.progress}%</span>
          </div>
          <div className="h-1 dark:bg-white/5 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${upload.progress}%` }} />
          </div>
        </div>
      )}

      {isError && <p className="text-[10px] text-red-400 mt-2">{upload.error}</p>}
    </div>
  )
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="card-surface p-6 flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-300">
      <div>
        <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{label}</h4>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-[10px] text-muted mt-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity">{sub}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const statusStyles = {
    PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
    'IN-PROGRESS': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    PROCESSING: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  }

  const steps = {
    PENDING: 'In-Queue',
    'IN-PROGRESS': 'In-Progress',
    PROCESSING: 'Exploding',
    COMPLETED: 'Completed'
  }

  return (
    <div className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyles[status] || statusStyles.PENDING}`}>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        {status === 'PROCESSING' && <Loader2 className="w-3 h-3 animate-spin" />}
        {steps[status] || status}
      </span>
    </div>
  )
}

