<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import { ToolType } from '../types'
import { ref } from 'vue'

const store = useEditorStore()
const fileInput = ref<HTMLInputElement>()

const emit = defineEmits<{
  openFile: [file: File]
  export: []
}>()

const tools = [
  { type: ToolType.SELECT, label: 'Select', icon: '↖' },
  { type: ToolType.TEXT, label: 'Text', icon: 'T' },
  { type: ToolType.DRAW, label: 'Draw', icon: '✎' },
  { type: ToolType.HIGHLIGHT, label: 'Highlight', icon: '🖍' },
  { type: ToolType.IMAGE, label: 'Image', icon: '🖼' },
  { type: ToolType.SIGNATURE, label: 'Signature', icon: '✍' },
]

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  emit('openFile', file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 select-none shrink-0"
  >
    <div class="flex items-center gap-1">
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="onFileChange"
      />
      <button
        class="px-2.5 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        @click="fileInput?.click()"
      >
        Open
      </button>
      <button
        class="px-2.5 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        @click="$emit('export')"
      >
        Export
      </button>
    </div>

    <div class="w-px h-6 bg-gray-300 mx-1" />

    <div class="flex items-center gap-1">
      <button
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200 disabled:opacity-40"
        :disabled="!store.canUndo()"
        @click="store.undo()"
      >
        ↩
      </button>
      <button
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200 disabled:opacity-40"
        :disabled="!store.canRedo()"
        @click="store.redo()"
      >
        ↪
      </button>
    </div>

    <div class="w-px h-6 bg-gray-300 mx-1" />

    <div class="flex items-center gap-1">
      <button
        v-for="t in tools"
        :key="t.type"
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        :class="{ 'bg-gray-200 border-gray-300': store.tool === t.type }"
        :title="t.label"
        @click="store.setTool(t.type)"
      >
        {{ t.icon }}
      </button>
    </div>

    <div class="w-px h-6 bg-gray-300 mx-1" />

    <div class="flex items-center gap-1">
      <button
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        @click="store.zoomOut()"
      >
        -
      </button>
      <span class="text-xs min-w-[40px] text-center text-gray-700"
        >{{ Math.round(store.zoom * 100) }}%</span
      >
      <button
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        @click="store.zoomIn()"
      >
        +
      </button>
      <button
        class="px-2 py-1.5 text-sm rounded border border-transparent hover:bg-gray-200"
        @click="store.zoomToFit()"
      >
        Fit
      </button>
    </div>
  </div>
</template>
