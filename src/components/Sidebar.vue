<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import PageThumbnail from './PageThumbnail.vue'

const store = useEditorStore()
</script>

<template>
  <div class="w-[180px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
    <div class="px-4 py-3 font-semibold text-sm border-b border-slate-800 text-slate-100">Pages</div>
    <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      <div
        v-for="pageNum in store.totalPages"
        :key="pageNum"
        class="p-2 rounded-md cursor-pointer border-2 transition-colors"
<<<<<<< Updated upstream
        :class="pageNum === store.currentPage ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'"
=======
        :class="
          pageNum === store.currentPage
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-transparent hover:border-slate-700'
        "
>>>>>>> Stashed changes
        @click="store.setCurrentPage(pageNum)"
      >
        <PageThumbnail :pageNumber="pageNum" />
        <div class="text-xs text-slate-400 mt-1 text-center">Page {{ pageNum }}</div>
      </div>
    </div>
  </div>
</template>