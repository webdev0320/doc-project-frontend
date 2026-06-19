import axios from 'axios'

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'https://doc-proj-backend.vercel.app/api',
  withCredentials: true 
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if the backend explicitly states the token is invalid/missing
    // or if the error is a 401. This prevents logout on DB connectivity issues.
    if (error.response && error.response.status === 401) {
      console.log('401 detected, checking if it is an auth error...');
      // If the backend returns a specific auth message, logout.
      // Otherwise, assume it might be a transient DB connection issue.
      if (error.response.data?.message?.toLowerCase().includes('authentication') || 
          error.response.data?.message?.toLowerCase().includes('token')) {
        console.log('Authentication error, logging out.');
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const uploadBlob = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  })
}

export const fetchBlobs = () => api.get('/blobs')
export const fetchInboundFiles = () => api.get('/upload/inbound')
export const fetchBlob = (id) => api.get(`/blobs/${id}`)
export const assignBlob = (id, batchNo) => api.post(`/blobs/${id}/assign`, { batchNo })
export const deleteBlob = (id) => api.delete(`/blobs/${id}`)
export const updatePage = (id, data) => api.patch(`/pages/${id}`, data)
export const deletePage = (id) => api.delete(`/pages/${id}`)
export const splitDocument = (payload) => api.post('/documents/split', payload)
export const mergeDocuments = (payload) => api.post('/documents/merge', payload)
export const verifyDocument = (id, payload) => api.patch(`/documents/${id}/verify`, payload)
export const saveDocumentChecklists = (id, checklists) => api.patch(`/documents/${id}/checklists`, { checklists })
export const renameDocument = (id, payload) => api.patch(`/documents/${id}/rename`, payload)
export const updateBlob = (id, data) => api.patch(`/blobs/${id}`, data)


export const addBlobPages = (blobId, file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/blobs/${blobId}/add-pages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  })
}

// Admin
export const fetchUsers = () => api.get('/admin/users')
export const createUser = (data) => api.post('/admin/users', data) // Admin-only creation
export const updateUser = (id, data) => api.patch(`/admin/users/${id}`, data)
export const resetPassword = (id, password) => api.post(`/admin/users/${id}/reset-password`, { password })
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

export const fetchConfiguredDocTypes = () => api.get('/admin/doc-types')
export const createConfiguredDocType = (data) => api.post('/admin/doc-types', data)
export const updateConfiguredDocType = (id, data) => api.patch(`/admin/doc-types/${id}`, data)
export const deleteConfiguredDocType = (id) => api.delete(`/admin/doc-types/${id}`)

export const fetchChecklists = () => api.get('/admin/checklists')
export const createChecklist = (data) => api.post('/admin/checklists', data)
export const deleteChecklist = (id) => api.delete(`/admin/checklists/${id}`)

export const fetchStorageSettings = () => api.get('/admin/storage-settings')
export const updateStorageSettings = (data) => api.put('/admin/storage-settings', data)

export const exportBlob = (id) => api.post(`/export/${id}`)

// Engine admin
export const fetchEngineErrors = (limit = 50) => api.get(`/admin/engine/errors?limit=${limit}`)
export const fetchFailedBlobs = (limit = 100) => api.get(`/admin/engine/failed-blobs?limit=${limit}`)
