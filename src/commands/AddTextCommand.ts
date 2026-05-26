import type { Command } from './base'
import type { AnyOverlay } from '../types'
import type { ReturnUseEditorStore } from '../stores/editorStore'

export class AddTextCommand implements Command {
  readonly type = 'ADD_TEXT'

  constructor(
    private store: ReturnUseEditorStore,
    private object: AnyOverlay,
  ) {}

  execute(): void {
    this.store.addOverlay(this.object)
  }

  undo(): void {
    this.store.removeOverlay(this.object.id)
  }
}
