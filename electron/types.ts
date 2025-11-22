/**
 * Type definitions for IPC communication between main and renderer processes
 */

export interface ElectronAPI {
  // File operations
  openFile: () => Promise<{ filePath: string; data: ArrayBuffer } | null>;
  saveFile: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  openDirectory: () => Promise<string | null>;
  saveFileContent: (filePath: string, content: string | ArrayBuffer) => Promise<void>;

  // Project operations (future)
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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

