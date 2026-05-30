import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PdfDocument, AnyOverlay, Point } from '../../types'
import { OverlayType } from '../../types'

export class PdfExporter {
  async export(document: PdfDocument, originalFile: ArrayBuffer): Promise<Blob> {
    const pdfDoc = await PDFDocument.load(originalFile)
    const pages = pdfDoc.getPages()

    for (const pageData of document.pages) {
      const page = pages[pageData.pageNumber - 1]
      if (!page) continue

      const { width, height } = page.getSize()

      for (const overlay of pageData.overlays) {
        await this.renderOverlay(pdfDoc, page, overlay, width, height)
      }
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes as any], { type: 'application/pdf' })
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace('#', '')
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255
      const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255
      const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255
      return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b }
    }
    const num = parseInt(cleanHex, 16)
    const r = ((num >> 16) & 0xff) / 255
    const g = ((num >> 8) & 0xff) / 255
    const b = (num & 0xff) / 255
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b }
  }

  private async renderOverlay(
    pdfDoc: PDFDocument,
    page: ReturnType<typeof PDFDocument.prototype.getPages>[0],
    overlay: AnyOverlay,
    pageWidth: number,
    pageHeight: number,
  ): Promise<void> {
    const x = overlay.x * 1
    const y = pageHeight - overlay.y * 1 - overlay.height

    switch (overlay.type) {
      case OverlayType.HIGHLIGHT: {
        const h = overlay as AnyOverlay & { color: string; points: Point[] }
        if (!h.points || h.points.length < 2) break

        const strokeWidth = (overlay as any).strokeWidth || 12
        const color = this.hexToRgb(h.color || '#ffff00')

        for (let i = 0; i < h.points.length - 1; i++) {
          const p1 = h.points[i]
          const p2 = h.points[i + 1]
          page.drawLine({
            start: { x: p1.x, y: pageHeight - p1.y },
            end: { x: p2.x, y: pageHeight - p2.y },
            thickness: strokeWidth,
            color: rgb(color.r, color.g, color.b),
            opacity: overlay.opacity,
          })
        }
        break
      }
      case OverlayType.TEXT: {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        page.drawText((overlay as AnyOverlay & { text: string }).text, {
          x,
          y: y + overlay.height - 16,
          size: 16,
          font,
          color: rgb(0, 0, 0),
        })
        break
      }
      case OverlayType.RECT:
      case OverlayType.CIRCLE: {
        page.drawRectangle({
          x,
          y,
          width: overlay.width,
          height: overlay.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 2,
        })
        break
      }
      case OverlayType.IMAGE:
      case OverlayType.SIGNATURE: {
        const imgOverlay = overlay as AnyOverlay & { src: string }
        try {
          let image
          if (imgOverlay.src.startsWith('data:image/png')) {
            image = await pdfDoc.embedPng(this.dataUriToBytes(imgOverlay.src))
          } else {
            image = await pdfDoc.embedJpg(this.dataUriToBytes(imgOverlay.src))
          }
          page.drawImage(image, { x, y, width: overlay.width, height: overlay.height })
        } catch {
          console.warn('Skipping unembeddable image overlay')
        }
        break
      }
      default:
        break
    }
  }

  private dataUriToBytes(uri: string): Uint8Array {
    const base64 = uri.split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}

export class PdfExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfExportError'
  }
}
