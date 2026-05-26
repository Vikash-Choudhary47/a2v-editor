<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import { OverlayType } from '../types'
import type { AnyOverlay } from '../types'

const store = useEditorStore()

function update(key: string, value: string | number) {
  const overlay = store.selectedOverlay
  if (!overlay) return
  store.updateOverlay(overlay.id, { [key]: value } as Partial<AnyOverlay>)
}
</script>

<template>
  <div class="w-[240px] bg-gray-50 border-l border-gray-200 flex flex-col shrink-0">
    <div class="px-4 py-3 font-semibold text-sm border-b border-gray-200 text-gray-700">
      Properties
    </div>

    <div v-if="!store.selectedOverlay" class="p-6 text-center text-gray-400 text-sm">
      No object selected
    </div>

    <div v-else class="p-3 flex flex-col gap-3">
      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Type</label>
        <div class="text-sm text-gray-700">{{ store.selectedOverlay.type }}</div>
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">X</label>
        <input
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          type="number"
          :value="Math.round(store.selectedOverlay.x)"
          @input="update('x', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Y</label>
        <input
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          type="number"
          :value="Math.round(store.selectedOverlay.y)"
          @input="update('y', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Width</label>
        <input
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          type="number"
          :value="Math.round(store.selectedOverlay.width)"
          @input="update('width', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Height</label>
        <input
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          type="number"
          :value="Math.round(store.selectedOverlay.height)"
          @input="update('height', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <div>
        <label class="text-[11px] font-medium text-gray-500 uppercase">Opacity</label>
        <input
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          type="number"
          min="0"
          max="1"
          step="0.1"
          :value="store.selectedOverlay.opacity"
          @input="update('opacity', parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />
      </div>

      <template v-if="store.selectedOverlay.type === OverlayType.TEXT">
        <div>
          <label class="text-[11px] font-medium text-gray-500 uppercase">Font Size</label>
          <input
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            type="number"
            :value="(store.selectedOverlay as any).fontSize"
            @input="update('fontSize', parseFloat(($event.target as HTMLInputElement).value) || 0)"
          />
        </div>
        <div>
          <label class="text-[11px] font-medium text-gray-500 uppercase">Color</label>
          <input
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            type="text"
            :value="(store.selectedOverlay as any).color"
            @input="update('color', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>
    </div>
  </div>
</template>
