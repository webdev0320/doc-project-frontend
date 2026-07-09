import { create } from 'zustand'
import { fetchBlob, updatePage, deletePage, splitDocument, mergeDocuments, verifyDocument, renameDocument, addBlobPages } from '../api/client'


const useWorkspaceStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  blob: null,
  pages: [],
  documents: [],
  selectedPageId: null,
  selectedPageIds: [], // Added for multi-select
  selectedDocumentId: null,
  filterLabel: null, // Added for filtering
  zoom: 1,
  loading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────
  loadBlob: async (blobId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await fetchBlob(blobId)
      if (data?.data?.status === 'FAILED') {
        const rawErr = data.data.engineError?.payload
        let engineErr = rawErr;
        if (rawErr) {
          try {
            const parsed = JSON.parse(rawErr);
            engineErr = parsed.error?.message || parsed.message || rawErr;
          } catch (e) {}
        }
        console.error(`[Workspace Load Error] Engine processing failed for blob ${blobId}:`, engineErr || 'No detailed error message found.', data.data)
      }
      const firstPageId = data.data.pages[0]?.id ?? null
      set({
        blob: data.data,
        pages: data.data.pages,
        documents: data.data.documents,
        loading: false,
        selectedPageId: firstPageId,
        selectedPageIds: firstPageId ? [firstPageId] : [],
        selectedDocumentId: data.data.documents[0]?.id ?? null,
        filterLabel: null, // Reset filter
      })
    } catch (e) {
      console.error(`[Workspace Load Error] Failed to fetch/load blob ${blobId}:`, e);
      set({ error: e.message, loading: false })
    }
  },

  selectPage: (pageId, multi = false) => {
    const { selectedPageIds } = get()
    if (multi) {
      const nextIds = selectedPageIds.includes(pageId)
        ? selectedPageIds.filter(id => id !== pageId)
        : [...selectedPageIds, pageId]
      set({ selectedPageIds: nextIds, selectedPageId: pageId })
    } else {
      set({ selectedPageId: pageId, selectedPageIds: [pageId] })
    }
  },

  selectDocument: (docId) => set({ selectedDocumentId: docId, filterLabel: null }),
  setFilterLabel: (label) => set({ filterLabel: label, selectedDocumentId: null }),

  setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.25, zoom)) }),

  reorderPages: (activeId, overId) => {
    const { pages } = get()
    const oldIndex = pages.findIndex(p => p.id === activeId)
    const newIndex = pages.findIndex(p => p.id === overId)
    if (oldIndex === newIndex) return
    const newPages = [...pages]
    const [movedItem] = newPages.splice(oldIndex, 1)
    newPages.splice(newIndex, 0, movedItem)
    set({ pages: newPages })
  },

  rotatePage: async (pageId) => {
    const { pages, selectedPageIds } = get()
    const ids = pageId ? [pageId] : selectedPageIds
    const newPages = pages.map(p => {
      if (ids.includes(p.id)) {
        const nextRot = (p.rotation + 90) % 360
        updatePage(p.id, { rotation: nextRot })
        return { ...p, rotation: nextRot }
      }
      return p
    })
    set({ pages: newPages })
  },

  flagPage: async (pageId, isFlagged) => {
    const { pages, selectedPageIds } = get()
    const ids = pageId ? [pageId] : selectedPageIds
    const nextPages = pages.map(p => {
      if (ids.includes(p.id)) {
        updatePage(p.id, { isFlagged })
        return { ...p, isFlagged }
      }
      return p
    })
    set({ pages: nextPages })
  },

  splitAfterPage: async (pageId) => {
    const { documents, blob } = get()

    // 1. Find the document that currently contains this page
    const sourceDoc = documents.find(doc => doc.pages.some(dp => dp.pageId === pageId))
    if (!sourceDoc) return

    // 2. Identify the pages in that document that come AFTER the split point
    const docPages = sourceDoc.pages // These are already ordered by 'order' from the backend
    const splitIndex = docPages.findIndex(dp => dp.pageId === pageId)

    // If it's the last page of the document, there's nothing to split "after"
    if (splitIndex < 0 || splitIndex >= docPages.length - 1) return

    const movingPages = docPages.slice(splitIndex + 1).map(dp => dp.pageId)

    // 3. Move only those subsequent pages to a new document
    const { data } = await splitDocument({
      blobId: blob.id,
      pageIds: movingPages,
      documentType: sourceDoc.documentType,
      name: sourceDoc.name
    })

    // 4. Update state with the fresh list of documents from the backend
    set({ documents: data.allDocuments })
  },

  staplePages: async () => {
    const { selectedPageIds, pages, blob } = get()
    if (selectedPageIds.length < 2) return
    const selected = pages.filter(p => selectedPageIds.includes(p.id))
    const label = selected[0]?.aiLabel || 'Stapled Document'
    const { data } = await splitDocument({ blobId: blob.id, pageIds: selectedPageIds, documentType: label, name: label })

    // Use allDocuments to ensure consistency
    set({
      documents: data.allDocuments,
      selectedPageIds: [],
      selectedDocumentId: data.data.id
    })
  },

  mergeDocuments: async (sourceId, targetId) => {
    const { blob, documents } = get()
    const { data } = await mergeDocuments({ sourceDocumentId: sourceId, targetDocumentId: targetId, blobId: blob.id })
    set({
      documents: documents.filter((d) => d.id !== sourceId).map((d) => (d.id === targetId ? data.data : d)),
      selectedDocumentId: targetId,
    })
  },

  verifyDocument: async (docId, documentType, name, extractedData) => {
    const { blob, documents } = get()
    const { data } = await verifyDocument(docId, { documentType, name, blobId: blob.id, extractedData })
    set({ documents: documents.map((d) => (d.id === docId ? { ...d, ...data.data } : d)) })
  },

  saveDocumentChecklists: async (docId, checklists) => {
    const { documents } = get()
    const { saveDocumentChecklists } = await import('../api/client.js');
    const { data } = await saveDocumentChecklists(docId, checklists);
    set({ documents: documents.map((d) => (d.id === docId ? { ...d, checklists: data.data.checklists } : d)) })
  },

  renameDocument: async (docId, name, documentType) => {
    const { blob, documents } = get()
    const { data } = await renameDocument(docId, { name, documentType, blobId: blob.id })
    set({ documents: documents.map((d) => (d.id === docId ? { ...d, ...data.data } : d)) })
  },
  
  markAsComplete: async () => {
    const { blob } = get()
    if (!blob) return
    const { updateBlob } = await import('../api/client')
    const { data } = await updateBlob(blob.id, { status: 'COMPLETED' })
    set({ blob: { ...blob, status: 'COMPLETED' } })
  },




  selectNext: () => {
    const { pages, selectedPageId } = get()
    const idx = pages.findIndex(p => p.id === selectedPageId)
    if (idx < pages.length - 1) set({ selectedPageId: pages[idx + 1].id, selectedPageIds: [pages[idx + 1].id] })
  },

  selectPrev: () => {
    const { pages, selectedPageId } = get()
    const idx = pages.findIndex(p => p.id === selectedPageId)
    if (idx > 0) set({ selectedPageId: pages[idx - 1].id, selectedPageIds: [pages[idx - 1].id] })
  },

  renamePage: async (pageId, newLabel) => {
    const { pages, blob, documents } = get()
    const newPages = pages.map(p => p.id === pageId ? { ...p, aiLabel: newLabel } : p)
    
    // Also update the blob object's internal pages array to keep state in sync
    const newBlob = blob ? {
      ...blob,
      pages: blob.pages.map(p => p.id === pageId ? { ...p, aiLabel: newLabel } : p)
    } : null

    set({ pages: newPages, blob: newBlob })
    try {
      await updatePage(pageId, { aiLabel: newLabel })
      
      // Auto-split/regroup logic:
      // Find the document containing this page.
      const doc = documents.find(d => d.pages.some(dp => dp.pageId === pageId))
      if (doc) {
          // If the page is not the only page in the document, we might need to split it into its own document.
          // This requires complex backend/API support.
          // Based on existing code, I will call a hypothetical or existing 'reclassifyPage' if it exists,
          // but I only see splitDocument. Let's try splitting it if it's not the only page, or just updating.
          
          // Actually, let's just trigger a re-fetch of the blob to get updated document groups
          const { loadBlob } = get()
          await loadBlob(blob.id)
      }
    } catch (err) {
      console.error('Failed to update page label on server', err)
      // Optional: rollback state on error
    }
  },

  removePage: async (pageId) => {
    try {
      await deletePage(pageId)
      const { pages, selectedPageId } = get()
      const newPages = pages.filter(p => p.id !== pageId)
      
      let nextSelectedId = selectedPageId
      if (selectedPageId === pageId) {
        const idx = pages.findIndex(p => p.id === pageId)
        nextSelectedId = newPages[idx]?.id || newPages[idx - 1]?.id || null
      }

      set({ 
        pages: newPages, 
        selectedPageId: nextSelectedId,
        selectedPageIds: nextSelectedId ? [nextSelectedId] : []
      })
    } catch (err) {
      console.error('Delete page failed', err)
      throw err
    }
  },

  addPages: async (files, onProgress) => {
    const { blob, loadBlob } = get()
    if (!blob || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      await addBlobPages(blob.id, files[i], (pct) => {
        // Weight progress per file: file i covers [i/n, (i+1)/n] of total
        const overall = Math.round(((i + pct / 100) / files.length) * 100)
        onProgress && onProgress(overall)
      })
    }

    // Poll until the engine marks the blob COMPLETED again.
    // Returns a promise so the caller can properly await completion.
    const poll = (attempts = 0) => new Promise((resolve, reject) => {
      if (attempts > 300) {
        console.error(`[Workspace Error] Polling timed out after 300 attempts for blob ${blob.id}.`);
        return resolve()
      }
      fetchBlob(blob.id)
        .then(({ data }) => {
          if (data.data.status === 'COMPLETED' || data.data.status === 'IN-PROGRESS') {
            loadBlob(blob.id).then(resolve).catch(reject)
          } else if (data.data.status === 'FAILED') {
            const rawErr = data.data.engineError?.payload
            let engineErr = rawErr;
            if (rawErr) {
              try {
                const parsed = JSON.parse(rawErr);
                engineErr = parsed.error?.message || parsed.message || rawErr;
              } catch (e) {}
            }
            console.error(`[Workspace Error] Engine processing failed during addPages for blob ${blob.id}:`, engineErr || 'Engine processing failed.', data.data)
            reject(new Error(engineErr || 'Engine processing failed.'))
          } else {
            setTimeout(() => poll(attempts + 1).then(resolve).catch(reject), 3000)
          }
        })
        .catch(reject)
    })

    await poll()
  },
}))

export default useWorkspaceStore
