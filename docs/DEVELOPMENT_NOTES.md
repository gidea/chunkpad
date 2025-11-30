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

---

## Electron Security Best Practices

**Reference:** [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)

### Current Security Status

#### ✅ **Implemented (Good)**

1. **Node.js Integration Disabled** ✅
   - `nodeIntegration: false` in webPreferences
   - Prevents remote content from accessing Node.js APIs

2. **Context Isolation Enabled** ✅
   - `contextIsolation: true` in webPreferences
   - Isolates preload script from renderer process

3. **Secure IPC Bridge** ✅
   - Preload script uses `contextBridge.exposeInMainWorld`
   - Does NOT expose raw `ipcRenderer` APIs
   - Callbacks properly sanitize event objects (no direct event passing)

4. **Window Creation Handler** ✅
   - `setWindowOpenHandler` implemented
   - External links opened in default browser
   - New window creation denied

5. **Current Electron Version** ✅
   - Using Electron 39.2.3 (latest as of review)
   - Regularly updated

6. **Secure Content Loading** ✅
   - Only loads local content (file:// or localhost in dev)
   - No remote content loaded

#### ⚠️ **Needs Improvement**

1. **Sandbox Mode Disabled** ⚠️
   - Current: `sandbox: false`
   - **Recommendation**: Enable sandbox mode
   - **Note**: May require refactoring file operations to work through IPC
   - **Priority**: Medium (app only loads local content, but sandbox adds defense-in-depth)

2. **No IPC Sender Validation** ⚠️
   - Current: IPC handlers don't validate `event.sender`
   - **Risk**: Any renderer process could send IPC messages
   - **Recommendation**: Add sender validation to all IPC handlers
   - **Priority**: High (security best practice)

3. **No Navigation Limits** ⚠️
   - Current: No `will-navigate` or `did-navigate` handlers
   - **Risk**: Renderer could navigate to unexpected URLs
   - **Recommendation**: Add navigation handlers to prevent navigation
   - **Priority**: Medium (app only loads local content, but good practice)

4. **No Content Security Policy** ⚠️
   - Current: No CSP meta tag in index.html
   - **Recommendation**: Add CSP header/meta tag
   - **Priority**: Medium (defense-in-depth against XSS)

5. **No Session Permission Handler** ⚠️
   - Current: No `ses.setPermissionRequestHandler`
   - **Note**: Not critical since we don't load remote content
   - **Recommendation**: Add for future-proofing
   - **Priority**: Low

6. **Using file:// Protocol** ⚠️
   - Current: Production uses `file://` protocol
   - **Recommendation**: Consider custom protocol (app://) for better security
   - **Priority**: Low (file:// is acceptable for local-only apps)

7. **shell.openExternal Validation** ⚠️
   - Current: Validates URL starts with `https:`
   - **Recommendation**: Add more robust URL validation (whitelist)
   - **Priority**: Low (current validation is reasonable)

### Security Checklist

Based on [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security):

- [x] 1. Only load secure content (local content only)
- [x] 2. Do not enable Node.js integration for remote content
- [x] 3. Enable context isolation in all renderers
- [ ] 4. Enable process sandboxing (currently disabled - see note above)
- [ ] 5. Use ses.setPermissionRequestHandler() (not critical for local-only app)
- [x] 6. Do not disable webSecurity (default enabled)
- [ ] 7. Define a Content Security Policy (missing)
- [x] 8. Do not enable allowRunningInsecureContent (default disabled)
- [x] 9. Do not enable experimental features (not used)
- [x] 10. Do not use enableBlinkFeatures (not used)
- [x] 11. <webview>: Do not use allowpopups (not using webview)
- [x] 12. <webview>: Verify options and params (not using webview)
- [ ] 13. Disable or limit navigation (not implemented)
- [x] 14. Disable or limit creation of new windows (implemented)
- [x] 15. Do not use shell.openExternal with untrusted content (validated)
- [x] 16. Use a current version of Electron (39.2.3)
- [ ] 17. Validate the sender of all IPC messages (not implemented)
- [ ] 18. Avoid usage of the file:// protocol (using file://, acceptable for local-only)
- [ ] 19. Check which fuses you can change (not checked)
- [x] 20. Do not expose Electron APIs to untrusted web content (properly isolated)

### Recommended Security Improvements

#### High Priority

1. **Add IPC Sender Validation**
   ```typescript
   // Helper function to validate sender
   function validateSender(frame: Electron.WebFrameMain): boolean {
     // For local-only app, validate it's from our app
     const url = new URL(frame.url);
     // In dev: localhost, in prod: file:// protocol
     return url.protocol === 'file:' || url.hostname === 'localhost';
   }
   
   // Use in all IPC handlers
   ipcMain.handle('file:open-dialog', async (event) => {
     if (!validateSender(event.senderFrame)) return null;
     // ... rest of handler
   });
   ```

2. **Add Navigation Limits**
   ```typescript
   win.webContents.on('will-navigate', (event, navigationUrl) => {
     const parsedUrl = new URL(navigationUrl);
     // Prevent navigation away from local content
     if (parsedUrl.protocol !== 'file:' && parsedUrl.hostname !== 'localhost') {
       event.preventDefault();
     }
   });
   ```

#### Medium Priority

3. **Add Content Security Policy**
   ```html
   <!-- In index.html -->
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;">
   ```

4. **Enable Sandbox Mode** (requires refactoring)
   - Move file operations to main process
   - Use IPC for all file access
   - Test thoroughly

#### Low Priority

5. **Add Session Permission Handler**
   ```typescript
   session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
     // Deny all permission requests (we don't need them for local-only app)
     callback(false);
   });
   ```

6. **Consider Custom Protocol**
   - Replace `file://` with `app://` protocol
   - Provides better security isolation
   - Requires protocol registration

### Security Notes

- **Local-Only App**: Since Chunkpad only loads local content and doesn't connect to remote servers, many security concerns are mitigated
- **File Operations**: All file operations go through main process IPC, which is secure
- **No Remote Content**: The app doesn't load or execute remote code, reducing attack surface
- **Defense in Depth**: Even though the app is local-only, implementing additional security measures provides defense-in-depth

### Testing Security

Before releasing, verify:
- [ ] IPC handlers validate sender
- [ ] Navigation is prevented to external URLs
- [ ] CSP is properly configured
- [ ] No console warnings about security issues
- [ ] File operations work correctly with security measures
- [ ] Window creation is properly limited

---

**Last Updated:** v0.1.1 - After security audit based on Electron security guidelines

