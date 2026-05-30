<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getRenderer } from '../services/pdfService'

const props = defineProps<{
  pageNumber: number
}>()

const renderer = getRenderer()
const thumbnailUrl = ref<string | null>(null)
const isLoading = ref(true)

async function renderThumbnail() {
  isLoading.value = true
  try {
    // Render at 0.2 scale for thumbnail size
    const canvas = await renderer.renderPage(props.pageNumber, 0.2)
    thumbnailUrl.value = canvas.toDataURL()
  } catch (err) {
    console.error(`Error rendering thumbnail for page ${props.pageNumber}:`, err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  renderThumbnail()
})

// Re-render if document changes or page is somehow updated
watch(() => props.pageNumber, () => {
  renderThumbnail()
})
</script>

<template>
  <div class="aspect-[210/297] bg-slate-800 rounded flex items-center justify-center overflow-hidden relative border border-slate-700">
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-slate-800">
      <div class="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
    <img v-else-if="thumbnailUrl" :src="thumbnailUrl" class="w-full h-full object-contain" alt="Page preview" />
    <span v-else class="text-2xl font-semibold text-slate-500">{{ pageNumber }}</span>
  </div>
</template>