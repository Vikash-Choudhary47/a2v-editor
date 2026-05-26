<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'

const store = useEditorStore()
</script>

<template>
  <div class="w-[180px] bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
    <div class="px-4 py-3 font-semibold text-sm border-b border-gray-200 text-gray-700">Pages</div>
    <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      <div
        v-for="pageNum in store.totalPages"
        :key="pageNum"
        class="p-2 rounded-md cursor-pointer border-2 transition-colors"
        :class="pageNum === store.currentPage ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'"
        @click="store.setCurrentPage(pageNum)"
      >
        <div class="aspect-[210/297] bg-gray-200 rounded flex items-center justify-center">
          <span class="text-2xl font-semibold text-gray-400">{{ pageNum }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1 text-center">Page {{ pageNum }}</div>
      </div>
    </div>
  </div>
</template>
