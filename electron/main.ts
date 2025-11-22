import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
// dist
// ├── main
// │   └── index.js    <- Main process (this file)
// ├── preload
// │   └── index.js    <- Preload script
// └── renderer
//     └── index.html  <- Renderer process

// Determine the correct paths based on build structure
// In development: __dirname points to dist-electron
// In production: __dirname points to the app's resources (inside .asar)
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// In production, files are in the app.asar archive
// In development, files are in dist-electron and dist directories
const APP_ROOT = isDev 
  ? path.join(__dirname, '..') 
  : app.getAppPath();

export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (process.platform === 'win32') app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

let win: BrowserWindow | null = null;

// Preload script path - vite-plugin-electron builds as ESM (.js)
// Since package.json has "type": "module", .js files are treated as ESM
// In both dev and production, __dirname points to dist-electron (where main.js is)
// So preload.js should be in the same directory as main.js
// Note: In production, files are in .asar archive, so we use the path directly
// Electron can load files from .asar archives using standard paths
const preloadJs = path.join(__dirname, 'preload.js');
const preloadMjs = path.join(__dirname, 'preload.mjs');

// Determine which preload file exists
// In production (.asar), existsSync may not work reliably, so we try to check
// but always default to the expected path
let preload: string;
console.log('[PRELOAD] Checking for preload script (ESM)...');
console.log('[PRELOAD] isDev:', isDev);
console.log('[PRELOAD] isPackaged:', app.isPackaged);
console.log('[PRELOAD] __dirname:', __dirname);
console.log('[PRELOAD] Looking for preload.js at:', preloadJs);
console.log('[PRELOAD] Looking for preload.mjs at:', preloadMjs);

// Try to check if files exist (works in dev, may not work reliably in .asar)
if (isDev) {
  if (existsSync(preloadJs)) {
    preload = preloadJs;
    console.log('[PRELOAD] ✓ Found preload.js (ESM)');
  } else if (existsSync(preloadMjs)) {
    preload = preloadMjs;
    console.log('[PRELOAD] ✓ Found preload.mjs (ESM)');
  } else {
    preload = preloadJs; // Default to .js
    console.warn('[PRELOAD] ⚠ Neither file found, defaulting to preload.js');
    try {
      const files = readdirSync(__dirname);
      console.warn('[PRELOAD] Files in dist-electron:', files);
    } catch (err) {
      console.warn('[PRELOAD] Could not read directory:', err);
    }
  }
} else {
  // In production, assume preload.js exists (it should be packaged)
  // Electron will throw an error if it doesn't exist when loading
  preload = preloadJs;
  console.log('[PRELOAD] Production mode: using preload.js');
}

// HTML file path
const indexHtml = path.join(RENDERER_DIST, 'index.html');

async function createWindow() {
  // Log paths for debugging
  console.log('Creating window...');
  console.log('isDev:', isDev);
  console.log('APP_ROOT:', APP_ROOT);
  console.log('preload path:', preload);
  console.log('indexHtml path:', indexHtml);
  console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL);

  // Check if preload file exists and log details
  try {
    const fsPromises = await import('node:fs/promises');
    const stats = await fsPromises.stat(preload);
    console.log('[PRELOAD] File exists:', preload);
    console.log('[PRELOAD] File size:', stats.size, 'bytes');
    console.log('[PRELOAD] File mode:', stats.mode.toString(8));
    
    // Try to read first few bytes to check format
    const fileContent = await fsPromises.readFile(preload, { encoding: 'utf8', flag: 'r' });
    const firstLine = fileContent.split('\n')[0];
    console.log('[PRELOAD] First line:', firstLine.substring(0, 100));
    
    if (firstLine.includes('import') || firstLine.includes('export')) {
      console.log('[PRELOAD] Format: ES Module (ESM) ✓');
    } else if (firstLine.includes('require') || firstLine.includes('"use strict"')) {
      console.warn('[PRELOAD] Format: CommonJS (unexpected in ESM project)');
    }
  } catch (error) {
    console.error('[PRELOAD] ERROR: File check failed:', error);
    console.error('[PRELOAD] Attempted path:', preload);
    console.error('[PRELOAD] __dirname:', __dirname);
    
    // List directory contents
    try {
      const fsPromises = await import('node:fs/promises');
      const files = await fsPromises.readdir(__dirname);
      console.error('[PRELOAD] Files in dist-electron:', files);
    } catch (dirError) {
      console.error('[PRELOAD] Could not list directory:', dirError);
    }
  }

  console.log('[WINDOW] Creating BrowserWindow with preload:', preload);
  
  win = new BrowserWindow({
    title: 'Chunkpad',
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: true, // Show immediately
    icon: path.join(process.env.VITE_PUBLIC || APP_ROOT, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Store event listener cleanup functions
  const cleanupFunctions: Array<() => void> = [];

  // Log preload script loading events and handle errors
  const didFailLoadHandler = (event: Electron.Event, errorCode: number, errorDescription: string, validatedURL?: string, isMainFrame?: boolean) => {
    console.error('[WINDOW] Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
    });
    // Show error page if window exists
    if (win) {
      const errorHtml = `
        <div style="padding: 20px; font-family: system-ui;">
          <h1>Failed to load application</h1>
          <p>Error: ${errorCode} - ${errorDescription}</p>
          <p>Preload: ${preload}</p>
          <p>HTML: ${indexHtml}</p>
          <p>Dev Server: ${VITE_DEV_SERVER_URL || 'none'}</p>
        </div>
      `;
      win.webContents.executeJavaScript(`document.body.innerHTML = ${JSON.stringify(errorHtml)};`).catch(() => {
        // Ignore errors if page is not ready
      });
    }
  };
  win.webContents.on('did-fail-load', didFailLoadHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('did-fail-load', didFailLoadHandler));

  const preloadErrorHandler = (event: Electron.Event, preloadPath: string, error: Error) => {
    console.error('[PRELOAD] ✗ Preload script error event fired!');
    console.error('[PRELOAD] Path:', preloadPath);
    console.error('[PRELOAD] Error message:', error?.message || error);
    console.error('[PRELOAD] Error name:', error?.name);
    console.error('[PRELOAD] Error stack:', error?.stack);
    console.error('[PRELOAD] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  };
  win.webContents.on('preload-error', preloadErrorHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('preload-error', preloadErrorHandler));

  // Additional error handlers for better debugging
  const consoleMessageHandler = (event: Electron.Event, level: number, message: string, line: number, sourceId: string) => {
    if (level >= 2) { // Error (2) or warning (1)
      const levelName = level === 2 ? 'WARN' : level === 3 ? 'ERROR' : 'LOG';
      console.log(`[RENDERER ${levelName}]`, message, sourceId ? `(${sourceId}:${line})` : '');
    }
  };
  win.webContents.on('console-message', consoleMessageHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('console-message', consoleMessageHandler));

  const renderProcessGoneHandler = (event: Electron.Event, details: Electron.RenderProcessGoneDetails) => {
    console.error('[RENDERER] ✗ Process gone:', JSON.stringify(details, null, 2));
  };
  win.webContents.on('render-process-gone', renderProcessGoneHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('render-process-gone', renderProcessGoneHandler));

  const unresponsiveHandler = () => {
    console.error('[RENDERER] ✗ Process unresponsive');
  };
  win.webContents.on('unresponsive', unresponsiveHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('unresponsive', unresponsiveHandler));

  const responsiveHandler = () => {
    console.log('[RENDERER] ✓ Process responsive again');
  };
  win.webContents.on('responsive', responsiveHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('responsive', responsiveHandler));

  // Ensure window is visible and focused
  win.once('ready-to-show', () => {
    console.log('Window ready to show');
    if (win) {
      win.show();
      win.focus();
    }
  });

  // Fallback: show window after a short delay if ready-to-show doesn't fire
  setTimeout(() => {
    if (win && !win.isVisible()) {
      console.log('Window not visible after timeout, forcing show');
      win.show();
      win.focus();
    }
  }, 1000);


  // Test active push message to Renderer-process
  const didFinishLoadHandler = () => {
    console.log('Window finished loading');
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  };
  win.webContents.on('did-finish-load', didFinishLoadHandler);
  cleanupFunctions.push(() => win.webContents.removeListener('did-finish-load', didFinishLoadHandler));

  if (VITE_DEV_SERVER_URL) {
    // Development: Load from Vite dev server
    console.log('Loading from dev server:', VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL).catch((error) => {
      console.error('Failed to load URL:', error);
    });
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    // Production: Load from file
    console.log('Loading from file:', indexHtml);
    win.loadFile(indexHtml).catch((error) => {
      console.error('Failed to load file:', error);
    });
  }

  // Ensure window is visible after page loads
  const didFinishLoadOnceHandler = () => {
    console.log('Page finished loading, ensuring window is visible');
    if (win && !win.isVisible()) {
      win.show();
      win.focus();
    }
  };
  win.webContents.once('did-finish-load', didFinishLoadOnceHandler);
  // Note: once() handlers don't need cleanup, but we track it for consistency

  // Clean up event listeners when window is closed
  win.on('closed', () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions.length = 0;
    win = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Load Project',
          accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
          click: () => {
            win?.webContents.send('menu:load-project');
          },
        },
        {
          label: 'Open Document',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+O' : 'Ctrl+Shift+O',
          click: () => {
            win?.webContents.send('menu:open-file');
          },
        },
        {
          label: 'Open Recent',
          submenu: [], // TODO: Implement recent files
        },
        { type: 'separator' },
        {
          label: 'Save Project',
          accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
          click: () => {
            win?.webContents.send('menu:save-project');
          },
        },
        {
          label: 'Save Project As...',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+S' : 'Ctrl+Shift+S',
          click: () => {
            win?.webContents.send('menu:save-project-as');
          },
        },
        { type: 'separator' },
        {
          label: 'Export Selected',
          accelerator: process.platform === 'darwin' ? 'Cmd+E' : 'Ctrl+E',
          click: () => {
            win?.webContents.send('menu:export');
          },
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'Quit' : 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            win?.webContents.send('menu:toggle-sidebar');
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            win?.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+?',
          click: () => {
            win?.webContents.send('menu:show-shortcuts');
          },
        },
        { type: 'separator' },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/yourusername/chunkpad'); // TODO: Update with actual docs URL
          },
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(win!, {
              type: 'info',
              title: 'About Chunkpad',
              message: 'Chunkpad',
              detail: 'A desktop application for chunking documents for RAG pipelines.\nVersion 0.1.0\n\n© 2024 Vlad Gidea',
            });
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { 
          label: 'About ' + app.getName(), 
          click: () => {
            dialog.showMessageBox(win!, {
              type: 'info',
              title: 'About Chunkpad',
              message: 'Chunkpad',
              detail: 'A desktop application for chunking documents for RAG pipelines.\nVersion 0.1.0\n\n© 2024 Vlad Gidea',
            });
          },
        },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    });

    // Window menu
    template.push({
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers

// File open dialog
ipcMain.handle('file:open-dialog', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['docx', 'pptx', 'pdf'] },
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'PowerPoint Presentations', extensions: ['pptx'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const data = await fs.readFile(filePath);
    return {
      filePath,
      data: data.buffer,
    };
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// File save dialog
ipcMain.handle('file:save-dialog', async (_, options) => {
  const result = await dialog.showSaveDialog(win!, {
    defaultPath: options.defaultPath,
    filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return result.filePath;
});

// Directory picker dialog
ipcMain.handle('file:open-directory', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Save file content
ipcMain.handle('file:save-content', async (_, filePath: string, content: string | ArrayBuffer) => {
  try {
    if (typeof content === 'string') {
      await fs.writeFile(filePath, content, 'utf-8');
    } else {
      await fs.writeFile(filePath, Buffer.from(content));
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: String(error) };
  }
});

// Project save
ipcMain.handle('project:save', async (_, data) => {
  const result = await dialog.showSaveDialog(win!, {
    defaultPath: 'project.chunkpad',
    filters: [{ name: 'Chunkpad Project', extensions: ['chunkpad'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  try {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await fs.writeFile(result.filePath, content, 'utf-8');
    return result.filePath;
  } catch (error) {
    console.error('Error saving project:', error);
    return null;
  }
});

// Project load
ipcMain.handle('project:load', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [{ name: 'Chunkpad Project', extensions: ['chunkpad'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return {
      filePath,
      data: JSON.parse(data),
    };
  } catch (error) {
    console.error('Error loading project:', error);
    return null;
  }
});

// Window operations
ipcMain.on('window:minimize', () => {
  win?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window:close', () => {
  win?.close();
});

// Handle file opening from command line or "Open With"
const handleFileOpen = async (filePath: string) => {
  if (!win) {
    // Window not ready yet, wait for it
    await app.whenReady();
    if (!win) return;
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check if it's a project file
    if (ext === '.chunkpad') {
      // Load project
      const data = await fs.readFile(filePath, 'utf-8');
      win.webContents.send('file:open-project', {
        filePath,
        data: JSON.parse(data),
      });
    } else if (['.docx', '.pptx', '.pdf'].includes(ext)) {
      // Open document
      const data = await fs.readFile(filePath);
      win.webContents.send('file:open-document', {
        filePath,
        data: data.buffer,
      });
    }
  } catch (error) {
    console.error('Error opening file:', error);
    if (win) {
      dialog.showErrorBox('Error Opening File', `Could not open ${filePath}: ${String(error)}`);
    }
  }
};

// Handle command line arguments (Windows/Linux) - check lock first
// Only enforce single instance in production, allow multiple in dev for testing
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock && !isDev) {
  app.quit();
  process.exit(0);
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();
  
  // macOS dock menu
  if (process.platform === 'darwin') {
    app.dock?.setMenu(Menu.buildFromTemplate([
      {
        label: 'New Window',
        click: () => {
          createWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Open Document',
        click: () => {
          win?.webContents.send('menu:open-file');
        },
      },
      {
        label: 'Load Project',
        click: () => {
          win?.webContents.send('menu:load-project');
        },
      },
    ]));
  }
  
  // Handle file arguments on first launch (Windows/Linux)
  if (process.platform !== 'darwin') {
    const fileArgs = process.argv.slice(1).filter(arg => {
      const ext = path.extname(arg).toLowerCase();
      return ['.docx', '.pptx', '.pdf', '.chunkpad'].includes(ext);
    });

    fileArgs.forEach(filePath => {
      handleFileOpen(filePath);
    });
  } else {
    // macOS: Handle file arguments from first launch
    const fileArgs = process.argv.slice(1).filter(arg => {
      const ext = path.extname(arg).toLowerCase();
      return ['.docx', '.pptx', '.pdf', '.chunkpad'].includes(ext);
    });

    fileArgs.forEach(filePath => {
      handleFileOpen(filePath);
    });
  }
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle second instance (Windows/Linux)
app.on('second-instance', (event, commandLine) => {
  // Someone tried to run a second instance, focus our window instead
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }

  // Handle file arguments from second instance
  const fileArgs = commandLine.slice(1).filter(arg => {
    const ext = path.extname(arg).toLowerCase();
    return ['.docx', '.pptx', '.pdf', '.chunkpad'].includes(ext);
  });

  fileArgs.forEach(filePath => {
    handleFileOpen(filePath);
  });
});

// Handle file opening on macOS (when app is already running)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  handleFileOpen(filePath);
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
app.on('browser-window-created', (_, window) => {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      // Open external links in default browser
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

