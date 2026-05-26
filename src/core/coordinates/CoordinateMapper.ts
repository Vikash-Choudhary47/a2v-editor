import type { Point } from '../../types'

export class CoordinateMapper {
  pdfToScreen(
    x: number,
    y: number,
    pageHeight: number,
    zoom: number,
    offsetX = 0,
    offsetY = 0,
  ): Point {
    return {
      x: x * zoom + offsetX,
      y: pageHeight * zoom - y * zoom + offsetY,
    }
  }

  screenToPdf(
    sx: number,
    sy: number,
    pageHeight: number,
    zoom: number,
    offsetX = 0,
    offsetY = 0,
  ): Point {
    return {
      x: (sx - offsetX) / zoom,
      y: pageHeight - (sy - offsetY) / zoom,
    }
  }

  applyZoom(value: number, zoom: number): number {
    return value * zoom
  }

  applyZoomInverse(value: number, zoom: number): number {
    return value / zoom
  }
}
