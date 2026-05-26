import * as pdfjsLib from 'pdfjs-dist'
import type { PdfDocument, PdfPage } from '../../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export class PdfRenderer {
  private doc: pdfjsLib.PDFDocumentProxy | null = null
  private pageCache = new Map<string, HTMLCanvasElement>()
  private textLayerCache = new Map<string, HTMLElement>()

  async loadDocument(file: File): Promise<PdfDocument> {
    const arrayBuffer = await file.arrayBuffer()
    this.doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pages: PdfPage[] = []
    for (let i = 1; i <= this.doc.numPages; i++) {
      const page = await this.doc.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      pages.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        overlays: [],
      })
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      pages,
    }
  }

  async renderPage(pageNumber: number, scale: number): Promise<HTMLCanvasElement> {
    if (!this.doc) throw new Error('No document loaded')

    const cacheKey = `${pageNumber}-${scale}`
    const cached = this.pageCache.get(cacheKey)
    if (cached) return cached

    const page = await this.doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport }).promise

    this.pageCache.set(cacheKey, canvas)
    return canvas
  }

  clearCache(pageNumber?: number): void {
    if (pageNumber) {
      for (const key of this.pageCache.keys()) {
        if (key.startsWith(`${pageNumber}-`)) {
          this.pageCache.delete(key)
        }
      }
    } else {
      this.pageCache.clear()
      this.textLayerCache.clear()
    }
  }

  destroy(): void {
    this.doc?.destroy()
    this.doc = null
    this.pageCache.clear()
    this.textLayerCache.clear()
  }
}

export class PdfRenderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfRenderError'
  }
}
