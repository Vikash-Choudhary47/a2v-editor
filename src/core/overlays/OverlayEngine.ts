import type { AnyOverlay, PdfDocument } from '../../types'
import { OverlayType, ShapeType } from '../../types'

export class OverlayEngine {
  addObject(document: PdfDocument, object: AnyOverlay): PdfDocument {
    return {
      ...document,
      pages: document.pages.map((p) =>
        p.pageNumber === object.page
          ? { ...p, overlays: [...p.overlays, object] }
          : p,
      ),
    }
  }

  removeObject(document: PdfDocument, id: string): PdfDocument {
    return {
      ...document,
      pages: document.pages.map((p) => ({
        ...p,
        overlays: p.overlays.filter((o) => o.id !== id),
      })),
    }
  }

  updateObject(
    document: PdfDocument,
    id: string,
    updates: Partial<AnyOverlay>,
  ): PdfDocument {
    return {
      ...document,
      pages: document.pages.map((p) => ({
        ...p,
        overlays: p.overlays.map((o) =>
          o.id === id ? ({ ...o, ...updates } as AnyOverlay) : o,
        ),
      })),
    }
  }

  getObject(document: PdfDocument, id: string): AnyOverlay | undefined {
    for (const page of document.pages) {
      const found = page.overlays.find((o) => o.id === id)
      if (found) return found
    }
    return undefined
  }

  getPageOverlays(document: PdfDocument, pageNumber: number): AnyOverlay[] {
    const page = document.pages.find((p) => p.pageNumber === pageNumber)
    return page?.overlays ?? []
  }

  getAllOverlays(document: PdfDocument): AnyOverlay[] {
    return document.pages.flatMap((p) => p.overlays)
  }

  moveObject(document: PdfDocument, id: string, dx: number, dy: number): PdfDocument {
    const existing = this.getObject(document, id)
    return this.updateObject(document, id, {
      x: (existing?.x ?? 0) + dx,
      y: (existing?.y ?? 0) + dy,
    } as Partial<AnyOverlay>)
  }

  createTextOverlay(params: {
    page: number
    x: number
    y: number
    text: string
    fontSize?: number
    fontFamily?: string
    color?: string
  }): AnyOverlay {
    return {
      id: crypto.randomUUID(),
      type: OverlayType.TEXT,
      page: params.page,
      x: params.x,
      y: params.y,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      text: params.text,
      fontSize: params.fontSize ?? 16,
      fontFamily: params.fontFamily ?? 'Helvetica',
      color: params.color ?? '#000000',
      textAlign: 'left',
      lineHeight: 1.2,
    }
  }

  createShapeOverlay(params: {
    page: number
    x: number
    y: number
    width: number
    height: number
    shapeType: ShapeType
    stroke?: string
    fill?: string
  }): AnyOverlay {
    return {
      id: crypto.randomUUID(),
      type: OverlayType.RECT,
      page: params.page,
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      shapeType: params.shapeType,
      stroke: params.stroke ?? '#000000',
      strokeWidth: 2,
      fill: params.fill ?? 'transparent',
      fillOpacity: 0.3,
    }
  }
}
