<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  close: []
  save: [dataUrl: string]
}>()

const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return

  // Setup styles
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function getPointerPos(e: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  
  if (e instanceof MouseEvent) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  } else {
    const touch = e.touches[0] || e.changedTouches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }
}

function startDrawing(e: MouseEvent | TouchEvent) {
  isDrawing = true
  const pos = getPointerPos(e)
  ctx?.beginPath()
  ctx?.moveTo(pos.x, pos.y)
  e.preventDefault()
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing) return
  const pos = getPointerPos(e)
  ctx?.lineTo(pos.x, pos.y)
  ctx?.stroke()
  e.preventDefault()
}

function stopDrawing() {
  isDrawing = false
  ctx?.closePath()
}

function clear() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function save() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  // Check if canvas is empty (basic check: see if we can find any pixel data other than white/transparent)
  const buffer = ctx?.getImageData(0, 0, canvas.width, canvas.height)
  if (!buffer) return
  
  let hasContent = false
  for (let i = 0; i < buffer.data.length; i += 4) {
    if (buffer.data[i + 3] > 0) { // alpha channel
      hasContent = true
      break
    }
  }
  
  if (!hasContent) return // Don't insert empty signature

  const dataUrl = canvas.toDataURL('image/png')
  emit('save', dataUrl)
}

onMounted(() => {
  initCanvas()
})
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-lg w-[500px] overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Draw Signature</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
      </div>
      
      <div class="p-6 flex flex-col items-center">
        <canvas
          ref="canvasRef"
          width="450"
          height="200"
          class="border border-dashed border-gray-300 rounded bg-gray-50 cursor-crosshair touch-none"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
        />
        <div class="w-full flex justify-between mt-4">
          <button @click="clear" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
            Clear
          </button>
          <div class="flex gap-2">
            <button @click="$emit('close')" class="px-4 py-2 text-sm border rounded hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button @click="save" class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">
              Add Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
