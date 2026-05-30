<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import { ToolType } from '../types'
import { ref } from 'vue'

const store = useEditorStore()
const fileInput = ref<HTMLInputElement>()
const imageInput = ref<HTMLInputElement>()

const emit = defineEmits<{
  openFile: [file: File]
  addImage: [file: File]
  openSignature: []
  export: []
}>()

const tools = [
  { type: ToolType.SELECT, label: 'Select', icon: '↖' },
  { type: ToolType.TEXT, label: 'Text', icon: 'T' },
  { type: ToolType.DRAW, label: 'Draw', icon: '✎' },
  { type: ToolType.HIGHLIGHT, label: 'Highlight', icon: '🖍' },
  { type: ToolType.PAN, label: 'Pan', icon: '✋' },
  { type: ToolType.IMAGE, label: 'Image', icon: '🖼' },
  { type: ToolType.SIGNATURE, label: 'Signature', icon: '✍' },
]

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  emit('openFile', file)
  ;(e.target as HTMLInputElement).value = ''
}

function onImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  emit('addImage', file)
  ;(e.target as HTMLInputElement).value = ''
}

function onToolClick(type: ToolType) {
  if (type === ToolType.IMAGE) {
    imageInput.value?.click()
  } else if (type === ToolType.SIGNATURE) {
    emit('openSignature')
  } else {
    store.setTool(type)
  }
}
</script>

<template>
  <div
    class="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 select-none shrink-0"
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
        class="px-2.5 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        @click="fileInput?.click()"
      >
        Open
      </button>
      <button
        class="px-2.5 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        @click="$emit('export')"
      >
        Export
      </button>
    </div>

    <div class="w-px h-6 bg-slate-700 mx-1" />

    <div class="flex items-center gap-1">
      <button
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 disabled:opacity-40 transition-colors"
        :disabled="!store.canUndo"
        @click="store.undo()"
      >
        ↩
      </button>
      <button
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 disabled:opacity-40 transition-colors"
        :disabled="!store.canRedo"
        @click="store.redo()"
      >
        ↩
      </button>
    </div>

    <div class="w-px h-6 bg-slate-700 mx-1" />

    <div class="flex items-center gap-1">
      <button
        v-for="t in tools"
        :key="t.type"
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        :class="{ 'bg-slate-800 border-slate-600': store.tool === t.type }"
        :title="t.label"
        @click="onToolClick(t.type)"
      >
        {{ t.icon }}
      </button>
    </div>

    <div class="w-px h-6 bg-slate-700 mx-1" />

    <div class="flex items-center gap-1">
      <button
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        @click="store.zoomOut()"
      >
        -
      </button>
      <span class="text-xs min-w-[40px] text-center text-slate-400"
        >{{ Math.round(store.zoom * 100) }}%</span
      >
      <button
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        @click="store.zoomIn()"
      >
        +
      </button>
      <button
        class="px-2 py-1.5 text-sm text-slate-300 rounded border border-transparent hover:bg-slate-800 transition-colors"
        @click="store.zoomToFit()"
      >
        Fit
      </button>
    </div>
  </div>

  <input
    ref="imageInput"
    type="file"
    accept="image/*"
    class="hidden"
    @change="onImageChange"
  />
</template>