import { PdfRenderer } from '../core/renderer/PdfRenderer'
import { PdfExporter } from '../core/exporter/PdfExporter'
import type { PdfDocument } from '../types'

const renderer = new PdfRenderer()
const exporter = new PdfExporter()

export async function openPdf(file: File): Promise<PdfDocument> {
  return renderer.loadDocument(file)
}

export async function exportPdf(document: PdfDocument, originalFile: ArrayBuffer): Promise<Blob> {
  return exporter.export(document, originalFile)
}

export function getRenderer(): PdfRenderer {
  return renderer
}

export function getExporter(): PdfExporter {
  return exporter
}
