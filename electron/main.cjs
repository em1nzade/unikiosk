const { app, BrowserWindow, globalShortcut, dialog } = require('electron');
const path = require('path');

// Security: disable navigation to external URLs
const ALLOWED_ORIGINS = ['file://', 'http://localhost'];

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

app.on('ready', () => {
  createWindow();

  // Admin exit: Ctrl+Shift+Alt+Q to quit (only admin knows)
  globalShortcut.register('CommandOrControl+Shift+Alt+Q', () => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Xeyr', 'Bəli'],
      title: 'Admin Çıxış',
      message: 'Kiosk proqramından çıxmaq istəyirsiniz?',
      defaultId: 0,
    });
    if (choice === 1) {
      app.quit();
    }
  });

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
