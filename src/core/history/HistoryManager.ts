import type { Command } from '../../commands/base'

export class HistoryManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxStackSize: number

  constructor(maxStackSize = 100) {
    this.maxStackSize = maxStackSize
  }

  execute(command: Command): void {
    command.execute()
    this.undoStack.push(command)
    this.redoStack = []
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }
  }

  undo(): Command | null {
    const command = this.undoStack.pop()
    if (command) {
      command.undo()
      this.redoStack.push(command)
      return command
    }
    return null
  }

  redo(): Command | null {
    const command = this.redoStack.pop()
    if (command) {
      command.execute()
      this.undoStack.push(command)
      return command
    }
    return null
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  getUndoCount(): number {
    return this.undoStack.length
  }

  getRedoCount(): number {
    return this.redoStack.length
  }
}
