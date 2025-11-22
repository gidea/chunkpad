# Architecture Documentation

## System Overview

Chunkpad is a cross-platform desktop application built with Electron and React that processes documents entirely client-side. It follows a modular architecture with clear separation between document parsing, content chunking, editing, and export functionality. The application runs as a native desktop app on macOS, Windows, and Linux while maintaining the same core functionality as the web version.

## High-Level Architecture

### Desktop App Architecture (Electron)

```
┌─────────────────────────────────────────────────────────────┐
│              Main Process (Node.js)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Window Management                                    │   │
│  │  Application Menu                                     │   │
│  │  File System Operations (Native Dialogs)             │   │
│  │  IPC Handlers                                         │   │
│  │  Platform-Specific Features (Dock, Taskbar, etc.)    │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │ IPC (Inter-Process Communication)
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Preload Script (Bridge)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Secure IPC Bridge                                    │   │
│  │  Context Isolation                                    │   │
│  │  Exposed Electron APIs                                │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│          Renderer Process (React + Browser APIs)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User Interface Layer                                 │   │
│  │  (React Components + TipTap Editor + shadcn/ui)      │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────┴───────────────────────────────────┐   │
│  │  Application State                                    │   │
│  │  (React State + Project File Persistence)            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────┴───────────────────────────────────┐   │
│  │  Core Services Layer                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Document   │  │   Chunking   │  │   Export  │  │   │
│  │  │   Parsers    │  │    Engine    │  │ Formatters│  │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────┴───────────────────────────────────┐   │
│  │  External Libraries                                   │   │
│  │  pdfjs-dist | mammoth | jszip | tiktoken | turndown  │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Web Version Architecture (Legacy)

The web version maintains the same core architecture but runs entirely in the browser without Electron:

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  (React Components + TipTap Editor + shadcn/ui)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application State                         │
│         (React State + LocalStorage for Metadata)           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                   Core Services Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Document   │  │   Chunking   │  │     Export      │  │
│  │   Parsers    │  │    Engine    │  │    Formatters   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Libraries                          │
│  pdfjs-dist | mammoth | jszip | tiktoken | turndown        │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
chunklist/
├── electron/               # Electron-specific code
│   ├── main.ts            # Main process (window management, IPC)
│   ├── preload.ts         # Preload script (secure IPC bridge)
│   └── types.ts           # IPC type definitions
│
├── src/                    # React application (shared with web version)
│   ├── components/         # React UI components
│   │   ├── ui/            # shadcn/ui primitives
│   │   ├── AddChunkButton.tsx
│   │   ├── ChunkList.tsx
│   │   ├── DocumentMetadataDialog.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── FileList.tsx
│   │   ├── FileUploader.tsx
│   │   ├── GlobalMetadataDialog.tsx
│   │   ├── KeyboardShortcutsDialog.tsx  # Desktop: Keyboard shortcuts help
│   │   ├── LoadingOverlay.tsx           # Desktop: Loading indicators
│   │   ├── Logo.tsx
│   │   ├── MarkdownEditor.tsx
│   │   ├── MenuBar.tsx
│   │   ├── NavLink.tsx
│   │   └── SettingsDialog.tsx
│   │
│   ├── lib/               # Core business logic
│   │   ├── chunking.ts
│   │   ├── docxParser.ts
│   │   ├── frontMatter.ts
│   │   ├── htmlToMarkdown.ts
│   │   ├── pdfParser.ts
│   │   ├── pptxParser.ts
│   │   ├── project.ts     # Desktop: Project file serialization
│   │   └── utils.ts
│   │
│   ├── pages/             # Page components
│   │   ├── Index.tsx      # Main application page
│   │   └── NotFound.tsx
│   │
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # Includes ProjectData interface
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── data/              # Static data
│   │   └── mockData.ts
│   │
│   ├── assets/            # Static assets
│   │   └── *.svg, *.png
│   │
│   ├── App.tsx            # Root component
│   ├── index.css          # Global styles + design system
│   └── main.tsx           # Application entry point
│
├── build/                 # Electron builder configuration
│   └── icons/             # App icons for different platforms
│
├── package.json           # Dependencies and build scripts
├── vite.config.ts         # Vite + Electron configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Core Components

### 1. Document Parsing Layer

#### PDF Parser (`src/lib/pdfParser.ts`)

**Technology**: PDF.js (Mozilla's PDF rendering library)

**Process**:
1. Loads PDF as Uint8Array
2. Iterates through each page
3. Extracts text content with positioning data
4. Analyzes Y-coordinates to detect paragraph breaks
5. Groups text into semantic paragraphs
6. Outputs structured HTML with `<div data-source="pdf" data-page="N">` wrappers

**Key Features**:
- Paragraph detection based on vertical spacing
- Font size analysis for potential header detection
- Preserves page structure
- Handles multi-column layouts

**Output Format**:
```html
<div data-source="pdf" data-page="1">
  <h2>Page 1</h2>
  <p>First paragraph content...</p>
  <p>Second paragraph content...</p>
</div>
```

#### DOCX Parser (`src/lib/docxParser.ts`)

**Technology**: Mammoth.js

**Process**:
1. Receives ArrayBuffer from file upload
2. Mammoth converts DOCX to HTML
3. Preserves document structure (headings, lists, tables)
4. Returns semantic HTML

**Key Features**:
- Maintains heading hierarchy
- Preserves bold, italic, and underline formatting
- Converts tables to HTML `<table>` elements
- Handles lists with proper nesting

**Output Format**: Semantic HTML with proper tags (h1-h6, p, ul, ol, table)

#### PPTX Parser (`src/lib/pptxParser.ts`)

**Technology**: JSZip (for extracting PPTX structure)

**Process**:
1. Unzips PPTX (OpenXML format)
2. Iterates through `ppt/slides/slideN.xml` files
3. Parses XML using DOMParser
4. Extracts slide titles from placeholder elements
5. Extracts paragraphs from text body elements
6. Filters out duplicate title text from body content

**Key Features**:
- Namespace-aware XML parsing
- Title detection from presentation placeholders
- Paragraph-level text extraction
- Handles multiple text elements per slide

**Output Format**:
```html
<div data-source="pptx" data-page="1">
  <h2>Slide Title</h2>
  <p>Bullet point 1</p>
  <p>Bullet point 2</p>
</div>
```

### 2. Chunking Engine (`src/lib/chunking.ts`)

#### Algorithm Overview

The chunking engine intelligently splits documents while respecting semantic boundaries and maintaining context through overlap.

**Core Functions**:

1. **`countTokens(text: string): number`**
   - Uses tiktoken with GPT-3.5-turbo encoding
   - Returns accurate token count for AI model compatibility

2. **`chunkDocument(content, targetSize, overlapSize, metadata): Chunk[]`**
   - Main chunking algorithm
   - Respects HTML block boundaries
   - Handles oversized blocks with sentence splitting
   - Adds overlap between chunks
   - Generates titles from headings or creates generic titles

3. **`rechunkDocument(chunks, targetSize, overlapSize, metadata): Chunk[]`**
   - Combines existing chunks back into document
   - Re-chunks with new parameters
   - Useful for dynamic chunk size adjustment

4. **`formatChunkWithFrontMatter(chunk, metadata): string`**
   - Adds YAML front matter to chunk content
   - Merges global and chunk-specific metadata

#### Chunking Process Flow

```
Input: HTML Content
      ↓
Split by block elements (<p>, <h1-6>, <div>, <section>)
      ↓
For each block:
  ├─ Count tokens
  ├─ If oversized: split by sentences
  ├─ If fits in current chunk: append
  └─ If exceeds target: 
      ├─ Save current chunk
      ├─ Add overlap from previous chunk
      └─ Start new chunk with current block
      ↓
Output: Array of Chunk objects
```

#### Chunk Object Structure

```typescript
interface Chunk {
  id: string;           // Unique identifier
  title: string;        // Extracted from heading or auto-generated
  preview: string;      // First 100 chars of text content
  content: string;      // Full HTML content
  tokens?: number;      // Token count
  metadata?: {          // Optional metadata
    topic?: string;
    category?: string;
    "domain-area"?: string;
    [key: string]: string | undefined;
  };
}
```

#### Chunk Size Strategy

**Defaults**:
- Target: 1000 tokens
- Overlap: 150 tokens
- Minimum: ~500 tokens
- Maximum: Flexible (handles oversized blocks)

**Configurable Range**:
- Target: 200-3000 tokens
- Overlap: 0-500 tokens

### 3. Editing System

#### TipTap Editor (`src/components/MarkdownEditor.tsx`)

**Technology**: TipTap (ProseMirror-based rich text editor)

**Extensions Enabled**:
- StarterKit (basic formatting)
- Table, TableRow, TableCell, TableHeader
- Image
- Link
- Subscript, Superscript
- Text styling

**Features**:
- Real-time HTML editing
- Markdown-compatible output
- Toolbar with formatting buttons
- Front matter parsing and preservation
- Auto-save on content change

#### Metadata Management

**Two Levels**:

1. **Global Metadata** (`GlobalMetadataDialog.tsx`)
   - Applied to all chunks in a document
   - Stored per-file in application state
   - Used for document-wide classification

2. **Chunk Metadata** (`DocumentMetadataDialog.tsx`)
   - Applied to individual chunks
   - Overrides global metadata
   - Useful for fine-grained categorization

**Front Matter Integration** (`src/lib/frontMatter.ts`):
- Parses YAML front matter from markdown
- Extracts metadata key-value pairs
- Preserves front matter during editing
- Merges with global metadata on export

### 4. Export System

#### HTML-to-Markdown Conversion (`src/lib/htmlToMarkdown.ts`)

**Technology**: Turndown.js

**Configuration**:
```javascript
{
  headingStyle: "atx",           // # Heading style
  hr: "---",                     // Horizontal rules
  bulletListMarker: "-",         // List markers
  codeBlockStyle: "fenced",      // ``` code blocks
  emDelimiter: "*",              // *italic*
  strongDelimiter: "**"          // **bold**
}
```

**Functions**:

1. **`htmlToMarkdown(html: string): string`**
   - Converts HTML to clean markdown
   - Removes excessive whitespace
   - Handles errors gracefully with fallback

2. **`stripHtmlTags(html: string): string`**
   - Extracts plain text from HTML
   - Uses DOM parsing for accuracy
   - Collapses whitespace intelligently

#### Export Formats (`src/components/ExportDialog.tsx`)

**1. JSON Export**
```json
[
  {
    "id": "chunk-1-1234567890",
    "title": "Chunk 1: Introduction",
    "preview": "First 100 characters...",
    "content": "<p>Full HTML content...</p>",
    "tokens": 856,
    "metadata": {
      "topic": "Introduction",
      "category": "Documentation"
    }
  }
]
```

**2. Markdown Export**
```markdown
---
topic: Introduction
category: Documentation
---

# Chunk 1: Introduction

Paragraph content converted to clean markdown...

---

[Next chunk with same format]
```

**3. Plain Text Export**
```text
Chunk 1: Introduction
======================

Plain text extracted from HTML with proper spacing...


[Next chunk with same format]
```

**Export Modes**:
- **Single File**: All chunks combined into one file
- **Multiple Files**: One file per chunk with optional prefix and separator

## State Management

### Application State Structure

```typescript
// Main page state (src/pages/Index.tsx)
{
  files: DocFile[];                    // Loaded documents
  selectedFileId: string | null;       // Currently selected file
  selectedChunkId: string | null;      // Currently selected chunk
  chunksData: Record<string, Chunk[]>; // Chunks per file
  chunkSize: number;                   // Target chunk size
  overlapSize: number;                 // Chunk overlap
  globalMetadata: Record<string, GlobalMetadata>; // Metadata per file
  sidebarCollapsed: boolean;           // UI state
  editingFileName: boolean;            // UI state
  editingFileNameValue: string;        // UI state
}
```

### State Flow

```
User Action
    ↓
Event Handler (onClick, onChange, etc.)
    ↓
State Update (setState)
    ↓
Re-render affected components
    ↓
Update derived values (computed chunks, filtered lists)
```

### Data Persistence

**No Server Required**:
- All processing happens client-side
- No data leaves the browser
- Files are processed in memory
- State is ephemeral (resets on page reload)

**Future Enhancement Options**:
- LocalStorage for draft persistence
- IndexedDB for large document caching
- Backend integration for collaboration features

## Design System

### Tailwind Configuration (`tailwind.config.ts`)

**Color System**: HSL-based semantic tokens
```javascript
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  // ... and more
}
```

### CSS Variables (`src/index.css`)

**Light Mode**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

**Dark Mode**:
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Component Library

**shadcn/ui Components Used**:
- Dialog, Sheet (modals)
- Button, Input, Textarea, Checkbox, Radio
- Select, Slider (form controls)
- Card, Badge (content containers)
- Toast (notifications)
- Accordion, Collapsible (disclosure)
- Scroll Area (custom scrollbars)

## Performance Considerations

### Desktop App Optimizations

1. **Loading States**:
   - Progress indicators for file parsing (20% → 60% → 90% → 100%)
   - Loading overlays for async operations
   - File size warnings for large files (>50MB)

2. **Memory Management**:
   - Files processed in memory (renderer process)
   - Large file warnings (>50MB)
   - Efficient chunk rendering with search/filter

3. **Startup Performance**:
   - Fast window creation
   - Lazy loading of heavy dependencies
   - Optimized bundle size with Vite

4. **File Operations**:
   - Native dialogs (non-blocking)
   - Async file reading/writing
   - Progress feedback for long operations

### Web Version Optimizations

1. **Lazy Loading**:
   - Components loaded on-demand
   - Large libraries (PDF.js) loaded asynchronously

2. **Memoization**:
   - Expensive computations cached with `useMemo`
   - Event handlers stabilized with `useCallback`

3. **Virtual Scrolling** (Future Enhancement):
   - For documents with 100+ chunks
   - Would use `react-window` or similar

4. **Web Workers** (Future Enhancement):
   - Offload parsing to background thread
   - Prevent UI blocking on large files

### Platform Compatibility

**Desktop App Requirements**:
- **macOS**: macOS 10.13 (High Sierra) or later
- **Windows**: Windows 10 or later
- **Linux**: Modern distributions with GTK3 or later

**Web Version Requirements**:
- Modern browsers with ES6+ support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Key APIs Used**:
- File API (for file uploads)
- ArrayBuffer (for binary file handling)
- DOMParser (for XML parsing)
- Blob/URL APIs (for downloads)
- Electron APIs (desktop: native dialogs, file system)

## Security

### Desktop App Security

**Electron Security Model**:
- Context isolation enabled (prevents renderer from accessing Node.js)
- Node integration disabled in renderer process
- Sandbox mode disabled (required for file operations)
- Preload script provides secure API surface
- All file operations go through main process

**Benefits**:
- No data transmitted to servers
- Privacy-preserving by design
- No authentication required
- No data storage on external systems
- Files never leave user's device
- Suitable for sensitive documents

**IPC Security**:
- All IPC channels explicitly defined
- No arbitrary code execution from renderer
- Type-safe IPC communication via preload bridge

### Web Version Security

**Client-Side Processing**:
- No data transmitted to servers
- Privacy-preserving by design
- No authentication required
- No data storage on external systems
- All processing in browser memory
- Files never leave user's device
- Suitable for sensitive documents

### Dependency Security

**Regular Updates**:
- Dependencies updated via `npm audit`
- No known critical vulnerabilities
- All libraries from trusted sources (npm)
- Electron security best practices followed

## Testing Strategy (Future Enhancement)

### Recommended Testing Approach

1. **Unit Tests**:
   - Parsing functions (PDF, DOCX, PPTX)
   - Chunking algorithm
   - HTML-to-Markdown conversion
   - Token counting accuracy

2. **Integration Tests**:
   - File upload → Parse → Chunk flow
   - Edit → Export flow
   - Metadata application

3. **E2E Tests**:
   - Full user workflows
   - Cross-browser compatibility

**Suggested Tools**:
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)

## Electron Architecture Details

### Process Communication

**IPC (Inter-Process Communication)**:
- **Main Process** → **Renderer Process**: Uses `webContents.send()` for menu actions
- **Renderer Process** → **Main Process**: Uses `ipcRenderer.invoke()` for async operations
- **Preload Script**: Acts as secure bridge, exposes `window.electronAPI`

**IPC Channels**:
- `file:open-dialog` - Open file picker
- `file:save-dialog` - Save file picker
- `file:open-directory` - Directory picker
- `file:save-content` - Write file content
- `project:save` - Save project file
- `project:load` - Load project file
- `menu:*` - Menu action events
- `file:open-document` - Open document from command line
- `file:open-project` - Open project from command line

### File System Access

**Security Model**:
- Context isolation enabled
- Node integration disabled in renderer
- All file operations go through main process
- Preload script provides secure API surface

**File Operations**:
- File reading: Main process reads files, sends ArrayBuffer to renderer
- File writing: Renderer sends content to main process, main process writes
- Native dialogs: All file dialogs use Electron's native APIs

### Platform-Specific Features

**macOS**:
- Dock menu with quick actions
- Native title bar integration
- `open-file` event handling
- App menu in menu bar

**Windows**:
- Taskbar integration
- App user model ID for notifications
- NSIS installer support
- Jump lists (future enhancement)

**Linux**:
- AppImage, .deb, .rpm packages
- Desktop file integration
- System tray support (future enhancement)

## Deployment Architecture

### Desktop App Distribution

**Build Process**:
```
Source Code
    ↓
Vite Build (Renderer)
    ↓
Electron Build (Main + Preload)
    ↓
electron-builder Package
    ↓
Platform-Specific Distributables
```

**Distribution Formats**:
- **macOS**: `.dmg` (disk image), `.zip` (for direct distribution)
- **Windows**: `.exe` (NSIS installer), `.zip` (portable)
- **Linux**: `.AppImage` (portable), `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL)

**No Backend Required**:
- 100% client-side processing
- No server infrastructure needed
- Files never leave user's device
- Zero cloud costs

### Web Version Deployment (Optional)

The web version can still be deployed to static hosting:

```
User's Browser
      ↓
   CDN/Edge Network
      ↓
   Static Files (HTML, JS, CSS)
      ↓
   Client-Side Processing
```

**Recommended Platforms**:
1. **Vercel/Netlify** - Git integration, preview deployments
2. **GitHub Pages** - Free hosting for open source
3. **AWS S3 + CloudFront** - Enterprise-grade hosting

## Electron-Specific Components

### Main Process (`electron/main.ts`)

**Responsibilities**:
- Window lifecycle management
- Application menu creation
- Native file dialogs
- IPC handlers for file operations
- Platform-specific features (dock menu, etc.)
- Command-line argument handling
- File association handling

**Key Functions**:
- `createWindow()` - Creates and configures main window
- `createMenu()` - Builds platform-specific menu bar
- `handleFileOpen()` - Processes files opened from command line or "Open With"

### Preload Script (`electron/preload.ts`)

**Responsibilities**:
- Exposes secure IPC bridge to renderer
- Provides type-safe API surface
- Maintains context isolation
- Handles menu event forwarding

**Exposed API** (`window.electronAPI`):
- File operations (open, save, directory picker)
- Project operations (save, load)
- Window operations (minimize, maximize, close)
- Menu event listeners
- Platform information

### IPC Communication Flow

```
Renderer Process (React)
    ↓ (calls window.electronAPI.openFile())
Preload Script
    ↓ (ipcRenderer.invoke('file:open-dialog'))
Main Process
    ↓ (dialog.showOpenDialog())
Native OS Dialog
    ↓ (user selects file)
Main Process
    ↓ (reads file, returns data)
Preload Script
    ↓ (returns Promise result)
Renderer Process
    ↓ (receives file data)
React Component
    ↓ (processes file)
```

## Performance Considerations

### Desktop App Optimizations

1. **Loading States**:
   - Progress indicators for file parsing
   - Loading overlays for async operations
   - File size warnings for large files

2. **Memory Management**:
   - Files processed in memory (renderer process)
   - Large file warnings (>50MB)
   - Efficient chunk rendering

3. **Startup Performance**:
   - Fast window creation
   - Lazy loading of heavy dependencies
   - Optimized bundle size

4. **File Operations**:
   - Native dialogs (non-blocking)
   - Async file reading/writing
   - Progress feedback for long operations

## Future Architecture Enhancements

### Potential Improvements

1. **Backend Integration** (Optional):
   - User accounts and cloud sync
   - Collaboration features
   - Document history tracking
   - Multi-device synchronization

2. **AI Integration**:
   - Automatic chunk summarization
   - Keyword extraction
   - Semantic similarity scoring
   - Smart chunk merging/splitting

3. **Vector Database Export**:
   - Direct export to Pinecone, Weaviate, etc.
   - Automatic embedding generation
   - Batch export with metadata

4. **Real-time Collaboration** (Future):
   - Multiple users editing simultaneously
   - WebSocket-based sync
   - Operational transformation

5. **Advanced Parsing**:
   - OCR for scanned PDFs
   - Image extraction and analysis
   - Table structure preservation
   - Multi-language support

6. **Desktop Enhancements**:
   - Auto-update functionality
   - Recent files menu
   - System tray integration
   - Global keyboard shortcuts

---

This architecture is designed to be simple, maintainable, and extensible while providing robust document processing capabilities entirely client-side, with native desktop integration for an optimal user experience.
