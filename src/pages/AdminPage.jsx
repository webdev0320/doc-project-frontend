import { useState, useEffect } from 'react'
import {
  fetchUsers, createUser, updateUser, deleteUser, resetPassword,
  fetchConfiguredDocTypes, createConfiguredDocType, updateConfiguredDocType, deleteConfiguredDocType,
  fetchStorageSettings, updateStorageSettings,
  fetchChecklists, createChecklist, deleteChecklist
  , fetchEngineErrors, fetchFailedBlobs,
  fetchAdminBlobs, fetchAdminBlobDocuments, adminRenameDocument, adminUpdateExtractedData,
  fetchAdminPackages, fetchAdminPackage, adminSetPackageAiLabels, adminSetPackageExtractedValues, adminSetPackageChecklist
} from '../api/client'
import {
  Users, FileStack, ShieldAlert, Plus, Trash2,
  CheckCircle, XCircle, ChevronRight, Settings,
  ArrowLeft, Search, Mail, Server, Cloud, Edit2, X, List, FileText, FileJson, Upload, Package, Tags, Download
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'doctypes' | 'checklists' | 'processing' | 'settings' | 'indexing' | 'extracted' | 'uploads'
  // allow 'processing' tab

  return (
    <div className="min-h-screen bg-surface-900 text-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r dark:border-white/5 border-black/5 bg-surface-900/50 flex flex-col">
        <div className="p-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:dark:text-white text-slate-900 transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to App
          </button>

          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 dark:text-white text-slate-900" />
            </div>
            <span className="font-bold text-lg dark:text-white text-slate-900">Admin Console</span>
          </div>

          <nav className="space-y-1">
            <TabBtn
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={<Users className="w-4 h-4" />}
              label="User Management"
            />
            <TabBtn
              active={activeTab === 'doctypes'}
              onClick={() => setActiveTab('doctypes')}
              icon={<FileStack className="w-4 h-4" />}
              label="Document Types"
            />
            <TabBtn
              active={activeTab === 'checklists'}
              onClick={() => setActiveTab('checklists')}
              icon={<List className="w-4 h-4" />}
              label="Checklists"
            />
            <TabBtn
              active={activeTab === 'processing'}
              onClick={() => setActiveTab('processing')}
              icon={<Server className="w-4 h-4" />}
              label="Processing"
            />
            <TabBtn
              active={activeTab === 'indexing'}
              onClick={() => setActiveTab('indexing')}
              icon={<FileText className="w-4 h-4" />}
              label="Document Indexing"
            />
            <TabBtn
              active={activeTab === 'extracted'}
              onClick={() => setActiveTab('extracted')}
              icon={<FileJson className="w-4 h-4" />}               label="Extracted Values"
            />
            <TabBtn
               active={activeTab === 'uploads'}
               onClick={() => setActiveTab('uploads')}
               icon={<Upload className="w-4 h-4" />}
               label="Uploaded Packages"
            />
            <TabBtn
               active={activeTab === 'settings'}
               onClick={() => setActiveTab('settings')}
               icon={<Settings className="w-4 h-4" />}
               label="System Settings"
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t dark:border-white/5 border-black/5">
           <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-xs text-slate-400">Database Synchronized</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
         <header className="p-8 border-b dark:border-white/5 border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold dark:text-white text-slate-900 truncate">
                {activeTab === 'users' ? 'Manage Users' : activeTab === 'doctypes' ? 'Managed Document Types' : activeTab === 'checklists' ? 'Global Checklists' : activeTab === 'indexing' ? 'Document Indexing' : activeTab === 'extracted' ? 'Extracted Values Editor' : activeTab === 'uploads' ? 'Uploaded Packages' : 'System Settings'}
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                {activeTab === 'users'
                  ? 'Control access levels and operator status.'
                  : activeTab === 'doctypes' ? 'Configure classifications available for the AI and HITL workforce.'
                  : activeTab === 'checklists' ? 'Manage global checklist requirements applicable to all documents.'
                  : activeTab === 'indexing' ? 'Rename document types across all blobs with per-blob workspace view.'
                  : activeTab === 'extracted' ? 'View and update extracted field values for any document.'
                  : activeTab === 'uploads' ? 'All packages uploaded by users. Set page classifications, extracted values and the Missing Document Checklist of any package from JSON.'
                  : 'Configure global system parameters including storage providers.'}
              </p>
            </div>
         </header>

        <div className="p-8">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'doctypes' && <DocTypeManagement />}
          {activeTab === 'checklists' && <ChecklistManagement />}
          {activeTab === 'processing' && <ProcessingAdmin />}
          {activeTab === 'indexing' && <DocumentIndexing />}
          {activeTab === 'extracted' && <ExtractedValuesEditor />}
          {activeTab === 'uploads' && <UploadedPackages />}
          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  )
}

// ── User Management Sub-Page ──

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', role: 'OPERATOR' })
  const [searchQuery, setSearchQuery] = useState('')
  const [resettingUser, setResettingUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await fetchUsers()
      setUsers(data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally { setLoading(false) }
  }

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long."
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter."
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character."
    return null
  }

  const [pwdErrorState, setPwdErrorState] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    
    const pwdError = validatePassword(newUser.password)
    if (pwdError) {
      setPwdErrorState(pwdError)
      return
    }
    setPwdErrorState('')

    setIsSubmitting(true)
    try {
      await createUser(newUser)
      setNewUser({ email: '', name: '', password: '', role: 'OPERATOR' })
      setShowAdd(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const pwdError = validatePassword(newPassword)
    if (pwdError) {
      alert(pwdError)
      return
    }

    try {
      await resetPassword(resettingUser.id, newPassword)
      alert('Password updated successfully')
      setResettingUser(null)
      setNewPassword('')
    } catch (err) {
      alert('Failed to reset password')
    }
  }

  const toggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    await updateUser(user.id, { status: nextStatus })
    load()
  }

  return (
    <div className="space-y-6">
       {error && (
         <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <div className="ml-7 opacity-70 italic">Logged in as: {useAuthStore.getState().user?.email || 'Unknown'}</div>
         </div>
       )}
       <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Find user by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all"
            />
          </div>
         <button
          onClick={() => setShowAdd(true)}
          className="btn-primary"
         >
           <Plus className="w-4 h-4" /> Add User
         </button>
       </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 fade-up space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Email</label>
                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Initial Password</label>
                  <input
                    required
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className={`w-full bg-surface-900 border ${pwdErrorState ? 'border-red-500' : 'dark:border-white/10 border-black/10'} rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500`}
                    placeholder="••••••••"
                  />
                  {pwdErrorState ? (
                    <p className="text-[9px] text-red-400 mt-1.5 ml-1">{pwdErrorState}</p>
                  ) : (
                    <p className="text-[9px] text-slate-500 mt-1.5 ml-1 italic">Use 8+ characters with mixed case & symbols.</p>
                  )}
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all text-sm font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all text-sm font-bold disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create User Account'}
                </button>
             </div>
          </form>
        )}

        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <form onSubmit={handleResetPassword} className="w-full max-w-md bg-surface-800 border dark:border-white/10 border-black/10 rounded-2xl p-8 shadow-2xl fade-up space-y-6">
                <div>
                   <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Reset Password</h3>
                   <p className="text-xs text-slate-500">Updating password for <span className="text-indigo-400">{resettingUser.email}</span></p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">New Password</label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-black/20 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                  <p className="text-[9px] text-slate-500 mt-2 italic">Must be 8+ chars with symbols.</p>
                </div>
                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setResettingUser(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 font-bold text-sm">Cancel</button>
                   <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-sm shadow-lg shadow-indigo-600/20">Update Password</button>
                </div>
             </form>
          </div>
        )}

       <div className="overflow-hidden rounded-2xl border dark:border-white/5 border-black/5 bg-surface-900/30">
         <table className="w-full text-left text-sm">
           <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
             <tr>
               <th className="px-6 py-4">Identity</th>
               <th className="px-6 py-4">Role</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Created</th>
               <th className="px-6 py-4"></th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
             {users
               .filter(u => {
                 const q = searchQuery.toLowerCase()
                 const eMatch = u.email ? u.email.toLowerCase().includes(q) : false
                 const nMatch = u.name ? u.name.toLowerCase().includes(q) : false
                 return eMatch || nMatch
               })
               .map(user => (
               <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                 <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 uppercase border border-indigo-500/30">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold dark:text-white text-slate-900 truncate">{user.name || 'Set name'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <select 
                       value={user.role} 
                       onChange={(e) => updateUser(user.id, { role: e.target.value }).then(load)}
                       className="bg-surface-800 text-[10px] font-bold text-slate-400 border dark:border-white/10 border-black/10 rounded-lg px-2 py-1 outline-none hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                       <option value="OPERATOR">OPERATOR</option>
                       <option value="ADMIN">ADMIN</option>
                    </select>
                 </td>
                 <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                       <span className="text-[11px] text-slate-300 font-medium">{user.status}</span>
                    </div>
                 </td>
                 <td className="px-6 py-4 text-slate-500 text-[10px] font-mono">
                    {new Date(user.createdAt).toLocaleDateString()}
                 </td>
                 <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => toggleStatus(user)} 
                       className="p-2 rounded-lg bg-white/5 text-slate-400 hover:dark:text-white text-slate-900 transition-colors"
                       title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                     >
                        {user.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                     </button>
                      <button 
                        onClick={() => { setResettingUser(user); setNewPassword('') }} 
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:dark:text-white text-slate-900 transition-colors"
                        title="Reset Password"
                      >
                         <Settings className="w-4 h-4" />
                      </button>
                     <button 
                       onClick={() => { if(confirm('Delete user?')) deleteUser(user.id).then(load) }} 
                       className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                       title="Delete User"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  )
}

function ProcessingAdmin() {
  const [errors, setErrors] = useState([])
  const [failed, setFailed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load(); }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: e }, { data: f }] = await Promise.all([fetchEngineErrors(50), fetchFailedBlobs(100)])
      setErrors(e.data || [])
      setFailed(f.data || [])
    } catch (err) {
      console.error(err)
      setErrors([])
      setFailed([])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Engine / Processing Insights</h2>
        <button onClick={load} className="btn-ghost">Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-surface border border-main">
          <h3 className="text-sm font-semibold mb-2">Recent Engine Audit Logs</h3>
          {loading ? <p>Loading…</p> : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {errors.map(e => (
                <div key={e.id} className="p-2 rounded-md bg-white/3 border border-white/5 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{e.action}</div>
                      <div className="text-xs text-muted">Blob: {e.blob?.filename || e.blobId} • {new Date(e.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted">{e.performedBy}</div>
                  </div>
                  <pre className="text-xs mt-2 whitespace-pre-wrap break-words">{e.payload}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-surface border border-main">
          <h3 className="text-sm font-semibold mb-2">Failed Blobs (recent)</h3>
          {loading ? <p>Loading…</p> : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {failed.map(b => (
                <div key={b.id} className="p-2 rounded-md bg-white/3 border border-white/5 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{b.filename}</div>
                      <div className="text-xs text-muted">{b.s3Path}</div>
                    </div>
                    <div className="text-xs text-muted">Pages: {b._count.pages} • Docs: {b._count.documents}</div>
                  </div>
                  <div className="text-xs text-muted mt-2">Updated: {new Date(b.updatedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Doc Type Management Sub-Page ──

function DocTypeManagement() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState({ code: '', label: '', isCommon: true })
  const [editingType, setEditingType] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await fetchConfiguredDocTypes()
      setTypes(data.data)
    } finally { setLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await createConfiguredDocType(newType)
    setNewType({ code: '', label: '', isCommon: true })
    setShowAdd(false)
    load()
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    await updateConfiguredDocType(editingType.id, editingType)
    setEditingType(null)
    load()
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this classification?')) {
      await deleteConfiguredDocType(id)
      load()
    }
  }

  return (
     <div className="space-y-6">
        <div className="flex items-center justify-between">
           <p className="text-sm text-slate-500">Configure labels used by the engine and users.</p>
           <button onClick={() => setShowAdd(true)} className="btn-primary">
             <Plus className="w-4 h-4" /> Add Classification
           </button>
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleAdd} className="w-full max-w-2xl bg-surface-800 border dark:border-white/10 border-black/10 rounded-2xl p-8 shadow-2xl space-y-6">
               <div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Add Document Type</h3>
                  <p className="text-xs text-slate-500">Define a new document classification.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Internal Code</label>
                    <input
                      required
                      placeholder="e.g. ASSETS_401K"
                      value={newType.code}
                      onChange={e => setNewType({...newType, code: e.target.value})}
                      className="w-full bg-black/20 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Display Label</label>
                    <input
                      required
                      placeholder="e.g. Assets: Investment/401(k) Summary"
                      value={newType.label}
                      onChange={e => setNewType({...newType, label: e.target.value})}
                      className="w-full bg-black/20 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-sm shadow-lg shadow-indigo-600/20">Create Type</button>
               </div>
            </form>
          </div>
        )}

        {editingType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleUpdate} className="w-full max-w-2xl bg-surface-800 border dark:border-white/10 border-black/10 rounded-2xl p-8 shadow-2xl space-y-6">
               <div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-1">Edit Document Type</h3>
                  <p className="text-xs text-slate-500">Update classification details.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Internal Code</label>
                    <input
                      required
                      value={editingType.code}
                      onChange={e => setEditingType({...editingType, code: e.target.value})}
                      className="w-full bg-black/20 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Display Label</label>
                    <input
                      required
                      value={editingType.label}
                      onChange={e => setEditingType({...editingType, label: e.target.value})}
                      className="w-full bg-black/20 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingType(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-sm shadow-lg shadow-indigo-600/20">Save Changes</button>
               </div>
            </form>
          </div>
        )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(t => (
            <div key={t.id} className="group p-5 rounded-2xl bg-surface-900/30 border dark:border-white/5 border-black/5 hover:border-indigo-500/20 transition-all">
               <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FileStack className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingType(t)} className="p-2 text-slate-500 hover:dark:text-white text-slate-900 opacity-0 group-hover:opacity-100 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
               <h4 className="font-bold dark:text-white text-slate-900 mb-1">{t.label}</h4>
               <p className="font-mono text-[10px] text-slate-600 mb-4">{t.code}</p>
               <div className="flex items-center justify-between pt-4 border-t dark:border-white/5 border-black/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Auto-enabled
                  </span>
                  {t.isCommon && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-bold border border-indigo-500/20">COMMON</span>
                  )}
               </div>
            </div>
          ))}
       </div>
     </div>
  )
}

// ── Checklist Management Sub-Page ──

function ChecklistManagement() {
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await fetchChecklists()
      setChecklists(data.data)
    } finally { setLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    await createChecklist({ text: newItem.trim() })
    setNewItem('')
    load()
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this checklist item?')) {
      await deleteChecklist(id)
      load()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white text-slate-900 mb-1">Global Checklist Requirements</h2>
          <p className="text-sm text-slate-500">Define general checklist items that will be applicable to all documents across the workspace.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 bg-surface-900/30 p-4 rounded-2xl border dark:border-white/5 border-black/5">
        <input
          required
          placeholder="e.g. Verify applicant signature is present..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          className="flex-1 bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors"
        />
        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">
          Add Requirement
        </button>
      </form>

      <div className="space-y-3 mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading checklists...</p>
        ) : checklists.length === 0 ? (
          <div className="p-8 text-center border border-dashed dark:border-white/10 border-black/10 rounded-2xl bg-white/5">
            <List className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-slate-400">No global checklist items defined.</p>
            <p className="text-xs text-slate-500 mt-1">Add items above to enforce standard checks for all documents.</p>
          </div>
        ) : (
          checklists.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 border dark:border-white/5 border-black/5 group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-200">{item.text}</span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── System Settings Sub-Page ──

function SystemSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await fetchStorageSettings()
      setSettings(data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateStorageSettings(settings)
      alert('Settings saved successfully. The engine will use the new provider immediately.')
    } catch (err) {
      alert('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) return <div className="p-8 text-center text-slate-500">Loading settings...</div>

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4 border-b dark:border-white/5 border-black/5 pb-6">
         <button 
           onClick={() => setSettings({...settings, provider: 'SFTP'})}
           className={`flex-1 p-6 rounded-2xl border transition-all ${settings.provider === 'SFTP' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-surface-900/30 dark:border-white/5 border-black/5 hover:dark:border-white/10 border-black/10'}`}
         >
            <Server className={`w-8 h-8 mb-3 ${settings.provider === 'SFTP' ? 'text-indigo-400' : 'text-slate-500'}`} />
            <h3 className={`font-bold ${settings.provider === 'SFTP' ? 'text-indigo-100' : 'text-slate-400'}`}>SFTP Server</h3>
            <p className="text-xs text-slate-500 mt-1">Store files on a remote SSH file system</p>
         </button>
         
         <button 
           onClick={() => setSettings({...settings, provider: 'S3'})}
           className={`flex-1 p-6 rounded-2xl border transition-all ${settings.provider === 'S3' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-surface-900/30 dark:border-white/5 border-black/5 hover:dark:border-white/10 border-black/10'}`}
         >
            <Cloud className={`w-8 h-8 mb-3 ${settings.provider === 'S3' ? 'text-orange-400' : 'text-slate-500'}`} />
            <h3 className={`font-bold ${settings.provider === 'S3' ? 'text-orange-100' : 'text-slate-400'}`}>AWS S3</h3>
            <p className="text-xs text-slate-500 mt-1">Store files in an Amazon S3 Bucket</p>
         </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {settings.provider === 'SFTP' && (
          <div className="space-y-4 fade-up">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-4">SFTP Credentials</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Host</label>
                <input
                  type="text"
                  value={settings.sftpHost || ''}
                  onChange={e => setSettings({...settings, sftpHost: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="sftp.example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Port</label>
                <input
                  type="number"
                  value={settings.sftpPort || ''}
                  onChange={e => setSettings({...settings, sftpPort: parseInt(e.target.value)})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="22"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Username</label>
                <input
                  type="text"
                  value={settings.sftpUser || ''}
                  onChange={e => setSettings({...settings, sftpUser: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Password</label>
                <input
                  type="password"
                  value={settings.sftpPass || ''}
                  onChange={e => setSettings({...settings, sftpPass: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {settings.provider === 'S3' && (
          <div className="space-y-4 fade-up">
            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-4">AWS S3 Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Bucket Name</label>
                <input
                  type="text"
                  value={settings.s3Bucket || ''}
                  onChange={e => setSettings({...settings, s3Bucket: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="my-company-documents"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Region</label>
                <input
                  type="text"
                  value={settings.s3Region || ''}
                  onChange={e => setSettings({...settings, s3Region: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="us-east-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Access Key ID</label>
                <input
                  type="text"
                  value={settings.s3AccessKey || ''}
                  onChange={e => setSettings({...settings, s3AccessKey: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Secret Access Key</label>
                <input
                  type="password"
                  value={settings.s3SecretKey || ''}
                  onChange={e => setSettings({...settings, s3SecretKey: e.target.value})}
                  className="w-full bg-surface-900 border dark:border-white/10 border-black/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t dark:border-white/5 border-black/5 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary w-40">
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Document Indexing Sub-Page (Per-Blob Workspace View) ──

function DocumentIndexing() {
  const [blobs, setBlobs] = useState([])
  const [selectedBlobId, setSelectedBlobId] = useState('')
  const [blobDocuments, setBlobDocuments] = useState([])
  const [blobInfo, setBlobInfo] = useState(null)
  const [docTypes, setDocTypes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingDocId, setSavingDocId] = useState(null)
  const [editCache, setEditCache] = useState({})

  useEffect(() => {
    fetchConfiguredDocTypes().then(({ data }) => setDocTypes(data.data || []))
    loadBlobs()
  }, [])

  const loadBlobs = async (search) => {
    setLoading(true)
    try {
      const { data } = await fetchAdminBlobs({ search: search || undefined, limit: 100 })
      setBlobs(data.data || [])
    } catch (err) {
      console.error('Failed to load blobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadBlobs(searchQuery)
  }

  const loadBlobDocuments = async (blobId) => {
    if (!blobId) {
      setBlobDocuments([])
      setBlobInfo(null)
      return
    }
    setLoading(true)
    try {
      const { data } = await fetchAdminBlobDocuments(blobId)
      setBlobInfo(data.data.blob)
      setBlobDocuments(data.data.documents || [])
      setEditCache({})
    } catch (err) {
      console.error('Failed to load blob documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlobSelect = (blobId) => {
    setSelectedBlobId(blobId)
    loadBlobDocuments(blobId)
  }

  const handleFieldChange = (docId, field, value) => {
    setEditCache(prev => ({
      ...prev,
      [docId]: { ...(prev[docId] || {}), [field]: value }
    }))
  }

  const handleSaveDocument = async (docId) => {
    const changes = editCache[docId]
    if (!changes || Object.keys(changes).length === 0) return

    setSavingDocId(docId)
    try {
      const payload = {}
      if (changes.name !== undefined) payload.name = changes.name
      if (changes.documentType !== undefined) payload.documentType = changes.documentType

      await adminRenameDocument(docId, payload)

      setBlobDocuments(prev => prev.map(d => {
        if (d.id !== docId) return d
        return { ...d, ...(payload.name !== undefined && { name: payload.name }), ...(payload.documentType !== undefined && { documentType: payload.documentType }) }
      }))

      setEditCache(prev => {
        const next = { ...prev }
        delete next[docId]
        return next
      })
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message))
    } finally {
      setSavingDocId(null)
    }
  }

  const getPageRange = (doc) => {
    if (!doc.pages || doc.pages.length === 0) return { from: '—', to: '—' }
    const sorted = [...doc.pages].sort((a, b) => a.order - b.order)
    const firstIdx = sorted[0]?.page?.pageIndex ?? 0
    const lastIdx = sorted[sorted.length - 1]?.page?.pageIndex ?? 0
    return { from: firstIdx + 1, to: lastIdx + 1 }
  }

  return (
    <div className="space-y-6">
      {/* Blob Selector */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search blobs by filename or batch number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all"
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>
        <div className="flex-1 max-w-md">
          <select
            value={selectedBlobId}
            onChange={e => handleBlobSelect(e.target.value)}
            className="w-full bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Select a blob...</option>
            {blobs.map(b => (
              <option key={b.id} value={b.id}>
                {b.filename} {b.batchNo ? `(${b.batchNo})` : ''} — {b._count.documents} docs, {b._count.pages} pages
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blob Info */}
      {blobInfo && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Blob</p>
            <p className="text-sm font-semibold text-white">{blobInfo.filename}</p>
          </div>
          {blobInfo.batchNo && (
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Batch</p>
              <p className="text-sm font-semibold text-white">{blobInfo.batchNo}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pages</p>
            <p className="text-sm font-semibold text-white">{blobInfo.pageCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Status</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${blobInfo.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : blobInfo.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {blobInfo.status}
            </span>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {loading && (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      )}

      {!loading && selectedBlobId && blobDocuments.length === 0 && (
        <div className="text-center py-12 border border-dashed dark:border-white/10 border-black/10 rounded-2xl">
          <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-slate-400">No documents found for this blob.</p>
        </div>
      )}

      {!loading && blobDocuments.length > 0 && (
        <div className="overflow-hidden rounded-2xl border dark:border-white/5 border-black/5 bg-surface-900/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Document Name</th>
                <th className="px-6 py-4">Document Type</th>
                <th className="px-6 py-4 text-center">Pages</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {blobDocuments.map(doc => {
                const cache = editCache[doc.id] || {}
                const range = getPageRange(doc)
                const isDirty = Object.keys(cache).length > 0
                return (
                  <tr key={doc.id} className={`group hover:bg-white/5 transition-colors ${isDirty ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        value={cache.name !== undefined ? cache.name : doc.name}
                        onChange={e => handleFieldChange(doc.id, 'name', e.target.value)}
                        className="w-full bg-transparent border border-transparent rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:border-indigo-500/50 focus:bg-surface-800 outline-none transition-all"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={cache.documentType !== undefined ? cache.documentType : doc.documentType}
                        onChange={e => handleFieldChange(doc.id, 'documentType', e.target.value)}
                        className="w-full bg-surface-800/50 border dark:border-white/10 border-black/10 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        {docTypes.map(t => (
                          <option key={t.code} value={t.code}>{t.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-mono">
                      {range.from} — {range.to}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.status === 'HUMAN_VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {doc.status === 'HUMAN_VERIFIED' ? 'Verified' : 'AI'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSaveDocument(doc.id)}
                        disabled={!isDirty || savingDocId === doc.id}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isDirty ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
                      >
                        {savingDocId === doc.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Uploaded Packages Sub-Page (one row per uploaded package / blob) ──

const PKG_STATUS_STYLES = {
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  FAILED: 'bg-red-500/20 text-red-400',
  ERROR: 'bg-red-500/20 text-red-400',
}

function UploadedPackages() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialog, setDialog] = useState(null) // { kind: 'labels' | 'values' | 'checklist', pkg }
  const limit = 50

  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    fetchUsers()
      .then(({ data }) => setUsers(data.data || []))
      .catch(() => setUsers([]))
  }, [])

  useEffect(() => { load() }, [page, userFilter])

  const load = async (term) => {
    setLoading(true)
    try {
      const params = { page, limit }
      const search = (term !== undefined ? term : searchQuery).trim()
      if (search) params.search = search
      if (userFilter) params.userId = userFilter
      const { data } = await fetchAdminPackages(params)
      setPackages(data.data || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load uploaded packages')
      setPackages([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (page !== 1) setPage(1)
    else load(searchQuery)
  }

  const handleUserFilter = (value) => {
    setUserFilter(value)
    if (page !== 1) setPage(1)
  }

  const handleClear = () => {
    setSearchQuery('')
    setUserFilter('')
    if (page !== 1) setPage(1)
    else load('')
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const closeDialog = () => setDialog(null)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by file name, loan / batch no. or uploader..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all"
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>

        <select
          value={userFilter}
          onChange={e => handleUserFilter(e.target.value)}
          className="min-w-[220px] bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="">All users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>

        {(searchQuery || userFilter) && (
          <button onClick={handleClear} className="btn-ghost text-xs">Clear</button>
        )}

        <button onClick={() => load()} className="btn-ghost text-xs">Refresh</button>
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span><span className="font-bold dark:text-white text-slate-900">{total}</span> packages</span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      )}

      {!loading && !error && packages.length === 0 && (
        <div className="text-center py-12 border border-dashed dark:border-white/10 border-black/10 rounded-2xl">
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-slate-400">No uploaded packages found.</p>
          <p className="text-xs text-slate-500 mt-1">Packages appear here once users upload files.</p>
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border dark:border-white/5 border-black/5 bg-surface-900/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">Uploaded By</th>
                <th className="px-5 py-4 text-center">Pages</th>
                <th className="px-5 py-4 text-center">Docs</th>
                <th className="px-5 py-4 text-center">Values</th>
                <th className="px-5 py-4 text-center">Checklist</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Uploaded</th>
                <th className="px-5 py-4 text-right">Set from JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.map(pkg => (
                <tr key={pkg.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/workspace/${pkg.id}`)}
                          className="font-semibold dark:text-white text-slate-900 truncate max-w-[240px] block text-left hover:text-indigo-400 transition-colors"
                          title={`Open ${pkg.filename} in the workspace`}
                        >
                          {pkg.filename}
                        </button>
                        {pkg.batchNo && <p className="text-[10px] text-slate-500 font-mono">{pkg.batchNo}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 uppercase border border-indigo-500/30 shrink-0">
                        {pkg.user?.name?.charAt(0) || pkg.user?.email?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold dark:text-white text-slate-900 truncate">{pkg.user?.name || '—'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{pkg.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-xs text-slate-400 font-mono">{pkg._count?.pages ?? pkg.pageCount ?? 0}</td>
                  <td className="px-5 py-4 text-center text-xs text-slate-400 font-mono">{pkg._count?.documents ?? 0}</td>
                  <td className="px-5 py-4 text-center text-xs text-slate-400 font-mono">{pkg._count?.extractedValues ?? 0}</td>
                  <td className="px-5 py-4 text-center text-xs font-mono">
                    {pkg.checklistCount
                      ? <span className="text-emerald-400">{pkg.checklistCount}</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${PKG_STATUS_STYLES[pkg.status] || 'bg-amber-500/20 text-amber-400'}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-[10px] font-mono whitespace-nowrap">
                    {new Date(pkg.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setDialog({ kind: 'labels', pkg })}
                      className="btn-ghost text-xs inline-flex items-center gap-1.5"
                      title="Set the AI classification of this package's pages from JSON"
                    >
                      <Tags className="w-3.5 h-3.5" /> Classify
                    </button>
                    <button
                      onClick={() => setDialog({ kind: 'values', pkg })}
                      className="btn-ghost text-xs inline-flex items-center gap-1.5 ml-1"
                      title="Set this package's extracted values from JSON"
                    >
                      <FileJson className="w-3.5 h-3.5" /> Values
                    </button>
                    <button
                      onClick={() => setDialog({ kind: 'checklist', pkg })}
                      className="btn-ghost text-xs inline-flex items-center gap-1.5 ml-1"
                      title="Set this package's Missing Document Checklist from JSON"
                    >
                      <List className="w-3.5 h-3.5" /> Checklist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === 'labels' && <PackageLabelsDialog pkg={dialog.pkg} onClose={closeDialog} onApplied={() => load()} />}
      {dialog?.kind === 'values' && <PackageValuesDialog pkg={dialog.pkg} onClose={closeDialog} onApplied={() => load()} />}
      {dialog?.kind === 'checklist' && <PackageChecklistDialog pkg={dialog.pkg} onClose={closeDialog} onApplied={() => load()} />}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {from}–{to} of {total}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared pieces for the package JSON dialogs ──

// Loads one package (pages, documents, extracted values, checklist) for a dialog.
function usePackageDetail(pkgId) {
  const [detail, setDetail] = useState(undefined) // undefined = loading, null = failed
  const reload = async () => {
    try {
      const { data } = await fetchAdminPackage(pkgId)
      setDetail(data.data)
    } catch {
      setDetail(null)
    }
  }
  useEffect(() => { reload() }, [pkgId])
  return [detail, reload]
}

const downloadJson = (data, filename) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const fileStem = (pkg) => (pkg.batchNo || pkg.filename || 'package').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_')

function PackageDialogShell({ title, pkg, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-800 border dark:border-white/10 border-black/10 rounded-2xl p-8 shadow-2xl fade-up space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold dark:text-white text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 truncate" title={pkg.filename}>
              {pkg.filename}{pkg.batchNo ? ` · ${pkg.batchNo}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:dark:text-white text-slate-900 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// JSON input: choose a .json file or paste JSON text.
function JsonSource({ fileName, onLoad, onError, onDownloadCurrent, downloadLabel = 'Download current as JSON' }) {
  const [mode, setMode] = useState('file')
  const [text, setText] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let raw
    try {
      raw = JSON.parse(await file.text())
    } catch (err) {
      return onError(`${file.name} is not valid JSON: ${err.message}`)
    }
    onLoad(raw, file.name)
  }

  const handlePaste = () => {
    let raw
    try {
      raw = JSON.parse(text)
    } catch (err) {
      return onError(`Not valid JSON: ${err.message}`)
    }
    onLoad(raw, 'pasted JSON')
  }

  const tabCls = (active) => `px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${active ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setMode('file')} className={tabCls(mode === 'file')}>Upload file</button>
        <button type="button" onClick={() => setMode('paste')} className={tabCls(mode === 'paste')}>Paste JSON</button>
        {onDownloadCurrent && (
          <button type="button" onClick={onDownloadCurrent} className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-400 transition-colors">
            <Download className="w-3.5 h-3.5" /> {downloadLabel}
          </button>
        )}
      </div>

      {mode === 'file' ? (
        <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed dark:border-white/20 border-black/15 text-xs font-bold text-slate-400 hover:border-indigo-500/60 hover:text-indigo-400 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          {fileName ? 'Choose a different JSON file' : 'Choose JSON file'}
          <input type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
        </label>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder="Paste JSON here..."
            className="w-full bg-surface-900/60 border dark:border-white/10 border-black/10 rounded-xl px-4 py-3 text-xs font-mono focus:border-indigo-500/50 outline-none"
          />
          <button type="button" onClick={handlePaste} disabled={!text.trim()} className="btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed">
            Preview
          </button>
        </div>
      )}
      {fileName && <p className="text-[11px] text-slate-400 font-mono truncate">Source: {fileName}</p>}
    </div>
  )
}

function DialogMessage({ tone = 'red', children }) {
  const cls = {
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  }[tone]
  return <div className={`p-3 rounded-xl border text-xs ${cls}`}>{children}</div>
}

function DialogActions({ onClose, onApply, canApply, applying, done, label }) {
  return (
    <div className="flex gap-3 pt-1">
      <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 font-bold text-sm">
        {done ? 'Close' : 'Cancel'}
      </button>
      <button
        onClick={onApply}
        disabled={!canApply || applying}
        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {applying ? 'Applying...' : done ? 'Applied' : label}
      </button>
    </div>
  )
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// ── AI classification JSON (parser) ──

const LABEL_KEYS = ['aiLabel', 'label', 'type', 'documentType', 'category', 'docType', 'classification', 'class']
const PAGE_KEYS_0 = ['pageIndex', 'page_index', 'index'] // 0-based, blob-export style
const PAGE_KEYS_1 = ['page', 'pageNo', 'page_no', 'pageNumber', 'page_number'] // 1-based, human style
const RANGE_FROM_KEYS = ['from', 'start', 'startPage', 'pageFrom', 'firstPage']
const RANGE_TO_KEYS = ['to', 'end', 'endPage', 'pageTo', 'lastPage']

const pickLabel = (obj, keys = LABEL_KEYS) => {
  for (const k of keys) {
    const v = obj?.[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return null
}

const pickInt = (obj, keys, min) => {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v)
      if (Number.isInteger(n) && n >= min) return n
    }
  }
  return null
}

const pickPageIndex = (obj) => {
  const zero = pickInt(obj, PAGE_KEYS_0, 0)
  if (zero !== null) return zero
  const one = pickInt(obj, PAGE_KEYS_1, 1)
  return one !== null ? one - 1 : null
}

// Turns a JSON into [{ pageIndex, aiLabel }] (0-based page index in the package). Accepts:
//   • { pages: [...] } or { data: { pages: [...] } } blob exports
//   • an array of { pageIndex, aiLabel } / { page, label } entries
//   • ranges: [label, from, to] tuples or { label, from, to } objects (1-based pages)
//   • { label, pages: [1, 2, 3] } objects (1-based pages)
//   • a flat { "3": "Label" } map (1-based keys, or 0-based if a "0" key exists)
function toLabelUpdates(raw) {
  const out = []
  const push = (pageIndex, aiLabel) => {
    if (Number.isInteger(pageIndex) && pageIndex >= 0 && aiLabel) out.push({ pageIndex, aiLabel })
  }
  const pushRange = (label, start, end) => {
    if (label && Number.isInteger(start) && start >= 1 && Number.isInteger(end) && end >= start && end - start < 5000) {
      for (let p = start; p <= end; p++) push(p - 1, label)
    }
  }

  const container = Array.isArray(raw) ? raw
    : Array.isArray(raw?.pages) ? raw.pages
    : Array.isArray(raw?.data?.pages) ? raw.data.pages
    : Array.isArray(raw?.classifications) ? raw.classifications
    : Array.isArray(raw?.documents) ? raw.documents
    : null

  if (container) {
    for (const item of container) {
      if (Array.isArray(item)) {
        const [label, from, to] = item
        if (typeof label === 'string' && label.trim()) pushRange(label.trim(), Number(from), Number(to ?? from))
        continue
      }
      if (item && typeof item === 'object') {
        const label = pickLabel(item)
        if (!label) continue
        const start = pickInt(item, RANGE_FROM_KEYS, 1)
        if (start !== null) {
          pushRange(label, start, pickInt(item, RANGE_TO_KEYS, 1) ?? start)
          continue
        }
        if (Array.isArray(item.pages)) {
          item.pages.forEach(p => { const n = Number(p); if (Number.isInteger(n) && n >= 1) push(n - 1, label) })
          continue
        }
        const idx = pickPageIndex(item)
        if (idx !== null) push(idx, label)
      }
    }
    return out
  }

  if (raw && typeof raw === 'object') {
    const keys = Object.keys(raw)
    const zeroBased = keys.includes('0')
    for (const k of keys) {
      const n = Number(k)
      if (!Number.isInteger(n) || n < 0 || (!zeroBased && n === 0)) continue
      const v = raw[k]
      const label = typeof v === 'string' && v.trim()
        ? v.trim()
        : (v && typeof v === 'object' ? pickLabel(v) : null)
      if (label) push(zeroBased ? n : n - 1, label)
    }
  }
  return out
}

// Contiguous runs of the same label → [label, from, to] (1-based pages)
const toLabelRuns = (pages) => {
  const runs = []
  for (const p of pages) {
    const label = p.aiLabel || 'UNCLASSIFIED'
    const last = runs[runs.length - 1]
    if (last && last[0] === label && last[2] === p.pageIndex) last[2] = p.pageIndex + 1
    else runs.push([label, p.pageIndex + 1, p.pageIndex + 1])
  }
  return runs
}

function PackageLabelsDialog({ pkg, onClose, onApplied }) {
  const [detail, reload] = usePackageDetail(pkg.id)
  const [fileName, setFileName] = useState('')
  const [updates, setUpdates] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [regroup, setRegroup] = useState(true)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleLoad = (raw, name) => {
    setFileName(name)
    setParseError(null)
    setError(null)
    setResult(null)
    setUpdates(null)
    const list = toLabelUpdates(raw)
    if (!list.length) return setParseError('No page classifications found in this JSON')
    const deduped = new Map()
    list.forEach(u => deduped.set(u.pageIndex, u.aiLabel))
    setUpdates([...deduped.entries()].sort((a, b) => a[0] - b[0]).map(([pageIndex, aiLabel]) => ({ pageIndex, aiLabel })))
  }

  const pages = detail?.pages || []
  const pageMap = new Map(pages.map(p => [p.pageIndex, p]))
  const rows = (updates || []).map(u => {
    const current = pageMap.get(u.pageIndex)
    return {
      pageIndex: u.pageIndex,
      current: current ? current.aiLabel : null,
      next: u.aiLabel,
      matched: !!current,
      changed: !!current && (current.aiLabel || '') !== u.aiLabel,
    }
  })
  const matched = rows.filter(r => r.matched)
  const changed = matched.filter(r => r.changed)
  const outside = rows.length - matched.length
  const nextLabels = new Map((updates || []).map(u => [u.pageIndex, u.aiLabel]))
  const projectedDocs = toLabelRuns(pages.map(p => ({ ...p, aiLabel: nextLabels.get(p.pageIndex) ?? p.aiLabel }))).length
  const canApply = !!updates && !!detail && (changed.length > 0 || regroup) && !result
  const shown = rows.slice(0, 200)

  const apply = async () => {
    setApplying(true)
    setError(null)
    try {
      const { data } = await adminSetPackageAiLabels(pkg.id, { updates, regroup, source: fileName })
      setResult(data.data)
      reload()
      onApplied()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update the page classifications')
    } finally {
      setApplying(false)
    }
  }

  return (
    <PackageDialogShell title="AI Page Classifications" pkg={pkg} onClose={onClose}>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Set the AI label of this package's pages. Page numbers are 1-based across the whole package unless the key is{' '}
        <code className="text-indigo-400">pageIndex</code>. Accepted shapes: ranges{' '}
        <code className="text-indigo-400">{'[["Note", 15, 18], ...]'}</code> or{' '}
        <code className="text-indigo-400">{'[{ "label": "Note", "from": 15, "to": 18 }]'}</code>, per page{' '}
        <code className="text-indigo-400">{'[{ "page": 3, "label": "Note" }]'}</code>, a flat{' '}
        <code className="text-indigo-400">{'{ "3": "Note" }'}</code> map, or a blob export with a{' '}
        <code className="text-indigo-400">pages</code> array.
      </p>

      <JsonSource
        fileName={fileName}
        onLoad={handleLoad}
        onError={msg => { setParseError(msg); setUpdates(null); setResult(null) }}
        onDownloadCurrent={detail ? () => downloadJson(toLabelRuns(pages), `${fileStem(pkg)}_classifications.json`) : null}
      />

      {parseError && <DialogMessage>{parseError}</DialogMessage>}
      {error && <DialogMessage>{error}</DialogMessage>}
      {detail === undefined && <div className="text-xs text-slate-500">Loading package pages...</div>}
      {detail === null && <DialogMessage tone="amber">Could not load this package's pages. Close the dialog and try again.</DialogMessage>}
      {detail && pages.length === 0 && <DialogMessage tone="amber">This package has no pages yet, so there is nothing to classify.</DialogMessage>}

      {updates && detail && (
        <>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <span><span className="font-bold dark:text-white text-slate-900">{rows.length}</span> pages read</span>
            <span><span className="font-bold text-emerald-400">{changed.length}</span> will change</span>
            <span><span className="font-bold dark:text-white text-slate-900">{matched.length - changed.length}</span> unchanged</span>
            {outside > 0 && <span><span className="font-bold text-amber-400">{outside}</span> beyond the package's {pages.length} pages (skipped)</span>}
          </div>

          <div className="overflow-hidden rounded-xl border dark:border-white/5 border-black/5 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Current label</th>
                  <th className="px-4 py-3">New label</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shown.map(r => (
                  <tr key={r.pageIndex} className={!r.matched ? 'opacity-50' : ''}>
                    <td className="px-4 py-2 font-mono">{r.pageIndex + 1}</td>
                    <td className="px-4 py-2 text-slate-400">{r.current || '—'}</td>
                    <td className="px-4 py-2 font-semibold dark:text-white text-slate-900">{r.next}</td>
                    <td className="px-4 py-2">
                      {!r.matched ? <span className="text-amber-400">skipped</span>
                        : r.changed ? <span className="text-emerald-400">update</span>
                        : <span className="text-slate-500">unchanged</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > shown.length && (
              <p className="px-4 py-3 text-[11px] text-slate-500">+ {rows.length - shown.length} more pages</p>
            )}
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 cursor-pointer">
            <input type="checkbox" checked={regroup} onChange={e => setRegroup(e.target.checked)} className="mt-0.5 accent-indigo-500" />
            <span className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold dark:text-white text-slate-900">Rebuild documents from these classifications</span>{' '}
              — replaces the package's {plural(detail.documents.length, 'document')} with {plural(projectedDocs, 'document')} (one per run of consecutive pages with the same label).
              Checklist answers and extracted values are kept; document names and verified status are reset.
            </span>
          </label>
        </>
      )}

      {result && (
        <DialogMessage tone="green">
          Updated {plural(result.updated, 'page label')}
          {result.unchanged ? `, ${result.unchanged} already matched` : ''}
          {result.outsidePackage ? `, ${result.outsidePackage} skipped` : ''}
          {result.documentsCreated != null ? `. Rebuilt ${plural(result.documentsCreated, 'document')}` : ''}.
        </DialogMessage>
      )}

      <DialogActions
        onClose={onClose}
        onApply={apply}
        canApply={canApply}
        applying={applying}
        done={!!result}
        label={changed.length ? `Apply ${plural(changed.length, 'label update')}${regroup ? ' & rebuild' : ''}` : 'Rebuild documents'}
      />
    </PackageDialogShell>
  )
}

// ── Extracted values JSON (parser + dialog) ──

const EV_FIELD_KEYS = ['fieldName', 'field', 'field_name', 'name', 'key']
const EV_VALUE_KEYS = ['extractedValue', 'value', 'extracted_value', 'val']
const EV_DOC_KEYS = ['documentName', 'document', 'documentType', 'document_name', 'docType', 'doc']
const EV_GROUP_KEYS = ['fields', 'values', 'extractedData', 'extracted_data', 'data']
const EV_WRAPPER_KEYS = ['extractedValues', 'extracted_values', 'values', 'rows', 'items', 'data']

const pickValue = (obj) => {
  for (const k of EV_VALUE_KEYS) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return { found: true, value: obj[k] }
  }
  return { found: false }
}

const readTarget = (obj) => {
  const t = {}
  if (typeof obj?.pageId === 'string' && obj.pageId) t.pageId = obj.pageId
  const idx = pickPageIndex(obj)
  if (idx !== null) t.pageIndex = idx
  const doc = pickLabel(obj, EV_DOC_KEYS)
  if (doc) t.document = doc
  return t
}

const hasTarget = (t) => !!(t.pageId || t.pageIndex !== undefined || t.document)
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

// Turns a JSON into [{ target: { pageId? | pageIndex? | document? }, fieldName, value }]. Accepts:
//   • rows [{ "page": 3, "fieldName": "Loan Amount", "value": "35000" }] (also pageId / pageIndex / document)
//   • groups [{ "document": "Note", "fields": { "Loan Amount": "35000" } }] or [{ "page": 15, "fields": {...} }]
//   • maps { "Note": { "Loan Amount": "35000" } } keyed by document name, or { "15": {...} } by page number
function parseExtractedValues(raw, inherited = {}, depth = 0) {
  const out = []
  if (depth > 4) return out

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (Array.isArray(entry)) {
        // [fieldName, value] pairs inside a page / document group
        const [field, value] = entry
        if (hasTarget(inherited) && typeof field === 'string' && field.trim()) out.push({ target: inherited, fieldName: field.trim(), value })
        continue
      }
      if (!isPlainObject(entry)) continue
      const target = { ...inherited, ...readTarget(entry) }
      const groupKey = EV_GROUP_KEYS.find(k => isPlainObject(entry[k]) || Array.isArray(entry[k]))
      if (groupKey && hasTarget(target)) {
        out.push(...parseExtractedValues(entry[groupKey], target, depth + 1))
        continue
      }
      const field = pickLabel(entry, EV_FIELD_KEYS)
      const value = pickValue(entry)
      if (field && value.found && hasTarget(target)) out.push({ target, fieldName: field, value: value.value })
    }
    return out
  }

  if (!isPlainObject(raw)) return out

  if (!hasTarget(inherited)) {
    const wrapper = EV_WRAPPER_KEYS.find(k => Array.isArray(raw[k]))
    if (wrapper) return parseExtractedValues(raw[wrapper], inherited, depth + 1)
    if (hasTarget(readTarget(raw)) && (pickLabel(raw, EV_FIELD_KEYS) || EV_GROUP_KEYS.some(k => isPlainObject(raw[k])))) {
      return parseExtractedValues([raw], inherited, depth + 1)
    }
    // Map keyed by page number or document name
    for (const [key, v] of Object.entries(raw)) {
      if (!isPlainObject(v) && !Array.isArray(v)) continue
      const m = String(key).trim().match(/^(?:p(?:age)?\.?\s*)?(\d+)$/i)
      const target = m && Number(m[1]) >= 1 ? { pageIndex: Number(m[1]) - 1 } : { document: String(key).trim() }
      out.push(...parseExtractedValues(v, target, depth + 1))
    }
    return out
  }

  // Inside a page / document: a { field: value } map
  for (const [field, value] of Object.entries(raw)) {
    if (field.trim()) out.push({ target: inherited, fieldName: field.trim(), value })
  }
  return out
}

const valueText = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))

function PackageValuesDialog({ pkg, onClose, onApplied }) {
  const [detail, reload] = usePackageDetail(pkg.id)
  const [fileName, setFileName] = useState('')
  const [entries, setEntries] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [mode, setMode] = useState('merge')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleLoad = (raw, name) => {
    setFileName(name)
    setParseError(null)
    setError(null)
    setResult(null)
    setEntries(null)
    const list = parseExtractedValues(raw)
    if (!list.length) return setParseError('No extracted values found in this JSON. Each value needs a page or document, a field name and a value.')
    setEntries(list)
  }

  const pages = detail?.pages || []
  const documents = detail?.documents || []
  const pageById = new Map(pages.map(p => [p.id, p]))
  const pageByIndex = new Map(pages.map(p => [p.pageIndex, p]))
  const docByPage = new Map()
  documents.forEach(d => d.pageIds.forEach(id => { if (!docByPage.has(id)) docByPage.set(id, d) }))
  const norm = (s) => String(s || '').trim().toLowerCase()

  const resolvePage = (t) => {
    if (t.pageId) return pageById.get(t.pageId) || null
    if (t.pageIndex !== undefined) return pageByIndex.get(t.pageIndex) || null
    if (t.document) {
      const want = norm(t.document)
      const doc = documents.find(d => norm(d.documentType) === want) || documents.find(d => norm(d.name) === want)
      if (doc?.pageIds?.length) return pageById.get(doc.pageIds[0]) || null
      return pages.find(p => norm(p.aiLabel) === want) || null
    }
    return null
  }

  const current = new Map((detail?.extractedValues || []).map(v => [`${v.pageId}\u0000${v.fieldName}`, v]))

  // Resolve, then dedupe (last entry wins per page + field)
  const resolved = new Map()
  const unresolved = []
  for (const e of entries || []) {
    const page = resolvePage(e.target)
    if (!page) { unresolved.push(e); continue }
    resolved.set(`${page.id}\u0000${e.fieldName}`, { ...e, page })
  }
  const rows = [...resolved.entries()].map(([key, e]) => {
    const prev = current.get(key)
    const prevText = prev ? (prev.qaValue ?? prev.extractedValue) : null
    const nextText = valueText(e.value)
    return {
      key,
      page: e.page,
      document: docByPage.get(e.page.id)?.documentType || e.page.aiLabel || '—',
      fieldName: e.fieldName,
      current: prevText,
      next: nextText,
      isNew: !prev,
      changed: !prev || prevText !== nextText || (prev.qaValue != null && prev.qaValue !== prev.extractedValue),
    }
  }).sort((a, b) => a.page.pageIndex - b.page.pageIndex || a.fieldName.localeCompare(b.fieldName))

  const changedCount = rows.filter(r => r.changed).length
  const removedCount = mode === 'replace' ? [...current.keys()].filter(k => !resolved.has(k)).length : 0
  const canApply = !!detail && rows.length > 0 && (changedCount > 0 || removedCount > 0) && !result
  const shown = rows.slice(0, 200)

  const exportCurrent = () => {
    const list = (detail?.extractedValues || [])
      .map(v => ({ page: (pageById.get(v.pageId)?.pageIndex ?? -1) + 1, document: v.documentName, fieldName: v.fieldName, value: v.qaValue ?? v.extractedValue }))
      .sort((a, b) => a.page - b.page || a.fieldName.localeCompare(b.fieldName))
    downloadJson(list, `${fileStem(pkg)}_extracted_values.json`)
  }

  const apply = async () => {
    setApplying(true)
    setError(null)
    try {
      const values = rows.map(r => ({ pageId: r.page.id, fieldName: r.fieldName, value: r.next }))
      const { data } = await adminSetPackageExtractedValues(pkg.id, { values, mode, source: fileName })
      setResult(data.data)
      reload()
      onApplied()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set the extracted values')
    } finally {
      setApplying(false)
    }
  }

  return (
    <PackageDialogShell title="Extracted Values" pkg={pkg} onClose={onClose}>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Set extracted field values for this package. Target a value by 1-based <code className="text-indigo-400">page</code>,{' '}
        <code className="text-indigo-400">pageId</code>, or <code className="text-indigo-400">document</code> name (it lands on that document's first page).
        Accepted shapes: rows <code className="text-indigo-400">{'[{ "page": 38, "fieldName": "Loan Amount", "value": "35000" }]'}</code>, groups{' '}
        <code className="text-indigo-400">{'[{ "document": "Note", "fields": { "Loan Amount": "35000" } }]'}</code>, or a map{' '}
        <code className="text-indigo-400">{'{ "Closing Disclosure": { "Interest Rate": "8.5" } }'}</code> keyed by document name or page number.
      </p>

      <JsonSource
        fileName={fileName}
        onLoad={handleLoad}
        onError={msg => { setParseError(msg); setEntries(null); setResult(null) }}
        onDownloadCurrent={detail ? exportCurrent : null}
      />

      {parseError && <DialogMessage>{parseError}</DialogMessage>}
      {error && <DialogMessage>{error}</DialogMessage>}
      {detail === undefined && <div className="text-xs text-slate-500">Loading package...</div>}
      {detail === null && <DialogMessage tone="amber">Could not load this package. Close the dialog and try again.</DialogMessage>}

      {entries && detail && (
        <>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <span><span className="font-bold dark:text-white text-slate-900">{rows.length}</span> values matched</span>
            <span><span className="font-bold text-sky-400">{rows.filter(r => r.isNew).length}</span> new</span>
            <span><span className="font-bold text-emerald-400">{rows.filter(r => r.changed && !r.isNew).length}</span> updated</span>
            <span><span className="font-bold dark:text-white text-slate-900">{rows.length - changedCount}</span> unchanged</span>
            {unresolved.length > 0 && <span><span className="font-bold text-amber-400">{unresolved.length}</span> not matched to a page (skipped)</span>}
            {removedCount > 0 && <span><span className="font-bold text-red-400">{removedCount}</span> existing values will be removed</span>}
          </div>

          {unresolved.length > 0 && (
            <DialogMessage tone="amber">
              Skipped targets: {[...new Set(unresolved.map(u => u.target.document || (u.target.pageIndex !== undefined ? `page ${u.target.pageIndex + 1}` : u.target.pageId)))].slice(0, 8).join(', ')}
              {unresolved.length > 8 ? '…' : ''}
            </DialogMessage>
          )}

          {rows.length > 0 && (
            <div className="overflow-hidden rounded-xl border dark:border-white/5 border-black/5 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Current</th>
                    <th className="px-4 py-3">New</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shown.map(r => (
                    <tr key={r.key} className={!r.changed ? 'opacity-60' : ''}>
                      <td className="px-4 py-2 font-mono">{r.page.pageIndex + 1}</td>
                      <td className="px-4 py-2 text-slate-400 max-w-[160px] truncate" title={r.document}>{r.document}</td>
                      <td className="px-4 py-2 text-slate-300 max-w-[200px] truncate" title={r.fieldName}>{r.fieldName}</td>
                      <td className="px-4 py-2 text-slate-500 max-w-[180px] truncate" title={r.current ?? ''}>{r.current ?? '—'}</td>
                      <td className="px-4 py-2 font-semibold dark:text-white text-slate-900 max-w-[180px] truncate" title={r.next}>{r.next || '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.isNew ? <span className="text-sky-400">new</span>
                          : r.changed ? <span className="text-emerald-400">update</span>
                          : <span className="text-slate-500">unchanged</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > shown.length && (
                <p className="px-4 py-3 text-[11px] text-slate-500">+ {rows.length - shown.length} more values</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500 mr-1">Mode:</span>
            {[['merge', 'Merge — only write these fields'], ['replace', 'Replace — remove all other values in this package']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${mode === m ? (m === 'replace' ? 'bg-red-500/15 text-red-400' : 'bg-indigo-500/15 text-indigo-400') : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {result && (
        <DialogMessage tone="green">
          Wrote {plural(result.written, 'value')} across {plural(result.pages, 'page')}
          {result.mode === 'replace' ? ` (removed ${result.replaced} previous values)` : ''}.
        </DialogMessage>
      )}

      <DialogActions
        onClose={onClose}
        onApply={apply}
        canApply={canApply}
        applying={applying}
        done={!!result}
        label={mode === 'replace' ? `Replace with ${plural(rows.length, 'value')}` : `Apply ${plural(changedCount, 'value')}`}
      />
    </PackageDialogShell>
  )
}

// ── Missing Document Checklist JSON (parser + dialog) ──

const CL_NAME_KEYS = ['name', 'document', 'documentName', 'document_name', 'documentType', 'doc', 'item', 'label', 'question']
const CL_ANSWER_KEYS = ['answer', 'status', 'category', 'available', 'value']
const CL_COMMENT_KEYS = ['comment', 'notes', 'note', 'remark']

const pickFrom = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k]
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  }
  return null
}

const normaliseAnswer = (value) => {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (/^(y|yes|true|1|available|present|found)$/i.test(s)) return 'Yes'
  if (/^(n|no|false|0|missing|not\s*available|absent)$/i.test(s)) return 'No'
  return s
}

// Keeps a supplied question verbatim if it reads like one, otherwise wraps it
// the same way the seed scripts do: "Is <Document> Available In Package ?"
const toQuestion = (name) => {
  const trimmed = String(name).trim()
  return /\?\s*$/.test(trimmed) ? trimmed : `Is ${trimmed} Available In Package ?`
}

// Turns a JSON into [{ question, answer, comment, flagged }]. Accepts:
//   • report tuples ["Note", "YES"] or ["Note", "YES", "optional comment"]
//   • objects [{ "document": "Note", "answer": "Yes", "comment": "...", "flagged": true }]
//   • a flat map { "Note": "Yes" } or { "Note": { "answer": "No", "comment": "..." } }
function parseChecklistFile(raw) {
  const out = []
  const push = (name, answer, comment, flagged) => {
    const question = toQuestion(name)
    if (question && question.length <= 300) {
      out.push({
        question,
        answer: normaliseAnswer(answer),
        comment: comment == null || comment === '' ? null : String(comment).slice(0, 500),
        flagged: !!flagged,
      })
    }
  }

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (Array.isArray(entry)) {
        const [name, answer, comment] = entry
        if (name != null && name !== '') push(name, answer, comment, false)
        continue
      }
      if (entry && typeof entry === 'object') {
        const name = pickFrom(entry, CL_NAME_KEYS)
        if (!name) continue
        push(name, pickFrom(entry, CL_ANSWER_KEYS), pickFrom(entry, CL_COMMENT_KEYS), entry.flagged === true || entry.flag === true)
      }
    }
    return out
  }

  if (raw && typeof raw === 'object') {
    // A wrapper such as { "checklists": [...] } or { "data": { "items": [...] } }
    const nested = raw.checklists || raw.checklist || raw.items || raw.missing || raw.missingDocuments || raw.data
    if (Array.isArray(nested) && nested.length && (Array.isArray(nested[0]) || typeof nested[0] === 'object')) {
      return parseChecklistFile(nested)
    }
    for (const [name, value] of Object.entries(raw)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        push(name, pickFrom(value, CL_ANSWER_KEYS), pickFrom(value, CL_COMMENT_KEYS), value.flagged === true || value.flag === true)
      } else {
        push(name, value, null, false)
      }
    }
  }
  return out
}

function PackageChecklistDialog({ pkg, onClose, onApplied }) {
  const [detail, reload] = usePackageDetail(pkg.id)
  const [fileName, setFileName] = useState('')
  const [items, setItems] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [replace, setReplace] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleLoad = (raw, name) => {
    setFileName(name)
    setParseError(null)
    setError(null)
    setResult(null)
    setItems(null)
    const list = parseChecklistFile(raw)
    if (!list.length) return setParseError('No checklist items found in this JSON')
    const deduped = new Map()
    list.forEach(i => deduped.set(i.question, i)) // last entry wins
    setItems([...deduped.values()])
  }

  const existing = detail?.checklist || []
  const docCount = detail?.documents?.length || 0
  const existingByQuestion = new Map(existing.map(r => [r.question, r]))
  const rows = (items || []).map(i => {
    const prev = existingByQuestion.get(i.question)
    return {
      ...i,
      current: prev ? prev.answer : null,
      mixed: !!prev?.mixed,
      exists: !!prev,
      changed: !prev
        || prev.mixed
        || prev.documents < docCount
        || (prev.answer || '') !== (i.answer || '')
        || (prev.comment || '') !== (i.comment || '')
        || !!prev.flagged !== !!i.flagged,
    }
  })
  const incoming = new Set((items || []).map(i => i.question))
  const removed = replace ? existing.filter(e => !incoming.has(e.question)) : []
  const toApply = rows.filter(r => r.changed)
  const canApply = !!items && docCount > 0 && (toApply.length > 0 || removed.length > 0) && !result
  const shown = rows.slice(0, 200)

  const exportCurrent = () => downloadJson(
    existing.map(e => ({ question: e.question, answer: e.answer, ...(e.comment ? { comment: e.comment } : {}), ...(e.flagged ? { flagged: true } : {}) })),
    `${fileStem(pkg)}_missing_checklist.json`
  )

  const apply = async () => {
    setApplying(true)
    setError(null)
    try {
      const { data } = await adminSetPackageChecklist(pkg.id, { items, replace, source: fileName })
      setResult(data.data)
      reload()
      onApplied()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set the Missing Document Checklist')
    } finally {
      setApplying(false)
    }
  }

  return (
    <PackageDialogShell title="Missing Document Checklist" pkg={pkg} onClose={onClose}>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Set the checklist answers for <span className="font-semibold dark:text-white text-slate-900">this package</span> — they apply to every document in it.
        Accepted shapes: report tuples <code className="text-indigo-400">{'[["Note", "YES"], ...]'}</code>, objects{' '}
        <code className="text-indigo-400">{'[{ "document": "Note", "answer": "Yes" }]'}</code> (optional <code className="text-indigo-400">comment</code> / <code className="text-indigo-400">flagged</code>), or a flat{' '}
        <code className="text-indigo-400">{'{ "Note": "Yes" }'}</code> map. Each entry becomes the question{' '}
        <code className="text-indigo-400">Is &lt;Document&gt; Available In Package ?</code> unless it already ends with a question mark.
      </p>

      <JsonSource
        fileName={fileName}
        onLoad={handleLoad}
        onError={msg => { setParseError(msg); setItems(null); setResult(null) }}
        onDownloadCurrent={detail && existing.length ? exportCurrent : null}
      />

      {parseError && <DialogMessage>{parseError}</DialogMessage>}
      {error && <DialogMessage>{error}</DialogMessage>}
      {detail === undefined && <div className="text-xs text-slate-500">Loading package...</div>}
      {detail === null && <DialogMessage tone="amber">Could not load this package. Close the dialog and try again.</DialogMessage>}
      {detail && docCount === 0 && (
        <DialogMessage tone="amber">This package has no documents yet. Classify its pages (and rebuild documents) first, then set the checklist.</DialogMessage>
      )}

      {items && detail && (
        <>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <span><span className="font-bold dark:text-white text-slate-900">{rows.length}</span> questions read</span>
            <span><span className="font-bold text-emerald-400">{toApply.length}</span> to apply</span>
            <span><span className="font-bold dark:text-white text-slate-900">{rows.length - toApply.length}</span> already matching</span>
            <span><span className="font-bold text-sky-400">{rows.filter(r => !r.exists).length}</span> new for this package</span>
            {removed.length > 0 && <span><span className="font-bold text-red-400">{removed.length}</span> will be removed</span>}
            <span>across <span className="font-bold dark:text-white text-slate-900">{plural(docCount, 'document')}</span></span>
          </div>

          <div className="overflow-hidden rounded-xl border dark:border-white/5 border-black/5 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">New</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shown.map(r => (
                  <tr key={r.question} className={!r.changed ? 'opacity-60' : ''}>
                    <td className="px-4 py-2 text-slate-300 max-w-[360px]" title={r.question}>{r.question}</td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{r.current || '—'}{r.mixed && <span className="ml-1 text-amber-400">(mixed)</span>}</td>
                    <td className="px-4 py-2 font-semibold dark:text-white text-slate-900 whitespace-nowrap">
                      {r.answer || '—'}
                      {r.flagged && <span className="ml-1 text-amber-400">⚑</span>}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {!r.exists ? <span className="text-sky-400">new</span>
                        : r.changed ? <span className="text-emerald-400">update</span>
                        : <span className="text-slate-500">unchanged</span>}
                    </td>
                  </tr>
                ))}
                {removed.map(r => (
                  <tr key={`rm-${r.question}`} className="opacity-60">
                    <td className="px-4 py-2 text-slate-400 line-through max-w-[360px]" title={r.question}>{r.question}</td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{r.answer || '—'}</td>
                    <td className="px-4 py-2 text-slate-500">—</td>
                    <td className="px-4 py-2 text-red-400 whitespace-nowrap">remove</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > shown.length && (
              <p className="px-4 py-3 text-[11px] text-slate-500">+ {rows.length - shown.length} more questions</p>
            )}
          </div>

          {existing.length > 0 && (
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 cursor-pointer">
              <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} className="mt-0.5 accent-indigo-500" />
              <span className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold dark:text-white text-slate-900">Replace the package's checklist</span>{' '}
                — remove answers for questions that are not in this JSON.
              </span>
            </label>
          )}
        </>
      )}

      {result && (
        <DialogMessage tone="green">
          Set {plural(result.total, 'checklist answer')} on {plural(result.documents, 'document')}
          {result.createdQuestions ? `, ${plural(result.createdQuestions, 'new question')} created` : ''}
          {result.removedQuestions ? `, ${result.removedQuestions} removed` : ''}.
        </DialogMessage>
      )}

      <DialogActions
        onClose={onClose}
        onApply={apply}
        canApply={canApply}
        applying={applying}
        done={!!result}
        label={`Apply ${plural(toApply.length, 'checklist answer')}${removed.length ? ` & remove ${removed.length}` : ''}`}
      />
    </PackageDialogShell>
  )
}

// ── Extracted Values Editor Sub-Page ──

function ExtractedValuesEditor() {
  const [blobs, setBlobs] = useState([])
  const [selectedBlobId, setSelectedBlobId] = useState('')
  const [documents, setDocuments] = useState([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [blobInfo, setBlobInfo] = useState(null)
  const [docTypes, setDocTypes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState({})
  const [newFieldName, setNewFieldName] = useState('')
  const { showToast } = useToastStore()

  useEffect(() => {
    fetchConfiguredDocTypes().then(({ data }) => setDocTypes(data.data || []))
    loadBlobs()
  }, [])

  const loadBlobs = async (search) => {
    setLoading(true)
    try {
      const { data } = await fetchAdminBlobs({ search: search || undefined, limit: 100 })
      setBlobs(data.data || [])
    } catch (err) {
      console.error('Failed to load blobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadBlobs(searchQuery)
  }

  const loadBlobDocuments = async (blobId) => {
    if (!blobId) {
      setDocuments([])
      setBlobInfo(null)
      setSelectedDocId('')
      setFields({})
      return
    }
    setLoading(true)
    try {
      const { data } = await fetchAdminBlobDocuments(blobId)
      setBlobInfo(data.data.blob)
      setDocuments(data.data.documents || [])
      setSelectedDocId('')
      setFields({})
    } catch (err) {
      console.error('Failed to load blob documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlobSelect = (blobId) => {
    setSelectedBlobId(blobId)
    loadBlobDocuments(blobId)
  }

  const loadDocumentExtractedData = (docId) => {
    setSelectedDocId(docId)
    const doc = documents.find(d => d.id === docId)
    if (!doc) {
      setFields({})
      return
    }

    const combined = doc.pages?.reduce((acc, dp) => {
      if (dp.page?.extractedValues?.length) {
        dp.page.extractedValues.forEach(ev => {
          acc[ev.fieldName] = ev.extractedValue;
        });
      }
      return acc;
    }, {}) || {}

    setFields(combined)
  }

  const handleFieldChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleAddField = () => {
    if (!newFieldName.trim()) return
    const key = newFieldName.trim().replace(/\s+/g, '_')
    setFields(prev => ({ ...prev, [key]: '' }))
    setNewFieldName('')
  }

  const handleDeleteField = (key) => {
    setFields(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedDocId) return
    setSaving(true)
    try {
      await adminUpdateExtractedData(selectedDocId, { extractedData: fields })
      showToast('Extracted values saved successfully', 'success')
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  const selectedDoc = documents.find(d => d.id === selectedDocId)

  return (
    <div className="space-y-6">
      {/* Blob & Document Selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search blobs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all"
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>
        <select
          value={selectedBlobId}
          onChange={e => handleBlobSelect(e.target.value)}
          className="flex-1 min-w-[250px] bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="">Select a blob...</option>
          {blobs.map(b => (
            <option key={b.id} value={b.id}>
              {b.filename} {b.batchNo ? `(${b.batchNo})` : ''} — {b._count.documents} docs
            </option>
          ))}
        </select>
        <select
          value={selectedDocId}
          onChange={e => loadDocumentExtractedData(e.target.value)}
          disabled={!selectedBlobId}
          className="flex-1 min-w-[250px] bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a document...</option>
          {documents.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.documentType})</option>
          ))}
        </select>
      </div>

      {/* Blob Info */}
      {blobInfo && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Blob</p>
            <p className="text-sm font-semibold text-white">{blobInfo.filename}</p>
          </div>
          {blobInfo.batchNo && (
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Batch</p>
              <p className="text-sm font-semibold text-white">{blobInfo.batchNo}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Status</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${blobInfo.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : blobInfo.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {blobInfo.status}
            </span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      )}

      {/* Empty State */}
      {!loading && selectedDocId && Object.keys(fields).length === 0 && (
        <div className="text-center py-12 border border-dashed dark:border-white/10 border-black/10 rounded-2xl">
          <FileJson className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-slate-400">No extracted values found for this document.</p>
          <p className="text-xs text-slate-500 mt-1">Add fields below to create extracted data.</p>
        </div>
      )}

      {/* Extracted Fields Editor */}
      {!loading && selectedDocId && (
        <div className="space-y-4">
          {selectedDoc && (
            <div className="p-4 rounded-xl bg-surface-900/30 border dark:border-white/5 border-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Editing Document</p>
                  <p className="text-sm font-semibold text-white mt-1">{selectedDoc.name}</p>
                  <p className="text-xs text-slate-400">Type: {selectedDoc.documentType}</p>
                </div>
                <span className="text-xs text-slate-500">{Object.keys(fields).length} fields</span>
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="rounded-2xl border dark:border-white/5 border-black/5 bg-surface-900/30 overflow-hidden">
            <div className="bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest grid grid-cols-[1fr_1fr_80px] px-6 py-3">
              <span>Field Name</span>
              <span>Value</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(fields).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr_1fr_80px] items-center px-6 py-3 hover:bg-white/5 transition-colors group">
                  <span className="text-xs font-mono text-slate-300 pr-4 truncate">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                  <input
                    value={String(value ?? '')}
                    onChange={e => handleFieldChange(key, e.target.value)}
                    className="w-full bg-surface-800/50 border dark:border-white/10 border-black/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <div className="text-right">
                    <button
                      onClick={() => handleDeleteField(key)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Field */}
          <div className="flex gap-3">
            <input
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              placeholder="New field name..."
              className="flex-1 max-w-sm bg-surface-800/50 border dark:border-white/5 border-black/5 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none transition-all"
              onKeyDown={e => e.key === 'Enter' && handleAddField()}
            />
            <button onClick={handleAddField} className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Add Field
            </button>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t dark:border-white/5 border-black/5">
            <button
              onClick={handleSave}
              disabled={saving || !selectedDocId}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all text-sm font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Extracted Values'}
            </button>
          </div>
        </div>
      )}

      {/* No blob selected state */}
      {!loading && !selectedBlobId && (
        <div className="text-center py-16 border border-dashed dark:border-white/10 border-black/10 rounded-2xl">
          <FileJson className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-sm text-slate-400">Select a blob to view and edit extracted values.</p>
          <p className="text-xs text-slate-500 mt-1">Choose a blob from the dropdown above to get started.</p>
        </div>
      )}
    </div>
  )
}
