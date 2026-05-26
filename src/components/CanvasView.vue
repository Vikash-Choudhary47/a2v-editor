<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editorStore'
import { PdfRenderer } from '../core/renderer/PdfRenderer'
import { CoordinateMapper } from '../core/coordinates/CoordinateMapper'
import { Canvas, Rect, Circle, Textbox, Path, Image as FabricImage } from 'fabric'
import type { FabricObject, TPointerEventInfo, TPointerEvent } from 'fabric'
import type { Point } from '../types'
import { OverlayType } from '../types'
import type { AnyOverlay } from '../types'

const store = useEditorStore()

const canvasEl = ref<HTMLCanvasElement>()
const containerEl = ref<HTMLDivElement>()
let fabricCanvas: Canvas | null = null
let pdfBgImage: FabricImage | null = null

const renderer = new PdfRenderer()
const mapper = new CoordinateMapper()

function getObjId(obj: FabricObject): string | undefined {
  const o = obj as unknown as { data?: { overlayId?: string } }
  return o.data?.overlayId
}

function setObjId(obj: FabricObject, id: string) {
  ;(obj as unknown as { data: { overlayId: string } }).data = { overlayId: id }
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
  })

  fabricCanvas.on('mouse:down', (opt: TPointerEventInfo<TPointerEvent>) => {
    if (store.tool === 'text' && !opt.target) {
      const pointer = fabricCanvas!.getPointer(opt.e)
      addTextAt(pointer.x, pointer.y)
    }
  })
}

async function renderPdfPage() {
  if (!store.pdfDocument || !fabricCanvas) return

  const page = store.currentPageData
  if (!page) return

  try {
    const rendered = await renderer.renderPage(store.currentPage, store.zoom)
    const img = await FabricImage.fromURL(rendered.toDataURL(), { crossOrigin: 'anonymous' })

    if (pdfBgImage) fabricCanvas.remove(pdfBgImage)
    img.set({ left: 0, top: 0, selectable: false, evented: false })
    pdfBgImage = img
    fabricCanvas.add(img)
    fabricCanvas.sendObjectToBack(img)
    fabricCanvas.renderAll()
  } catch (err) {
    console.error('Render error:', err)
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
      obj = new Path(
        `M ${h.points.map((p) => `${p.x * scale} ${p.y * scale}`).join(' L ')}`,
        {
          stroke: h.color,
          strokeWidth: 12 * scale,
          opacity: 0.3,
          fill: undefined,
          selectable: false,
          evented: false,
        },
      )
      break
    }
    case OverlayType.IMAGE:
    case OverlayType.SIGNATURE: {
      const img = overlay as AnyOverlay & { src: string }
      FabricImage.fromURL(img.src, { crossOrigin: 'anonymous' }).then((fimg) => {
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
  const page = store.currentPageData
  if (!page) return

  const scale = store.zoom
  const pdfX = x / scale
  const pdfY = y / scale

  store.addOverlay({
    id: crypto.randomUUID(),
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
  })
}

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

watch(() => store.tool, (t) => {
  if (fabricCanvas) {
    fabricCanvas.selection = t === 'select'
    fabricCanvas.isDrawingMode = t === 'draw'
    fabricCanvas.defaultCursor = t === 'select' ? 'default' : 'crosshair'
  }
})

onMounted(() => {
  createFabricCanvas()
  if (store.pdfDocument) renderPdfPage()
})

onUnmounted(() => {
  renderer.destroy()
  fabricCanvas?.dispose()
})
</script>

<template>
  <div ref="containerEl" class="flex-1 overflow-hidden bg-gray-200 relative">
    <canvas ref="canvasEl" />
  </div>
</template>
