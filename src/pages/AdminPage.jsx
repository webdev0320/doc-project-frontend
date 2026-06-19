import { useState, useEffect } from 'react'
import {
  fetchUsers, createUser, updateUser, deleteUser, resetPassword,
  fetchConfiguredDocTypes, createConfiguredDocType, updateConfiguredDocType, deleteConfiguredDocType,
  fetchStorageSettings, updateStorageSettings,
  fetchChecklists, createChecklist, deleteChecklist
  , fetchEngineErrors, fetchFailedBlobs
} from '../api/client'
import {
  Users, FileStack, ShieldAlert, Plus, Trash2,
  CheckCircle, XCircle, ChevronRight, Settings,
  ArrowLeft, Search, Mail, Server, Cloud, Edit2, X, List
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'doctypes' | 'checklists' | 'settings'
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
                {activeTab === 'users' ? 'Manage Users' : activeTab === 'doctypes' ? 'Managed Document Types' : activeTab === 'checklists' ? 'Global Checklists' : 'System Settings'}
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                {activeTab === 'users'
                  ? 'Control access levels and operator status.'
                  : activeTab === 'doctypes' ? 'Configure classifications available for the AI and HITL workforce.'
                  : activeTab === 'checklists' ? 'Manage global checklist requirements applicable to all documents.'
                  : 'Configure global system parameters including storage providers.'}
              </p>
            </div>
         </header>

        <div className="p-8">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'doctypes' && <DocTypeManagement />}
          {activeTab === 'checklists' && <ChecklistManagement />}
          {activeTab === 'processing' && <ProcessingAdmin />}
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
