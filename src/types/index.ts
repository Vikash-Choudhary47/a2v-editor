export enum ToolType {
  SELECT = 'select',
  TEXT = 'text',
  DRAW = 'draw',
  HIGHLIGHT = 'highlight',
  IMAGE = 'image',
  SIGNATURE = 'signature',
}

export enum OverlayType {
  TEXT = 'text',
  RECT = 'rect',
  CIRCLE = 'circle',
  LINE = 'line',
  HIGHLIGHT = 'highlight',
  IMAGE = 'image',
  SIGNATURE = 'signature',
}

export enum ShapeType {
  RECT = 'rect',
  CIRCLE = 'circle',
  LINE = 'line',
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface OverlayObject {
  id: string
  type: OverlayType
  page: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
}

export interface TextOverlay extends OverlayObject {
  type: OverlayType.TEXT
  text: string
  fontSize: number
  fontFamily: string
  color: string
  textAlign: CanvasTextAlign
  lineHeight: number
}

export interface ShapeOverlay extends OverlayObject {
  shapeType: ShapeType
  stroke: string
  strokeWidth: number
  fill: string
  fillOpacity: number
}

export interface HighlightOverlay extends OverlayObject {
  type: OverlayType.HIGHLIGHT
  color: string
  opacity: number
  points: Point[]
}

export interface ImageOverlay extends OverlayObject {
  type: OverlayType.IMAGE
  src: string
  naturalWidth: number
  naturalHeight: number
}

export interface SignatureOverlay extends OverlayObject {
  type: OverlayType.SIGNATURE
  src: string
  naturalWidth: number
  naturalHeight: number
}

export type AnyOverlay =
  | TextOverlay
  | ShapeOverlay
  | HighlightOverlay
  | ImageOverlay
  | SignatureOverlay

export interface PdfPage {
  pageNumber: number
  width: number
  height: number
  overlays: AnyOverlay[]
}

export interface PdfDocument {
  id: string
  name: string
  pages: PdfPage[]
  metadata?: Record<string, unknown>
}

export interface SelectionState {
  selectedIds: string[]
  resizeHandlesVisible: boolean
}
