# a²v-editor — Complete Walkthrough

## What This Project Is

a²v-editor is a **PDF annotation tool that runs entirely in your browser**. You open a PDF, draw/text/highlight on top of it, and export the result as a new PDF. No server, no uploads, no accounts — just a web page.

The name is shorthand for "annotation to vector" — the annotations become vector graphics embedded in the exported PDF.

---

## The Big Picture (for non-webapp people)

### What is a "webapp"?

A webapp is a program that runs in your browser (Chrome, Firefox, Safari). You visit a URL, the browser downloads code (HTML/CSS/JS), and that code runs on your machine. Unlike a "website" which just shows text/pictures, a webapp is interactive — like a word processor or drawing program.

### How does the tech stack work?

**Vue 3** — The UI framework. It lets us write the interface as "components" (reusable chunks like a toolbar, a sidebar, a canvas). Each component has template (the HTML structure) and logic (what happens when you click things). Vue makes sure the interface updates automatically when data changes.

**TypeScript** — JavaScript with type checking. Helps catch bugs before they run. The `.ts` files compile down to regular JavaScript.

**Vite** — The tool that builds and serves the app during development. When you run `npm run dev`, Vite starts a local server and gives you a URL like `http://localhost:5173`. It also compiles TypeScript, bundles everything together, and handles hot-reload (the page updates automatically when you save a file).

**Tailwind CSS** — A utility-first way to style things. Instead of writing custom CSS files, you add classes directly in the HTML templates like `class="bg-blue-500 text-white p-4"`. Each class maps to a specific CSS property (bg-blue-500 = background color blue).

**Fabric.js** — The canvas library. It provides an interactive drawing surface ("fabric canvas") on top of the PDF page image. You can drag objects, select them, resize them — like a simplified Photoshop canvas.

**PDF.js** — Mozilla's library for reading PDFs in the browser. We use it to parse the PDF file and render each page as an image on the canvas.

**pdf-lib** — A library for *writing* PDFs. We use it to take the original PDF and embed the annotations into it as native PDF elements (text, rectangles, images).

**Pinia** — A state management library for Vue. Think of it as a centralized data store that every component can read from and write to. Instead of passing data through many layers of components, everything talks to one store.

---

## Project Structure

```
a²v-editor/
├── index.html              # Entry HTML page (the shell)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vitest.config.ts        # Test configuration
├── postcss.config.js       # PostCSS (CSS processing) config
└── src/
    ├── main.ts             # App entry: creates Vue app, mounts to #root
    ├── App.vue             # Root component: orchestrates everything
    ├── index.css           # Tailwind imports + global styles
    ├── models/             # Re-exports types (just a re-export layer)
    ├── types/              # All TypeScript type definitions
    ├── stores/             # Pinia state (central data store)
    ├── services/           # Thin service wrappers
    ├── commands/           # Command pattern for undo/redo
    ├── components/         # Vue UI components
    ├── core/               # Core engine classes
    │   ├── renderer/       # PDF rendering to canvas
    │   ├── exporter/       # Export annotations to PDF
    │   ├── overlays/       # CRUD operations on overlay objects
    │   ├── history/        # Undo/redo stack
    │   └── coordinates/    # Screen <-> PDF coordinate conversion
    └── __tests__/          # Unit tests
```

---

## Walkthrough: What Happens When You Open a PDF

### Step 1: The app loads

`index.html` contains a single `<div id="root">` and loads `src/main.ts`. `main.ts` creates a Vue app with Pinia (state management) and mounts it to that div. `App.vue` renders.

### Step 2: You see the welcome screen

`App.vue` checks `store.pdfDocument`. If null (no document loaded), it shows a welcome screen with a big "Open PDF" button. The button triggers `openWelcomeFile()` which programmatically clicks a hidden `<input type="file">`.

### Step 3: You select a PDF file

The file input fires `handleWelcomeFile()`, which extracts the `File` object and calls `handleOpenFile(file)`.

`handleOpenFile` does:
1. **Validate** — `validatePdfFile()` checks the file is under 50MB and has the correct MIME type `application/pdf`.
2. **Set loading state** — `store.setLoading(true)` makes a spinner appear.
3. **Load the document** — `renderer.loadDocument(file)` uses **PDF.js** to parse the file. It reads every page's dimensions (width/height) and builds a `PdfDocument` object. This is just metadata — it hasn't rendered any pixels yet.
4. **Store it** — `store.setDocument(doc)` saves the `PdfDocument` into Pinia state and resets page/zoom/selection.

### Step 4: The editor UI appears

When `store.pdfDocument` is no longer null, the template switches:
- Welcome screen hidden
- **Toolbar** appears at the top (Open, Export, Undo/Redo, Tools, Zoom)
- **Sidebar** appears on the left (page thumbnails)
- **CanvasView** takes the center (the interactive drawing area)
- **Inspector** appears on the right (property editor for selected objects)

### Step 5: The PDF page renders

`CanvasView.vue` on mount:
1. Creates a **Fabric.js canvas** — an HTML5 `<canvas>` element with interactive features (object selection, dragging, resizing).
2. Calls `renderPdfPage()` which:
   - Gets the current page number from the store.
   - Calls `renderer.renderPage(pageNumber, zoom)` on **PDF.js**. PDF.js draws the page to an offscreen `<canvas>` at the given zoom level. Results are cached so you don't re-render on every zoom change.
   - Converts that canvas to a data URL and creates a **Fabric.js Image** from it.
   - Adds the image to the Fabric canvas as a non-selectable background.
3. Calls `syncOverlaysToFabric()` which reads all overlay objects for the current page from the store and creates corresponding Fabric objects (textboxes, rectangles, circles, paths, images) on the canvas.

### Step 6: Watchers keep things in sync

Vue's `watch()` functions monitor:
- **Zoom changes** → re-render PDF background + re-sync overlays at new scale
- **Page changes** → render new page + sync its overlays
- **Overlay changes** (add/remove/update) → re-sync Fabric objects to match store state
- **Tool changes** → toggle canvas selection mode / drawing mode / cursor

The watchers are the "reactive glue" — they make sure the canvas always reflects the store state.

### Step 7: You add an annotation

When you select the Text tool and click the canvas:
1. Fabric.js fires `mouse:down` event.
2. `addTextAt(pointer.x, pointer.y)` creates a text overlay object with default properties and calls `store.addOverlay(...)`.
3. Pinia updates `pdfDocument` (which is reactive). The overlay watcher fires, calls `syncOverlaysToFabric()`, which creates a Fabric `Textbox` on the canvas.
4. You can now drag, select it, and edit its properties in the Inspector panel.

### Step 8: You export

Clicking Export calls `handleExport()`:
1. Gets the current `PdfDocument` from store (includes all overlay data).
2. Loads the **original PDF bytes** using `exporter.export(document, originalFile)`.
3. `PdfExporter` uses **pdf-lib** to:
   - Load the original PDF.
   - For each page with overlays, draw each overlay as a native PDF element (text with embedded font, rectangle, image).
   - Save to bytes and return as a `Blob`.
4. Creates a download link and triggers the browser download.

---

## Data Flow Diagram

```
User clicks canvas
       ↓
Fabric.js event (mouse:down)
       ↓
CanvasView.addTextAt(x, y)      ← coordinate conversion (screen → PDF space)
       ↓
store.addOverlay(textOverlay)   ← Pinia store mutation
       ↓
OverlayEngine.addObject()       ← immutable update (returns new object tree)
       ↓
Vue reactivity (watch on pageOverlays)
       ↓
syncOverlaysToFabric()          ← creates/updates Fabric.js objects
       ↓
fabricCanvas.renderAll()        ← repaints the canvas
```

---

## Key Concepts Explained

### Immutable State

The `OverlayEngine` never mutates an object. Every method (`addObject`, `removeObject`, `updateObject`) returns a **new** `PdfDocument` with the change applied. This ensures Vue's reactivity detects the change (since the reference changes).

### Screen vs PDF Coordinates

PDF coordinates have their origin at the **bottom-left** of the page. Screen/browser coordinates have origin at the **top-left**. `CoordinateMapper` handles the conversion between these two systems.

### The Command Pattern (Undo/Redo)

Every action that should be undoable is wrapped in a `Command` object (see `commands/`):
- Each command has `execute()` and `undo()` methods.
- `HistoryManager` maintains two stacks: undo and redo.
- Executing a command runs it and pushes to undo stack (clearing redo).
- Undo pops from undo stack, calls `undo()`, pushes to redo.
- Redo reverses the process.

### Caching

`PdfRenderer` caches rendered pages by `{pageNumber}-{zoom}` key. This avoids re-rendering the same page at the same zoom level. Cache is cleared when you zoom or navigate.

---

## How to Run

```bash
npm install        # Install all dependencies
npm run dev        # Start dev server at localhost:5173
npm run build      # Build for production
npm run test:run   # Run tests
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.vue` | Root component — welcome screen + editor layout |
| `src/stores/editorStore.ts` | All application state in one Pinia store |
| `src/components/CanvasView.vue` | The interactive Fabric.js canvas |
| `src/core/renderer/PdfRenderer.ts` | PDF.js wrapper — parse + render pages |
| `src/core/exporter/PdfExporter.ts` | pdf-lib wrapper — embed overlays into PDF |
| `src/core/overlays/OverlayEngine.ts` | Immutable CRUD for annotation objects |
| `src/core/history/HistoryManager.ts` | Undo/redo stack |
| `src/core/coordinates/CoordinateMapper.ts` | Screen <-> PDF coordinate conversion |
| `src/types/index.ts` | All TypeScript types in one place |
| `src/commands/base.ts` | Command interface for undo/redo |

## What Is Not Implemented Yet

From reading the code, these are gaps:
- **Drawing tool** — `ToolType.DRAW` exists but no mouse:down handler draws freeform paths
- **Highlight tool** — `ToolType.HIGHLIGHT` exists but needs a selection-based highlight flow
- **Image upload** — `ToolType.IMAGE` exists but no file-picker flow in CanvasView
- **Signature** — `ToolType.SIGNATURE` exists but no signature pad component
- **Fabric object event handlers** — No `mouse:move`, `mouse:up`, or `object:modified` handlers for drag-updating overlay positions back to the store
- **Sidebar page thumbnails** — The sidebar shows numbered placeholders, not actual rendered page previews
