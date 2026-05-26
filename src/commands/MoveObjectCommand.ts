import type { Command } from './base'
import type { AnyOverlay } from '../types'
import type { ReturnUseEditorStore } from '../stores/editorStore'

export class MoveObjectCommand implements Command {
  readonly type = 'MOVE_OBJECT'
  private prevState: Partial<AnyOverlay>

  constructor(
    private store: ReturnUseEditorStore,
    private objectId: string,
    private newX: number,
    private newY: number,
  ) {
    const obj = store.getOverlay(objectId)
    this.prevState = { x: obj?.x ?? 0, y: obj?.y ?? 0 }
  }

  execute(): void {
    this.store.updateOverlay(this.objectId, {
      x: this.newX,
      y: this.newY,
    } as Partial<AnyOverlay>)
  }

  undo(): void {
    this.store.updateOverlay(this.objectId, this.prevState as Partial<AnyOverlay>)
  }
}
