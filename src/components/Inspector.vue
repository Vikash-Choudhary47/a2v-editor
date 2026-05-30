<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import { OverlayType } from '../types'
import type { AnyOverlay } from '../types'
import { DeleteObjectCommand } from '../commands/DeleteObjectCommand'

const store = useEditorStore()

function update(key: string, value: string | number) {
  const overlay = store.selectedOverlay
  if (!overlay) return
  store.updateOverlay(overlay.id, { [key]: value } as Partial<AnyOverlay>)
}

function deleteAnnotation() {
  const overlay = store.selectedOverlay
  if (!overlay) return
  store.executeCommand(new DeleteObjectCommand(store, overlay.id))
  // Panel will revert to "No object selected" since removeOverlay clears selectedObjectId
  // The syncOverlaysToFabric watcher in CanvasView will remove the Fabric object from canvas
}
</script>

<template>
<<<<<<< Updated upstream
  <div class="w-[240px] bg-gray-50 border-l border-gray-200 flex flex-col shrink-0">
    <div class="px-4 py-3 font-semibold text-sm border-b border-gray-200 text-gray-700">Properties</div>
=======
  <div class="w-[240px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
    <div class="px-4 py-3 font-semibold text-sm border-b border-slate-800 text-slate-100">
      Properties
    </div>
>>>>>>> Stashed changes

    <div v-if="!store.selectedOverlay" class="p-6 text-center text-slate-500 text-sm">
      No object selected
    </div>

    <div v-else class="p-3 flex flex-col gap-3">
      <div>
        <label class="text-[11px] font-medium text-slate-400 uppercase">Type</label>
        <div class="text-sm text-slate-200">{{ store.selectedOverlay.type }}</div>
      </div>

      <div>
<<<<<<< Updated upstream
        <label class="text-[11px] font-medium text-gray-500 uppercase">X</label>
        <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" :value="Math.round(store.selectedOverlay.x)" @input="update('x', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Y</label>
        <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" :value="Math.round(store.selectedOverlay.y)" @input="update('y', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Width</label>
        <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" :value="Math.round(store.selectedOverlay.width)" @input="update('width', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Height</label>
        <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" :value="Math.round(store.selectedOverlay.height)" @input="update('height', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Opacity</label>
        <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" min="0" max="1" step="0.1" :value="store.selectedOverlay.opacity" @input="update('opacity', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
=======
        <label class="text-[11px] font-medium text-slate-400 uppercase">X</label>
        <input
          class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
          type="number"
          :value="Math.round(store.selectedOverlay.x)"
          @input="update('x', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-slate-400 uppercase">Y</label>
        <input
          class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
          type="number"
          :value="Math.round(store.selectedOverlay.y)"
          @input="update('y', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-slate-400 uppercase">Width</label>
        <input
          class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
          type="number"
          :value="Math.round(store.selectedOverlay.width)"
          @input="update('width', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-slate-400 uppercase">Height</label>
        <input
          class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
          type="number"
          :value="Math.round(store.selectedOverlay.height)"
          @input="update('height', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-slate-400 uppercase">Opacity</label>
        <input
          class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
          type="number"
          min="0"
          max="1"
          step="0.1"
          :value="store.selectedOverlay.opacity"
          @input="update('opacity', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
>>>>>>> Stashed changes
      </div>

      <template v-if="store.selectedOverlay.type === OverlayType.TEXT">
        <div>
<<<<<<< Updated upstream
          <label class="text-[11px] font-medium text-gray-500 uppercase">Font Size</label>
          <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="number" :value="(store.selectedOverlay as any).fontSize" @input="update('fontSize', parseFloat(($event.target as HTMLInputElement).value) || 0)" />
        </div>
        <div>
          <label class="text-[11px] font-medium text-gray-500 uppercase">Color</label>
          <input class="w-full px-2 py-1 text-sm border border-gray-300 rounded" type="text" :value="(store.selectedOverlay as any).color" @input="update('color', ($event.target as HTMLInputElement).value)" />
=======
          <label class="text-[11px] font-medium text-slate-400 uppercase">Font Size</label>
          <input
            class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
            type="number"
            :value="(store.selectedOverlay as any).fontSize"
            @input="update('fontSize', parseFloat(($event.target as HTMLInputElement).value) || 0)"
          />
        </div>
        <div>
          <label class="text-[11px] font-medium text-slate-400 uppercase">Color</label>
          <input
            class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
            type="text"
            :value="(store.selectedOverlay as any).color"
            @input="update('color', ($event.target as HTMLInputElement).value)"
          />
>>>>>>> Stashed changes
        </div>
      </template>

      <template v-if="store.selectedOverlay.type === OverlayType.HIGHLIGHT">
        <div>
          <label class="text-[11px] font-medium text-slate-400 uppercase">Color</label>
          <input
            class="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded focus:outline-none focus:border-blue-500 transition-colors"
            type="text"
            :value="(store.selectedOverlay as any).color"
            @input="update('color', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>

      <button
        class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors flex items-center justify-center gap-2 mt-4"
        @click="deleteAnnotation"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Annotation
      </button>
    </div>
  </div>
</template>