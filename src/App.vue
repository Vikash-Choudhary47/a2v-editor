<script setup lang="ts">
import { useEditorStore } from './stores/editorStore'
import { PdfRenderer } from './core/renderer/PdfRenderer'
import { PdfExporter } from './core/exporter/PdfExporter'
import { validatePdfFile } from './utils'
import Toolbar from './components/Toolbar.vue'
import Sidebar from './components/Sidebar.vue'
import CanvasView from './components/CanvasView.vue'
import Inspector from './components/Inspector.vue'

const store = useEditorStore()
const renderer = new PdfRenderer()
const exporter = new PdfExporter()

async function handleOpenFile(file: File) {
  if (!validatePdfFile(file)) {
    store.setError('Invalid file. Must be PDF under 50MB.')
    return
  }

  store.setLoading(true)
  store.setError(null)

  try {
    const doc = await renderer.loadDocument(file)
    store.setDocument(doc)
  } catch (err) {
    store.setError('Failed to load PDF')
    console.error(err)
  } finally {
    store.setLoading(false)
  }
}

function handleWelcomeFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleOpenFile(file)
  input.value = ''
}

function openWelcomeFile() {
  const el = document.getElementById('welcome-file-input') as HTMLInputElement | null
  el?.click()
}

async function handleExport() {
  if (!store.pdfDocument) return

  store.setLoading(true)
  store.setError(null)

  try {
    const blob = await exporter.export(store.pdfDocument, new ArrayBuffer(0))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edited-${store.pdfDocument.name}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    store.setError('Export failed')
    console.error(err)
  } finally {
    store.setLoading(false)
  }
}
</script>

<template>
  <div v-if="!store.pdfDocument" class="h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center p-12 bg-white rounded-xl shadow-sm">
      <h1 class="text-3xl font-bold text-gray-900">a²v-editor</h1>
      <p class="mt-3 text-base text-gray-500">Open a PDF to start editing</p>
      <input
        type="file"
        accept="application/pdf"
        class="hidden"
        id="welcome-file-input"
        @change="handleWelcomeFile"
      />
      <button
        class="mt-6 px-8 py-3 text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        @click="openWelcomeFile"
      >
        Open PDF
      </button>
      <p v-if="store.isLoading" class="mt-4 text-sm text-gray-500">Loading...</p>
      <p v-if="store.error" class="mt-4 text-sm text-red-500">{{ store.error }}</p>
    </div>
  </div>

  <div v-else class="h-screen flex flex-col bg-white">
    <Toolbar @open-file="handleOpenFile" @export="handleExport" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <CanvasView />
      <Inspector />
    </div>

    <div v-if="store.isLoading" class="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
      <div class="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>

    <div v-if="store.error" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-6 py-3 rounded-lg border border-red-200 flex items-center gap-3 z-50 shadow-sm">
      <span class="text-sm">{{ store.error }}</span>
      <button class="text-sm font-medium hover:text-red-800" @click="store.setError(null)">Dismiss</button>
    </div>
  </div>
</template>
