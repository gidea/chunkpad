# Electron Desktop App Migration Plan

## Executive Summary

This plan outlines the migration of the existing React web application (Document Chunker) into a native Electron desktop application. The current webapp is fully functional with PDF, DOCX, and PPTX parsing, intelligent chunking, rich text editing, and export capabilities—all running client-side in the browser.

**Key Strategy**: Preserve existing functionality while adding desktop-specific features like native file dialogs, menu bars, persistent storage, and improved file system integration.

---

## Current State Analysis

### ✅ Existing Functionality (To Preserve)

1. **Document Parsing** (All client-side)
   - PDF parsing via `pdfjs-dist`
   - DOCX parsing via `mammoth`
   - PPTX parsing via `jszip` + XML parsing
   - All parsers work in browser environment

2. **Chunking Engine**
   - Token counting with `tiktoken`
   - Semantic boundary-aware chunking
   - Configurable chunk size (200-3000 tokens)
   - Overlap support (0-500 tokens)
   - Re-chunking capability

3. **Rich Text Editing**
   - TipTap editor with full formatting
   - Front matter (YAML) support
   - Real-time token counting
   - Metadata management

4. **Export System**
   - JSON, Markdown, Plain Text formats
   - Single file or multiple files mode
   - Chunk selection
   - Metadata integration

5. **UI Components**
   - shadcn/ui component library
   - Responsive layout
   - Drag-and-drop chunk reordering
   - File list management

### 🔄 What Needs to Change

1. **File Access**: Replace browser file input with Electron native dialogs
2. **Export**: Replace browser download with Electron save dialogs
3. **Persistence**: Add file-based storage (optional, beyond localStorage)
4. **Menu Bar**: Add native application menu
5. **Window Management**: Handle window lifecycle properly
6. **Build System**: Add Electron build configuration

---

## Migration Phases

## Phase 1: Electron Foundation Setup

**Goal**: Get Electron running with the existing React app

### Task 1.1: Install Electron Dependencies
- [ ] Install `electron` (latest stable)
- [ ] Install `electron-builder` for packaging
- [ ] Install `vite-plugin-electron` for Vite integration
- [ ] Install `electron-updater` (optional, for auto-updates)

### Task 1.2: Create Electron Main Process
- [ ] Create `electron/main.ts`:
  - Window creation with proper dimensions (1400x900 default)
  - Load Vite dev server in development
  - Load built files in production
  - Handle window lifecycle (close, minimize, maximize)
  - Enable DevTools in development mode

### Task 1.3: Create Preload Script
- [ ] Create `electron/preload.ts`:
  - Expose secure IPC bridge
  - Define TypeScript types for IPC channels
  - Set up context isolation

### Task 1.4: Update Vite Configuration
- [ ] Configure `vite-plugin-electron`:
  - Main process entry point
  - Preload script entry point
  - Renderer process configuration
  - Handle WASM plugins (for tiktoken)

### Task 1.5: Update Package.json
- [ ] Add Electron scripts:
  - `electron:dev` - Run with Vite dev server
  - `electron:build` - Build for production
  - `electron:pack` - Package app
  - `electron:dist` - Create distributables
- [ ] Configure `electron-builder`:
  - App metadata (name, version, description)
  - Icon files (macOS, Windows, Linux)
  - Build targets (macOS, Windows, Linux)
  - File associations (.docx, .pptx, .pdf)

**Dependencies**: None  
**Estimated Time**: 3-4 hours  
**Deliverable**: Electron app shell that loads React UI

---

## Phase 2: Native File System Integration

**Goal**: Replace browser file APIs with Electron native dialogs

### Task 2.1: Implement File Open Dialog
- [ ] Create IPC handler in main process:
  - `file:open-dialog` - Show native file picker
  - Filter for .docx, .pptx, .pdf
  - Return file path and buffer
- [ ] Update preload script to expose `window.electronAPI.openFile()`
- [ ] Create TypeScript types for IPC

### Task 2.2: Update FileUploader Component
- [ ] Add "Open File" button that uses Electron dialog
- [ ] Keep drag-and-drop support (can work with Electron)
- [ ] Update `handleFileLoad` to accept file path or File object
- [ ] Handle file reading in renderer (or move to main process)

### Task 2.3: File Path Tracking
- [ ] Update `DocFile` type to include `filePath?: string`
- [ ] Store file paths for loaded documents
- [ ] Use file paths for "Save" functionality (future)

### Task 2.4: Recent Files Support (Optional)
- [ ] Store recent file paths in localStorage
- [ ] Add "Recent Files" menu item
- [ ] Quick access to recently opened documents

**Dependencies**: Phase 1  
**Estimated Time**: 2-3 hours  
**Deliverable**: Native file picker integration

---

## Phase 3: Native Export Integration

**Goal**: Replace browser downloads with Electron save dialogs

### Task 3.1: Implement Save Dialog
- [ ] Create IPC handler in main process:
  - `file:save-dialog` - Show native save dialog
  - Accept default filename and filters
  - Return chosen file path
- [ ] Update preload script to expose `window.electronAPI.saveFile()`

### Task 3.2: Update ExportDialog Component
- [ ] Replace `downloadFile()` function with Electron save dialog
- [ ] For single file: Use save dialog once
- [ ] For multiple files: Use save dialog for each file OR
  - Use directory picker to select output folder
  - Save all files to chosen directory
- [ ] Handle cancellation gracefully

### Task 3.3: Directory Export (Enhancement)
- [ ] Add "Export to Folder" option
- [ ] Use directory picker dialog
- [ ] Save all selected chunks to chosen directory
- [ ] Better UX for bulk exports

**Dependencies**: Phase 2  
**Estimated Time**: 2-3 hours  
**Deliverable**: Native save dialogs for exports

---

## Phase 4: Application Menu & Keyboard Shortcuts

**Goal**: Add native menu bar with standard desktop app features

### Task 4.1: Create Application Menu
- [ ] File Menu:
  - Open File (Cmd/Ctrl+O)
  - Open Recent (submenu)
  - Save Project (Cmd/Ctrl+S) - future feature
  - Export Selected (Cmd/Ctrl+E)
  - Separator
  - Quit (Cmd+Q / Alt+F4)
- [ ] Edit Menu:
  - Undo (Cmd/Ctrl+Z)
  - Redo (Cmd/Ctrl+Shift+Z)
  - Separator
  - Cut, Copy, Paste (standard shortcuts)
- [ ] View Menu:
  - Toggle Sidebar (Cmd/Ctrl+B)
  - Toggle DevTools (Cmd/Ctrl+Shift+I)
  - Separator
  - Zoom In/Out/Reset
- [ ] Window Menu (macOS):
  - Minimize, Zoom, Close
- [ ] Help Menu:
  - About
  - Keyboard Shortcuts
  - Documentation (opens in browser)

### Task 4.2: Implement Menu Actions
- [ ] Wire up menu items to existing functionality
- [ ] Use IPC for actions that need main process
- [ ] Update UI state from menu actions

### Task 4.3: Keyboard Shortcuts
- [ ] Register global shortcuts in main process (if needed)
- [ ] Ensure editor shortcuts work (TipTap handles these)
- [ ] Add app-level shortcuts (Cmd+O, Cmd+E, etc.)

**Dependencies**: Phase 2, Phase 3  
**Estimated Time**: 2-3 hours  
**Deliverable**: Native menu bar with full functionality

---

## Phase 5: Data Persistence & Project Management

**Goal**: Add ability to save and load projects

### Task 5.1: Project File Format
- [ ] Define project file structure (JSON):
  ```typescript
  {
    version: string;
    files: DocFile[];
    chunksData: ChunksMap;
    globalMetadata: GlobalMetadata;
    chunkSize: number;
    overlapSize: number;
    lastSaved: string;
  }
  ```
- [ ] Use `.chunklist` or `.chunkproj` extension

### Task 5.2: Save Project
- [ ] Add "Save Project" menu item and IPC handler
- [ ] Serialize current state to JSON
- [ ] Use save dialog with `.chunklist` extension
- [ ] Handle save errors

### Task 5.3: Load Project
- [ ] Add "Open Project" option to file dialog
- [ ] Parse project file and restore state
- [ ] Validate project file format
- [ ] Handle migration for different versions

### Task 5.4: Auto-save (Optional)
- [ ] Implement auto-save to temp location
- [ ] Restore on app crash/restart
- [ ] Clear temp files on clean exit

**Dependencies**: Phase 4  
**Estimated Time**: 3-4 hours  
**Deliverable**: Save/load project functionality

---

## Phase 6: Performance & Optimization

**Goal**: Optimize for desktop environment

### Task 6.1: Large File Handling
- [ ] Consider moving parsing to main process for very large files
- [ ] Add progress indicators for parsing
- [ ] Implement streaming for large PDFs (if needed)
- [ ] Add file size warnings

### Task 6.2: Memory Management
- [ ] Monitor memory usage
- [ ] Implement lazy loading for chunk content
- [ ] Clear unused file buffers
- [ ] Add memory usage indicator (dev mode)

### Task 6.3: Startup Performance
- [ ] Optimize initial bundle size
- [ ] Lazy load heavy dependencies (PDF.js, etc.)
- [ ] Show splash screen during initialization
- [ ] Cache parsed documents in memory

### Task 6.4: Renderer Process Optimization
- [ ] Keep existing React optimizations
- [ ] Ensure virtual scrolling works (if needed)
- [ ] Optimize re-renders
- [ ] Profile and fix bottlenecks

**Dependencies**: Phase 5  
**Estimated Time**: 3-4 hours  
**Deliverable**: Optimized desktop performance

---

## Phase 7: Platform-Specific Features

**Goal**: Add platform-specific enhancements

### Task 7.1: macOS Features
- [ ] Native title bar integration
- [ ] Touch Bar support (optional)
- [ ] Dock menu
- [ ] Proper app bundle structure
- [ ] Code signing (for distribution)

### Task 7.2: Windows Features
- [ ] Taskbar integration
- [ ] Jump lists (recent files)
- [ ] Windows-specific icons
- [ ] Installer (NSIS or MSI)

### Task 7.3: Linux Features
- [ ] AppImage, .deb, .rpm packages
- [ ] Desktop file integration
- [ ] System tray support (optional)

### Task 7.4: File Associations
- [ ] Register file handlers for .docx, .pptx, .pdf
- [ ] Handle "Open With" from file manager
- [ ] Process command-line arguments (file paths)

**Dependencies**: Phase 6  
**Estimated Time**: 4-5 hours  
**Deliverable**: Platform-optimized builds

---

## Phase 8: Testing & Polish

**Goal**: Ensure quality and reliability

### Task 8.1: Cross-Platform Testing
- [ ] Test on macOS (Intel & Apple Silicon)
- [ ] Test on Windows 10/11
- [ ] Test on Linux (Ubuntu, Fedora)
- [ ] Verify all features work on each platform

### Task 8.2: Error Handling
- [ ] Comprehensive error messages
- [ ] Handle corrupted files gracefully
- [ ] Network errors (if any network features)
- [ ] File permission errors
- [ ] Disk space errors

### Task 8.3: User Experience
- [ ] Loading states for all async operations
- [ ] Progress indicators for long operations
- [ ] Toast notifications for user actions
- [ ] Tooltips and help text
- [ ] Keyboard navigation

### Task 8.4: Documentation
- [ ] Update README with Electron setup
- [ ] Add build instructions
- [ ] Document keyboard shortcuts
- [ ] Create user guide

**Dependencies**: Phase 7  
**Estimated Time**: 4-5 hours  
**Deliverable**: Production-ready desktop app

---

## Technical Architecture

### Process Structure

```
┌─────────────────────────────────────┐
│     Main Process (Node.js)          │
│  ┌───────────────────────────────┐  │
│  │  Window Management            │  │
│  │  Menu Bar                     │  │
│  │  File System Operations       │  │
│  │  IPC Handlers                 │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ IPC
               ↓
┌─────────────────────────────────────┐
│  Preload Script (Bridge)            │
│  - Exposes secure API               │
│  - Context isolation                │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Renderer Process (React)           │
│  ┌───────────────────────────────┐  │
│  │  Existing React App           │  │
│  │  - Document Parsing           │  │
│  │  - Chunking Engine            │  │
│  │  - TipTap Editor              │  │
│  │  - Export Logic               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Key Design Decisions

1. **Keep Parsing in Renderer**: 
   - Existing parsers work well in browser
   - No need to refactor immediately
   - Can move to main process later if needed

2. **IPC Communication**:
   - File operations (open, save) → Main process
   - UI state → Renderer process
   - Menu actions → IPC → Renderer handlers

3. **State Management**:
   - Keep existing React state
   - Add project file persistence
   - Use localStorage for preferences

4. **Build Strategy**:
   - Vite for renderer bundling
   - Electron Builder for packaging
   - Separate builds for each platform

---

## File Structure Changes

```
chunklist/
├── electron/
│   ├── main.ts              # Main process entry
│   ├── preload.ts           # Preload script
│   └── types.ts             # IPC type definitions
├── src/                     # Existing React app (unchanged)
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── ...
├── build/                   # Electron builder config
│   ├── icons/               # App icons
│   └── ...
├── package.json
├── vite.config.ts           # Updated for Electron
└── electron-builder.yml     # Build configuration
```

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "electron": "^latest",
    "electron-builder": "^latest",
    "vite-plugin-electron": "^latest"
  }
}
```

**Note**: Existing dependencies (mammoth, pdfjs-dist, tiktoken, etc.) should work as-is in Electron renderer process.

---

## Migration Strategy

### Option A: Incremental Migration (Recommended)
1. Set up Electron shell (Phase 1)
2. Replace file operations one by one (Phase 2-3)
3. Add desktop features incrementally (Phase 4-7)
4. Test and polish (Phase 8)

**Pros**: Lower risk, can test at each phase  
**Cons**: Takes longer

### Option B: Big Bang Migration
1. Complete all phases at once
2. Test everything together

**Pros**: Faster overall  
**Cons**: Higher risk, harder to debug

**Recommendation**: Use Option A (Incremental)

---

## Success Criteria

- ✅ App runs on macOS, Windows, and Linux
- ✅ All existing features work (parsing, chunking, editing, export)
- ✅ Native file dialogs for open/save
- ✅ Native menu bar with standard shortcuts
- ✅ Project save/load functionality
- ✅ File associations work (.docx, .pptx, .pdf)
- ✅ Performance is acceptable (large files handled well)
- ✅ No regressions from web version
- ✅ Professional desktop app experience

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Electron Setup | 3-4 hours |
| Phase 2 | File System Integration | 2-3 hours |
| Phase 3 | Export Integration | 2-3 hours |
| Phase 4 | Menu & Shortcuts | 2-3 hours |
| Phase 5 | Persistence | 3-4 hours |
| Phase 6 | Performance | 3-4 hours |
| Phase 7 | Platform Features | 4-5 hours |
| Phase 8 | Testing & Polish | 4-5 hours |
| **Total** | | **23-31 hours** |

**Note**: This assumes familiarity with Electron. Add 20-30% buffer for learning curve.

---

## Risk Assessment

### Low Risk ✅
- Electron setup (well-documented)
- File dialogs (standard Electron APIs)
- Menu bar (standard Electron APIs)

### Medium Risk ⚠️
- WASM support (tiktoken) - may need special handling
- Large file parsing - performance concerns
- Cross-platform compatibility - need testing

### High Risk 🔴
- PDF.js in Electron - may need configuration
- State persistence - migration between versions
- Build configuration - platform-specific issues

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Start Phase 1** - Set up Electron foundation
3. **Test incrementally** - Verify each phase before moving on
4. **Iterate** - Adjust plan based on findings

---

## Questions to Consider

1. **Distribution**: Will you distribute via App Store, direct download, or both?
2. **Auto-updates**: Do you want automatic update functionality?
3. **Analytics**: Do you want usage analytics (privacy-preserving)?
4. **Licensing**: What license model (free, paid, freemium)?
5. **Code Signing**: Will you code sign for macOS/Windows?

---

This plan provides a comprehensive roadmap for migrating your web application to a desktop Electron app while preserving all existing functionality and adding desktop-specific enhancements.

