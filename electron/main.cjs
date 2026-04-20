const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// Security: disable navigation to external URLs
const ALLOWED_ORIGINS = ['file://', 'http://localhost'];

// PIN code for exiting kiosk mode
const EXIT_PIN = '1453';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Security
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Load the built Vite app
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = ALLOWED_ORIGINS.some(origin => url.startsWith(origin));
    if (!allowed) {
      event.preventDefault();
    }
  });

  // Block new windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Disable keyboard shortcuts that could exit kiosk
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block Alt+F4, Alt+Tab, Ctrl+W, etc.
    if (
      (input.alt && input.key === 'F4') ||
      (input.alt && input.key === 'Tab') ||
      (input.control && input.key === 'w') ||
      (input.control && input.key === 'q') ||
      (input.meta) || // Block Windows key
      input.key === 'F11' ||
      input.key === 'Escape'
    ) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC: verify PIN from renderer
ipcMain.handle('verify-pin', (_event, pin) => {
  return pin === EXIT_PIN;
});

ipcMain.handle('exit-app', () => {
  app.quit();
});

app.on('ready', () => {
  createWindow();

  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Security: disable remote module
app.on('remote-require', (event) => { event.preventDefault(); });
app.on('remote-get-builtin', (event) => { event.preventDefault(); });
app.on('remote-get-global', (event) => { event.preventDefault(); });
app.on('remote-get-current-window', (event) => { event.preventDefault(); });
app.on('remote-get-current-web-contents', (event) => { event.preventDefault(); });
