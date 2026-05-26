import type { Command } from './base'
import type { AnyOverlay } from '../types'
import type { ReturnUseEditorStore } from '../stores/editorStore'

export class DeleteObjectCommand implements Command {
  readonly type = 'DELETE_OBJECT'
  private deletedObject: AnyOverlay | null = null

  constructor(
    private store: ReturnUseEditorStore,
    private objectId: string,
  ) {}

  execute(): void {
    this.deletedObject = this.store.getOverlay(this.objectId) ?? null
    this.store.removeOverlay(this.objectId)
  }

  undo(): void {
    if (this.deletedObject) {
      this.store.addOverlay(this.deletedObject)
    }
  }
}
