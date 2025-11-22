# Development Notes

## Critical Files - DO NOT MODIFY WITHOUT EXTREME CAUTION

### Electron Main Process (`electron/main.ts`)

**⚠️ CRITICAL: Window Creation and Preload Script Loading**

The `createWindow()` function and preload script loading are **CRITICAL** for application startup. When modifying this file:

1. **NEVER** add blocking async operations inside `createWindow()` before window creation
2. **NEVER** add file I/O operations that could hang or block
3. **NEVER** modify the preload script path resolution logic (lines 45-88) without thorough testing
4. **ALWAYS** test window creation immediately after any changes

**What was broken in v0.1.1:**
- Added redundant file checking code inside `createWindow()` that blocked window creation
- The preload file is already checked at module level (lines 58-88), no need to check again
- File reading operations (`fs.readFile`, `fs.stat`) inside `createWindow()` caused the app to hang

**Safe patterns:**
- Preload path resolution should happen at module level (top-level code)
- Window creation should be synchronous or use minimal async operations
- Event listener setup should happen after window is created
- Cleanup should happen in `close` event, not `closed` event

**Memory leak fixes (v0.1.1) that are safe:**
- Event listener cleanup in `close` event handler
- Safety checks before removing listeners
- These patterns are correct and should be maintained

---

### Preload Script (`electron/preload.ts`)

**⚠️ CRITICAL: IPC Bridge**

This file creates the secure IPC bridge between main and renderer processes. Changes here can break all Electron functionality.

**DO NOT:**
- Remove or modify the `contextBridge.exposeInMainWorld` call
- Change IPC channel names without updating main process handlers
- Modify the ElectronAPI interface without updating TypeScript definitions

---

### Vite Configuration (`vite.config.ts`)

**⚠️ CRITICAL: Build Configuration**

The Electron build configuration is complex and fragile. The preload script build output format is critical.

**DO NOT:**
- Change the preload build output format without testing
- Modify rollupOptions for preload without understanding ESM requirements
- Change the entry points without updating main.ts paths

---

## Memory Leak Prevention Guidelines

When fixing memory leaks in Electron:

1. **Event Listeners:**
   - Always store cleanup functions
   - Clean up in `close` event (before destruction), not `closed` event
   - Check if window/webContents exist and aren't destroyed before cleanup
   - Wrap cleanup in try-catch

2. **Resource Cleanup:**
   - PDF.js documents: call `destroy()` in finally block
   - TipTap editors: call `destroy()` in useEffect cleanup
   - File handles: ensure proper closure

3. **Testing:**
   - Always test window creation after memory leak fixes
   - Test multiple window open/close cycles
   - Monitor memory usage during extended sessions

---

## Common Pitfalls

1. **Blocking async operations in createWindow():**
   - ❌ DON'T: `await fs.readFile()` before creating window
   - ✅ DO: Check files at module level, create window synchronously

2. **Cleaning up destroyed objects:**
   - ❌ DON'T: Remove listeners in `closed` event
   - ✅ DO: Remove listeners in `close` event with safety checks

3. **Redundant file checks:**
   - ❌ DON'T: Check preload file multiple times
   - ✅ DO: Check once at module level, reuse the path

---

## Testing Checklist

Before committing changes to Electron main process:

- [ ] Window opens successfully
- [ ] Preload script loads without errors
- [ ] Renderer process loads correctly
- [ ] Window can be closed without errors
- [ ] Multiple open/close cycles work
- [ ] No memory leaks in DevTools
- [ ] File operations work (open, save, etc.)
- [ ] IPC communication works

---

**Last Updated:** v0.1.1 - After fixing window creation hang

