import { describe, it, expect } from 'vitest'
import { CoordinateMapper } from '../core/coordinates/CoordinateMapper'
import { HistoryManager } from '../core/history/HistoryManager'
import { OverlayEngine } from '../core/overlays/OverlayEngine'
import { ToolType, OverlayType, ShapeType } from '../types'
import type { PdfDocument, AnyOverlay } from '../types'

describe('CoordinateMapper', () => {
  const mapper = new CoordinateMapper()

  it('converts PDF coords to screen coords', () => {
    const result = mapper.pdfToScreen(100, 100, 842, 1)
    expect(result.x).toBe(100)
    expect(result.y).toBe(742)
  })

  it('converts screen coords back to PDF coords', () => {
    const result = mapper.screenToPdf(100, 742, 842, 1)
    expect(result.x).toBe(100)
    expect(result.y).toBeCloseTo(100)
  })

  it('applies zoom factor', () => {
    const result = mapper.pdfToScreen(100, 100, 842, 2)
    expect(result.x).toBe(200)
    expect(result.y).toBe(1484)
  })
})

describe('HistoryManager', () => {
  it('executes and undoes commands', () => {
    const history = new HistoryManager()
    let state = 0

    const cmd = {
      type: 'INCREMENT',
      execute: () => {
        state += 1
      },
      undo: () => {
        state -= 1
      },
    }

    history.execute(cmd)
    expect(state).toBe(1)
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)

    history.undo()
    expect(state).toBe(0)
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)

    history.redo()
    expect(state).toBe(1)
  })

  it('clears redo stack on new command', () => {
    const history = new HistoryManager()
    let state = 0

    const cmd1 = {
      type: 'A',
      execute: () => {
        state = 1
      },
      undo: () => {
        state = 0
      },
    }
    const cmd2 = {
      type: 'B',
      execute: () => {
        state = 2
      },
      undo: () => {
        state = 0
      },
    }

    history.execute(cmd1)
    history.undo()
    history.execute(cmd2)
    expect(history.canRedo()).toBe(false)
  })
})

describe('OverlayEngine', () => {
  const mockDoc: PdfDocument = {
    id: 'doc-1',
    name: 'test.pdf',
    pages: [{ pageNumber: 1, width: 595, height: 842, overlays: [] }],
  }

  const engine = new OverlayEngine()

  it('adds an object to a page', () => {
    const obj = engine.createTextOverlay({ page: 1, x: 100, y: 200, text: 'Hello' })
    const doc = engine.addObject(mockDoc, obj)
    expect(doc.pages[0].overlays).toHaveLength(1)
    expect(doc.pages[0].overlays[0].id).toBe(obj.id)
  })

  it('removes an object by id', () => {
    const obj = engine.createTextOverlay({ page: 1, x: 100, y: 200, text: 'Hello' })
    const withObj = engine.addObject(mockDoc, obj)
    const withoutObj = engine.removeObject(withObj, obj.id)
    expect(withoutObj.pages[0].overlays).toHaveLength(0)
  })

  it('updates an object', () => {
    const obj = engine.createTextOverlay({ page: 1, x: 100, y: 200, text: 'Hello' })
    const withObj = engine.addObject(mockDoc, obj)
    const updated = engine.updateObject(withObj, obj.id, { x: 300 } as Partial<AnyOverlay>)
    expect(updated.pages[0].overlays[0].x).toBe(300)
  })

  it('creates text overlay with defaults', () => {
    const obj = engine.createTextOverlay({ page: 1, x: 10, y: 20, text: 'Hi' }) as AnyOverlay & {
      fontSize: number
      color: string
    }
    expect(obj.type).toBe(OverlayType.TEXT)
    expect(obj.fontSize).toBe(16)
    expect(obj.color).toBe('#000000')
  })

  it('creates shape overlay', () => {
    const obj = engine.createShapeOverlay({
      page: 1,
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      shapeType: ShapeType.RECT,
    })
    expect(obj.type).toBe(OverlayType.RECT)
  })
})
