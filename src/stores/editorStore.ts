import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PdfDocument, AnyOverlay } from '../types'
import { ToolType } from '../types'
import { OverlayEngine } from '../core/overlays/OverlayEngine'
import { HistoryManager } from '../core/history/HistoryManager'
import type { Command } from '../commands/base'

const overlayEngine = new OverlayEngine()

export const useEditorStore = defineStore('editor', () => {
  const pdfDocument = ref<PdfDocument | null>(null)
  const selectedObjectId = ref<string | null>(null)
  const selectedIds = ref<string[]>([])
  const zoom = ref(1)
  const currentPage = ref(1)
  const tool = ref<ToolType>(ToolType.SELECT)
  const isDirty = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const historyManager = new HistoryManager()

  const totalPages = computed(() => pdfDocument.value?.pages.length ?? 0)

  const currentPageData = computed(() =>
    pdfDocument.value?.pages.find((p) => p.pageNumber === currentPage.value) ?? null,
  )

  const selectedOverlay = computed(() => {
    if (!selectedObjectId.value || !pdfDocument.value) return null
    for (const page of pdfDocument.value.pages) {
      const found = page.overlays.find((o) => o.id === selectedObjectId.value)
      if (found) return found
    }
    return null
  })

  const pageOverlays = computed(() =>
    currentPageData.value?.overlays ?? [],
  )

  function setDocument(doc: PdfDocument) {
    pdfDocument.value = doc
    currentPage.value = 1
    zoom.value = 1
    isDirty.value = false
    error.value = null
  }

  function clearDocument() {
    pdfDocument.value = null
    selectedObjectId.value = null
    selectedIds.value = []
    zoom.value = 1
    currentPage.value = 1
    tool.value = ToolType.SELECT
    isDirty.value = false
    isLoading.value = false
    error.value = null
  }

  function addOverlay(object: AnyOverlay) {
    if (!pdfDocument.value) return
    pdfDocument.value = overlayEngine.addObject(pdfDocument.value, object)
    isDirty.value = true
  }

  function removeOverlay(id: string) {
    if (!pdfDocument.value) return
    pdfDocument.value = overlayEngine.removeObject(pdfDocument.value, id)
    if (selectedObjectId.value === id) {
      selectedObjectId.value = null
      selectedIds.value = selectedIds.value.filter((sid) => sid !== id)
    }
    isDirty.value = true
  }

  function updateOverlay(id: string, updates: Partial<AnyOverlay>) {
    if (!pdfDocument.value) return
    pdfDocument.value = overlayEngine.updateObject(pdfDocument.value, id, updates)
    isDirty.value = true
  }

  function getOverlay(id: string): AnyOverlay | undefined {
    return pdfDocument.value ? overlayEngine.getObject(pdfDocument.value, id) : undefined
  }

  function moveOverlay(id: string, dx: number, dy: number) {
    if (!pdfDocument.value) return
    pdfDocument.value = overlayEngine.moveObject(pdfDocument.value, id, dx, dy)
    isDirty.value = true
  }

  function setSelectedObjectId(id: string | null) {
    selectedObjectId.value = id
  }

  function clearSelection() {
    selectedObjectId.value = null
    selectedIds.value = []
  }

  function setZoom(z: number) {
    zoom.value = Math.max(0.1, Math.min(5, z))
  }

  function zoomIn() {
    zoom.value = Math.min(5, zoom.value + 0.25)
  }

  function zoomOut() {
    zoom.value = Math.max(0.1, zoom.value - 0.25)
  }

  function zoomToFit() {
    zoom.value = 1
  }

  function setCurrentPage(page: number) {
    currentPage.value = page
  }

  function nextPage() {
    currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
  }

  function prevPage() {
    currentPage.value = Math.max(1, currentPage.value - 1)
  }

  function setTool(t: ToolType) {
    tool.value = t
  }

  function executeCommand(command: Command) {
    historyManager.execute(command)
  }

  function undo() {
    const cmd = historyManager.undo()
    if (cmd) isDirty.value = true
  }

  function redo() {
    const cmd = historyManager.redo()
    if (cmd) isDirty.value = true
  }

  function canUndo(): boolean {
    return historyManager.canUndo()
  }

  function canRedo(): boolean {
    return historyManager.canRedo()
  }

  function setLoading(v: boolean) { isLoading.value = v }
  function setError(e: string | null) { error.value = e }
  function setDirty(v: boolean) { isDirty.value = v }

  return {
    pdfDocument,
    selectedObjectId,
    selectedIds,
    zoom,
    currentPage,
    tool,
    isDirty,
    isLoading,
    error,
    totalPages,
    currentPageData,
    selectedOverlay,
    pageOverlays,
    setDocument,
    clearDocument,
    addOverlay,
    removeOverlay,
    updateOverlay,
    getOverlay,
    moveOverlay,
    setSelectedObjectId,
    clearSelection,
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    setCurrentPage,
    nextPage,
    prevPage,
    setTool,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    setLoading,
    setError,
    setDirty,
  }
})

export type ReturnUseEditorStore = ReturnType<typeof useEditorStore>
