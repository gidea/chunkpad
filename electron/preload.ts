/**
 * Preload script that exposes secure IPC bridge to renderer process
 * This runs in a context isolated from the main world
 * 
 * Following Electron's TypeScript guidelines:
 * https://www.electronjs.org/docs/latest/tutorial/context-isolation#usage-with-typescript
 * 
 * This script is built as ESM (ES Module) since Electron 20+ supports ESM preload scripts.
 * The build output will be preload.js (ESM format).
 */

// Import Electron APIs - Vite will compile this to ESM for the preload script
import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface inline (matches the renderer's type definition)
interface ElectronAPI {
  // File operations
  openFile: () => Promise<{ filePath: string; data: ArrayBuffer } | null>;
  saveFile: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  openDirectory: () => Promise<string | null>;
  saveFileContent: (filePath: string, content: string | ArrayBuffer) => Promise<void>;

  // Project operations
  saveProject: (data: unknown) => Promise<string | null>;
  loadProject: () => Promise<{ filePath: string; data: unknown } | null>;

  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // Platform info
  platform: NodeJS.Platform;

  // Menu event listeners
  onMenuOpenFile: (callback: () => void) => () => void;
  onMenuExport: (callback: () => void) => () => void;
  onMenuToggleSidebar: (callback: () => void) => () => void;
  onMenuShowShortcuts: (callback: () => void) => () => void;
  onMenuSaveProject: (callback: () => void) => () => void;
  onMenuSaveProjectAs: (callback: () => void) => () => void;
  onMenuLoadProject: (callback: () => void) => () => void;
  
  // File opening events (from command line or "Open With")
  onFileOpenDocument: (callback: (data: { filePath: string; data: ArrayBuffer }) => void) => () => void;
  onFileOpenProject: (callback: (data: { filePath: string; data: unknown }) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  // File operations
  openFile: () => ipcRenderer.invoke('file:open-dialog'),
  saveFile: (options) => ipcRenderer.invoke('file:save-dialog', options),
  openDirectory: () => ipcRenderer.invoke('file:open-directory'),
  saveFileContent: (filePath, content) => ipcRenderer.invoke('file:save-content', filePath, content),

  // Project operations (future)
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  loadProject: () => ipcRenderer.invoke('project:load'),

  // Window operations
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Platform info
  platform: process.platform,

  // Menu event listeners
  onMenuOpenFile: (callback: () => void) => {
    ipcRenderer.on('menu:open-file', callback);
    return () => ipcRenderer.removeListener('menu:open-file', callback);
  },
  onFileOpenDocument: (callback: (data: { filePath: string; data: ArrayBuffer }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { filePath: string; data: ArrayBuffer }) => callback(data);
    ipcRenderer.on('file:open-document', handler);
    return () => ipcRenderer.removeListener('file:open-document', handler);
  },
  onFileOpenProject: (callback: (data: { filePath: string; data: unknown }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { filePath: string; data: unknown }) => callback(data);
    ipcRenderer.on('file:open-project', handler);
    return () => ipcRenderer.removeListener('file:open-project', handler);
  },
  onMenuExport: (callback: () => void) => {
    ipcRenderer.on('menu:export', callback);
    return () => ipcRenderer.removeListener('menu:export', callback);
  },
  onMenuToggleSidebar: (callback: () => void) => {
    ipcRenderer.on('menu:toggle-sidebar', callback);
    return () => ipcRenderer.removeListener('menu:toggle-sidebar', callback);
  },
  onMenuShowShortcuts: (callback: () => void) => {
    ipcRenderer.on('menu:show-shortcuts', callback);
    return () => ipcRenderer.removeListener('menu:show-shortcuts', callback);
  },
  onMenuSaveProject: (callback: () => void) => {
    ipcRenderer.on('menu:save-project', callback);
    return () => ipcRenderer.removeListener('menu:save-project', callback);
  },
  onMenuSaveProjectAs: (callback: () => void) => {
    ipcRenderer.on('menu:save-project-as', callback);
    return () => ipcRenderer.removeListener('menu:save-project-as', callback);
  },
  onMenuLoadProject: (callback: () => void) => {
    ipcRenderer.on('menu:load-project', callback);
    return () => ipcRenderer.removeListener('menu:load-project', callback);
  },
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

