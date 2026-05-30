<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editorStore'
import { getRenderer } from '../services/pdfService'
import { CoordinateMapper } from '../core/coordinates/CoordinateMapper'
import { Canvas, Rect, Circle, Textbox, Path, Image as FabricImage, PencilBrush } from 'fabric'
import type { FabricObject, TPointerEventInfo, TPointerEvent } from 'fabric'
import type { Point } from '../types'
import { OverlayType } from '../types'
import type { AnyOverlay } from '../types'
import { AddOverlayCommand } from '../commands/AddOverlayCommand'
import { MoveObjectCommand } from '../commands/MoveObjectCommand'
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand'

const store = useEditorStore()

const canvasEl = ref<HTMLCanvasElement>()
const containerEl = ref<HTMLDivElement>()
let fabricCanvas: Canvas | null = null
let pdfBgImage: FabricImage | null = null

const renderer = getRenderer()
const mapper = new CoordinateMapper()

function getObjId(obj: FabricObject): string | undefined {
  const o = obj as unknown as { data?: { overlayId?: string } }
  return o.data?.overlayId
}

function setObjId(obj: FabricObject, id: string) {
  ;(obj as unknown as { data: { overlayId: string } }).data = { overlayId: id }
}

function deleteSelectedObject() {
  if (!fabricCanvas) return
  const activeObj = fabricCanvas.getActiveObject()
  if (!activeObj) return

  const id = getObjId(activeObj)
  if (id) {
    store.executeCommand(new DeleteObjectCommand(store, id))
  }
  fabricCanvas.remove(activeObj)
  fabricCanvas.discardActiveObject()
  fabricCanvas.requestRenderAll()
}

function createFabricCanvas() {
  if (!canvasEl.value || !containerEl.value) return

  const rect = containerEl.value.getBoundingClientRect()
  fabricCanvas = new Canvas(canvasEl.value, {
    width: rect.width,
    height: rect.height,
    selection: store.tool === 'select',
    preserveObjectStacking: true,
    stopContextMenu: true,
    backgroundColor: '#0f172a', // slate-950 for dark canvas background
  })

  // Pan state tracking
  let isPanning = false
  let lastPanX = 0
  let lastPanY = 0

  fabricCanvas.on('mouse:down', (opt: TPointerEventInfo<TPointerEvent>) => {
    if (store.tool === 'text' && !opt.target) {
      const pointer = fabricCanvas!.getPointer(opt.e)
      addTextAt(pointer.x, pointer.y)
    }

    // Pan mode: start tracking
    if (store.tool === 'pan') {
      isPanning = true
      const pointer = fabricCanvas!.getPointer(opt.e)
      lastPanX = pointer.x
      lastPanY = pointer.y
      fabricCanvas!.defaultCursor = 'grabbing'
    }
  })

  fabricCanvas.on('mouse:move', (opt: TPointerEventInfo<TPointerEvent>) => {
    if (store.tool === 'pan' && isPanning) {
      const pointer = fabricCanvas!.getPointer(opt.e)
      const dx = pointer.x - lastPanX
      const dy = pointer.y - lastPanY
      fabricCanvas!.relativePan({ x: dx, y: dy })
      lastPanX = pointer.x
      lastPanY = pointer.y
    }
  })

  fabricCanvas.on('mouse:up', () => {
    if (store.tool === 'pan' && isPanning) {
      isPanning = false
      fabricCanvas!.defaultCursor = 'grab'
    }
  })

  fabricCanvas.on('object:modified', (opt: any) => {
    const obj = opt.target as FabricObject
    const id = getObjId(obj)
    if (id) {
      const newX = (obj.left as number) / store.zoom
      const newY = (obj.top as number) / store.zoom
      store.executeCommand(new MoveObjectCommand(store, id, newX, newY))
    }
  })

  fabricCanvas.on('path:created', (opt: any) => {
    const path = opt.path
    const scale = store.zoom

    const isHighlight = store.tool === 'highlight'

    // Parse points from the Fabric Path object
    const points: Point[] = []
    if (Array.isArray(path.path)) {
      for (const segment of path.path) {
        const cmd = segment[0]
        if (cmd === 'M' || cmd === 'L') {
          const x = segment[1]
          const y = segment[2]
          if (typeof x === 'number' && typeof y === 'number') {
            points.push({ x: x / scale, y: y / scale })
          }
        } else if (cmd === 'Q') {
          const x = segment[3]
          const y = segment[4]
          if (typeof x === 'number' && typeof y === 'number') {
            points.push({ x: x / scale, y: y / scale })
          }
        } else if (cmd === 'C') {
          const x = segment[5]
          const y = segment[6]
          if (typeof x === 'number' && typeof y === 'number') {
            points.push({ x: x / scale, y: y / scale })
          }
        }
      }
    }

    const overlay: AnyOverlay = {
      id: crypto.randomUUID(),
      type: OverlayType.HIGHLIGHT,
      page: store.currentPage,
      x: (path.left as number) / scale,
      y: (path.top as number) / scale,
      width: (path.width as number) / scale,
      height: (path.height as number) / scale,
      rotation: 0,
      opacity: isHighlight ? 0.4 : 1,
      visible: true,
      color: isHighlight ? 'rgba(250, 204, 21, 0.4)' : '#3B82F6',
      points,
    } as any

    if (!isHighlight) {
      ;(overlay as any).strokeWidth = 2
    } else {
      ;(overlay as any).strokeWidth = 12
    }

    store.executeCommand(new AddOverlayCommand(store, overlay))
    fabricCanvas?.remove(path) // Remove temporary path, sync will recreate it from store
  })
}

async function renderPdfPage() {
  if (!store.pdfDocument || !fabricCanvas) return

  const page = store.currentPageData
  if (!page) return

  try {
    const rendered = await renderer.renderPage(store.currentPage, store.zoom)
    const img = await FabricImage.fromURL(rendered.toDataURL())

    if (pdfBgImage) fabricCanvas.remove(pdfBgImage)
    img.set({ left: 0, top: 0, selectable: false, evented: false })
    pdfBgImage = img
    fabricCanvas.add(img)
    fabricCanvas.sendObjectToBack(img)
    fabricCanvas.renderAll()
  } catch (err) {
    console.error('Render error:', err)
    store.setError('Failed to render PDF page')
  }
}

function syncOverlaysToFabric() {
  if (!fabricCanvas) return
  const overlays = store.pageOverlays

  const existingIds = new Set(
    fabricCanvas.getObjects()
      .filter((o: FabricObject) => getObjId(o))
      .map((o: FabricObject) => getObjId(o)!),
  )

  const currentIds = new Set(overlays.map((o) => o.id))

  for (const obj of fabricCanvas.getObjects()) {
    const oid = getObjId(obj)
    if (oid && !currentIds.has(oid) && obj !== pdfBgImage) {
      fabricCanvas.remove(obj)
    }
  }

  for (const overlay of overlays) {
    if (existingIds.has(overlay.id)) {
      updateFabricObject(overlay)
    } else {
      addOverlayToFabric(overlay)
    }
  }

  fabricCanvas.renderAll()
}

function addOverlayToFabric(overlay: AnyOverlay) {
  if (!fabricCanvas) return

  let obj: FabricObject | null = null
  const scale = store.zoom

  switch (overlay.type) {
    case OverlayType.TEXT: {
      const t = overlay as AnyOverlay & { text: string; fontSize: number; color: string; fontFamily: string }
      obj = new Textbox(t.text, {
        left: t.x * scale,
        top: t.y * scale,
        fontSize: t.fontSize * scale,
        fill: t.color,
        fontFamily: t.fontFamily,
        width: overlay.width * scale,
        opacity: overlay.opacity,
      })
      break
    }
    case OverlayType.RECT: {
      const s = overlay as AnyOverlay & { stroke: string; fill: string; strokeWidth: number }
      obj = new Rect({
        left: overlay.x * scale,
        top: overlay.y * scale,
        width: overlay.width * scale,
        height: overlay.height * scale,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        fill: s.fill,
        opacity: overlay.opacity,
      })
      break
    }
    case OverlayType.CIRCLE: {
      const s = overlay as AnyOverlay & { stroke: string; fill: string; strokeWidth: number }
      const radius = Math.min(overlay.width, overlay.height) / 2 * scale
      obj = new Circle({
        left: overlay.x * scale,
        top: overlay.y * scale,
        radius,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        fill: s.fill,
        opacity: overlay.opacity,
      })
      break
    }
    case OverlayType.HIGHLIGHT: {
      const h = overlay as AnyOverlay & { color: string; points: Point[] }
      const strokeWidth = (overlay as any).strokeWidth || 12
      obj = new Path(`M ${h.points.map((p) => `${p.x * scale} ${p.y * scale}`).join(' L ')}`, {
        stroke: h.color,
        strokeWidth: strokeWidth * scale,
        opacity: overlay.opacity,
        fill: undefined,
        selectable: true,
        evented: true,
      })
      break
    }
    case OverlayType.IMAGE:
    case OverlayType.SIGNATURE: {
      const img = overlay as AnyOverlay & { src: string }
      FabricImage.fromURL(img.src).then((fimg) => {
        fimg.set({
          left: overlay.x * scale,
          top: overlay.y * scale,
          scaleX: (overlay.width * scale) / (fimg.width || 1),
          scaleY: (overlay.height * scale) / (fimg.height || 1),
          opacity: overlay.opacity,
        })
        setObjId(fimg, overlay.id)
        fabricCanvas!.add(fimg)
        fabricCanvas!.renderAll()
      }).catch((err) => {
        console.error('Error loading overlay image:', err)
      })
      return
    }
  }

  if (obj) {
    setObjId(obj, overlay.id)
    fabricCanvas.add(obj)
  }
}

function updateFabricObject(overlay: AnyOverlay) {
  if (!fabricCanvas) return
  const obj = fabricCanvas.getObjects().find((o: FabricObject) => getObjId(o) === overlay.id)
  if (!obj) return

  const scale = store.zoom
  obj.set({
    left: overlay.x * scale,
    top: overlay.y * scale,
    opacity: overlay.opacity,
  })

  if (obj.type === 'textbox' && overlay.type === OverlayType.TEXT) {
    const t = overlay as AnyOverlay & { text: string }
    ;(obj as Textbox).set({ text: t.text })
  }
}

function addTextAt(x: number, y: number) {
  if (!fabricCanvas) return

  const page = store.currentPageData
  if (!page) return

  const scale = store.zoom
  const pdfX = x / scale
  const pdfY = y / scale

  // Save to store for persistence via command
  const id = crypto.randomUUID()
  const overlayData: AnyOverlay = {
    id,
    type: OverlayType.TEXT,
    page: store.currentPage,
    x: pdfX,
    y: pdfY,
    width: 200,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    text: 'Edit me',
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 1.2,
  } as AnyOverlay
  store.executeCommand(new AddOverlayCommand(store, overlayData))

  // Directly add a Textbox to the canvas and set it as active for immediate typing
  const textbox = new Textbox('Edit me', {
    left: x,
    top: y,
    fontSize: 16 * scale,
    fill: '#000000',
    fontFamily: 'Helvetica',
    width: 200 * scale,
    opacity: 1,
  })
  setObjId(textbox, id)
  fabricCanvas.add(textbox)
  fabricCanvas.setActiveObject(textbox)
  fabricCanvas.renderAll()
}

watch(() => store.pdfDocument, () => {
  if (pdfBgImage) {
    fabricCanvas?.remove(pdfBgImage)
    pdfBgImage = null
  }
  fabricCanvas?.clear()
  fabricCanvas!.backgroundColor = '#0f172a'
  renderPdfPage()
}, { immediate: false })

watch(() => store.zoom, () => {
  renderPdfPage()
  syncOverlaysToFabric()
})

watch(() => store.currentPage, () => {
  renderPdfPage()
})

watch(() => store.pageOverlays, () => {
  syncOverlaysToFabric()
}, { deep: true })

watch(
  () => store.tool,
  (t) => {
    if (fabricCanvas) {
      const isDrawingActive = t === 'draw' || t === 'highlight'
      fabricCanvas.selection = t === 'select'
      fabricCanvas.isDrawingMode = isDrawingActive
      if (t === 'pan') {
        fabricCanvas.defaultCursor = 'grab'
      } else {
        fabricCanvas.defaultCursor = t === 'select' ? 'default' : 'crosshair'
      }

      // Make existing objects selectable only in select mode
      fabricCanvas.getObjects().forEach((obj) => {
        if (obj !== pdfBgImage) {
          obj.selectable = t === 'select'
          obj.evented = t === 'select'
        }
      })

      // Explicitly create and configure PencilBrush when drawing tools are active
      if (isDrawingActive) {
        const brush = new PencilBrush(fabricCanvas)
        if (t === 'draw') {
          // Pen Tool: Sharp blue, thin brush width
          brush.color = '#3B82F6'
          brush.width = 3
        } else if (t === 'highlight') {
          // Highlight Tool: Translucent yellow highlighter, thicker brush width
          brush.color = 'rgba(250, 204, 21, 0.4)'
          brush.width = 12
        }
        fabricCanvas.freeDrawingBrush = brush
      }
    }
  },
)

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // Don't intercept if user is typing in an input/textarea or editing a textbox
    const target = e.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) return

    // Also skip if a Fabric textbox is in editing mode
    const activeObj = fabricCanvas?.getActiveObject()
    if (activeObj && (activeObj as any).isEditing) return

    e.preventDefault()
    deleteSelectedObject()
  }
}

function handleResize() {
  if (!fabricCanvas || !containerEl.value) return
  const rect = containerEl.value.getBoundingClientRect()
  fabricCanvas.setDimensions({ width: rect.width, height: rect.height })
  fabricCanvas.requestRenderAll()
}

onMounted(() => {
  createFabricCanvas()
  if (store.pdfDocument) renderPdfPage()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
  fabricCanvas?.dispose()
})
</script>

<template>
  <div
    ref="containerEl"
    class="flex-1 overflow-hidden bg-slate-950 flex items-center justify-center mx-auto w-full"
  >
    <canvas ref="canvasEl" />
  </div>
</template>