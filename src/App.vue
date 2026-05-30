<script setup lang="ts">
import { useEditorStore } from './stores/editorStore'
import { getRenderer, getExporter } from './services/pdfService'
import { validatePdfFile } from './utils'
import { OverlayType } from './types'
import Toolbar from './components/Toolbar.vue'
import Sidebar from './components/Sidebar.vue'
import CanvasView from './components/CanvasView.vue'
import Inspector from './components/Inspector.vue'
import SignatureModal from './components/SignatureModal.vue'
import { ref } from 'vue'

const store = useEditorStore()
const showSignatureModal = ref(false)
const renderer = getRenderer()
const exporter = getExporter()

async function handleOpenFile(file: File) {
  if (!validatePdfFile(file)) {
    store.setError('Invalid file. Must be PDF under 50MB.')
    return
  }

  store.setLoading(true)
  store.setError(null)

  try {
    const doc = await renderer.loadDocument(file)
    store.setDocument(doc, file)
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
  if (!store.pdfDocument || !store.originalFile) return

  store.setLoading(true)
  store.setError(null)

  try {
    const originalBytes = await store.originalFile.arrayBuffer()
    const blob = await exporter.export(store.pdfDocument, originalBytes)
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

async function handleAddImage(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    const img = new Image()
    img.onload = () => {
      store.addOverlay({
        id: crypto.randomUUID(),
        type: OverlayType.IMAGE,
        page: store.currentPage,
        x: 100,
        y: 100,
        width: img.naturalWidth / 2,
        height: img.naturalHeight / 2,
        rotation: 0,
        opacity: 1,
        visible: true,
        src: src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })
    }
    img.src = src
  }
  reader.readAsDataURL(file)
}

function handleSaveSignature(dataUrl: string) {
  // Add signature as an overlay
  const img = new Image()
  img.onload = () => {
    store.addOverlay({
      id: crypto.randomUUID(),
      type: OverlayType.SIGNATURE,
      page: store.currentPage,
      x: 150,
      y: 150,
      width: 150, // Default width
      height: (150 * img.naturalHeight) / img.naturalWidth, // Aspect ratio
      rotation: 0,
      opacity: 1,
      visible: true,
      src: dataUrl,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    })
    showSignatureModal.value = false
  }
  img.src = dataUrl
}
</script>

<template>
  <div
    v-if="!store.pdfDocument"
    class="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950"
  >
    <!-- Animated background glow -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 blur-[120px] rounded-full w-96 h-96 animate-pulse pointer-events-none"
    />
    <!-- Secondary ambient glow -->
    <div
      class="absolute top-1/3 left-1/3 bg-indigo-500/10 blur-[100px] rounded-full w-80 h-80 animate-[pulse_4s_infinite] pointer-events-none"
    />

    <div
      class="relative z-10 text-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-10 max-w-lg w-full mx-4 transition-all duration-500 hover:border-indigo-500/30 animate-fade-in-up"
    >
      <!-- Floating Logo / Icon -->
      <div
        class="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
        style="animation: float 3s ease-in-out infinite;"
      >
        <svg
          class="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h1 class="text-4xl font-extrabold tracking-tight text-white">
        a<sup class="text-lg font-semibold text-blue-400">2</sup>v-editor
      </h1>

      <p class="mt-3 text-lg text-slate-400">
        A powerful browser-based vector PDF annotation tool
      </p>

      <p class="mt-1.5 text-sm text-slate-400/70">
        Edit, annotate, and sign your PDFs — all in your browser.
      </p>

      <input
        type="file"
        accept="application/pdf"
        class="hidden"
        id="welcome-file-input"
        @change="handleWelcomeFile"
      />

      <button
        class="group mt-8 inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-indigo-500/40 active:translate-y-0 cursor-pointer"
        @click="openWelcomeFile"
      >
        <svg
          class="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:-translate-y-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        Open PDF
      </button>

      <p v-if="store.isLoading" class="mt-5 text-sm text-slate-400 animate-pulse">Loading...</p>
      <p v-if="store.error" class="mt-5 text-sm text-red-400">{{ store.error }}</p>
    </div>
  </div>

  <div v-else class="h-screen flex flex-col bg-slate-950">
    <Toolbar 
      @open-file="handleOpenFile" 
      @add-image="handleAddImage" 
      @open-signature="showSignatureModal = true" 
      @export="handleExport" 
    />

    <div class="flex flex-1 overflow-hidden relative">
      <!-- Sidebar: visible on desktop, toggled on mobile -->
      <div
        :class="store.showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
        class="absolute md:relative z-30 h-full transition-transform duration-200"
      >
        <Sidebar />
      </div>

      <CanvasView />

      <!-- Inspector: visible on desktop, bottom drawer on mobile -->
      <div
        :class="[
          store.showInspector
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-0',
          store.showInspector ? '' : 'md:!translate-x-0',
        ]"
        class="absolute md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto z-30 h-[50vh] md:h-auto md:w-auto transition-transform duration-200"
      >
        <Inspector />
      </div>
    </div>

    <!-- Mobile toggle buttons -->
    <div class="fixed bottom-4 left-4 z-40 flex flex-col gap-2 md:hidden">
      <button
        class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
        @click="store.toggleSidebar()"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <div class="fixed bottom-4 right-4 z-40 flex flex-col gap-2 md:hidden">
      <button
        class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
        @click="store.toggleInspector()"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>
    </div>

<<<<<<< Updated upstream
    <div v-if="store.isLoading" class="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
      <div class="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>

    <div v-if="store.error" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-6 py-3 rounded-lg border border-red-200 flex items-center gap-3 z-50 shadow-sm">
      <span class="text-sm">{{ store.error }}</span>
      <button class="text-sm font-medium hover:text-red-800" @click="store.setError(null)">Dismiss</button>
=======
    <div
      v-if="store.isLoading"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
    </div>

    <div
      v-if="store.error"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-950/80 text-red-300 px-6 py-3 rounded-lg border border-red-800/50 flex items-center gap-3 z-50 shadow-sm backdrop-blur-sm"
    >
      <span class="text-sm">{{ store.error }}</span>
      <button class="text-sm font-medium hover:text-red-200 transition-colors" @click="store.setError(null)">
        Dismiss
      </button>
>>>>>>> Stashed changes
    </div>

    <!-- Signature Pad Modal -->
    <SignatureModal
      v-if="showSignatureModal"
      @close="showSignatureModal = false"
      @save="handleSaveSignature"
    />
  </div>
</template>
