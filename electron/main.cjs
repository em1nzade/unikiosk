const { app, BrowserWindow, globalShortcut, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Device ID ───────────────────────────────────────────
function getDeviceId() {
  const configPath = path.join(app.getPath('userData'), 'device.json');
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (data.deviceId) return data.deviceId;
  } catch {}
  const deviceId = crypto.randomUUID();
  fs.writeFileSync(configPath, JSON.stringify({ deviceId }), 'utf-8');
  return deviceId;
}

// ── Config ──────────────────────────────────────────────
const REMOTE_URL = 'https://unikiosk.vercel.app';
const VERSION_URL = `${REMOTE_URL}/api/version`;
const CHECK_INTERVAL_MS = 60_000; // check every 60 seconds
const ALLOWED_ORIGINS = ['file://', 'http://localhost', REMOTE_URL];
const EXIT_PIN = '1453';

let mainWindow;
let lastBuildId = null;
let versionTimer = null;

// ── Auto-update: poll /api/version ──────────────────────
async function fetchVersion() {
  return new Promise((resolve) => {
    const request = net.request({ url: VERSION_URL, method: 'GET' });
    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(null); }
      });
    });
    request.on('error', () => resolve(null));
    request.end();
  });
}

async function checkForUpdate() {
  const data = await fetchVersion();
  if (!data || !data.buildId) return;
  if (lastBuildId && lastBuildId !== data.buildId) {
    console.log(`[auto-update] New version detected: ${data.buildId} (was ${lastBuildId}). Reloading…`);
    lastBuildId = data.buildId;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reloadIgnoringCache();
    }
  } else if (!lastBuildId) {
    lastBuildId = data.buildId;
    console.log(`[auto-update] Initial version: ${lastBuildId}`);
  }
}

function startVersionPolling() {
  checkForUpdate();
  versionTimer = setInterval(checkForUpdate, CHECK_INTERVAL_MS);
}

function stopVersionPolling() {
  if (versionTimer) { clearInterval(versionTimer); versionTimer = null; }
}

// ── Window ──────────────────────────────────────────────
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
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Try remote URL first; fall back to local dist
  mainWindow.loadURL(REMOTE_URL).catch(() => {
    console.log('[main] Remote URL unreachable, falling back to local dist');
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });

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
    if (
      (input.alt && input.key === 'F4') ||
      (input.alt && input.key === 'Tab') ||
      (input.control && input.key === 'w') ||
      (input.control && input.key === 'q') ||
      (input.meta) ||
      input.key === 'F11' ||
      input.key === 'Escape'
    ) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopVersionPolling();
  });

  // Start polling after the page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    startVersionPolling();
  });
}

// ── IPC ─────────────────────────────────────────────────
ipcMain.handle('verify-pin', (_event, pin) => {
  return pin === EXIT_PIN;
});

ipcMain.handle('exit-app', () => {
  app.quit();
});

ipcMain.handle('get-device-id', () => {
  return getDeviceId();
});

// ── App lifecycle ───────────────────────────────────────
app.on('ready', () => {
  createWindow();

  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  stopVersionPolling();
  globalShortcut.unregisterAll();
});

// Security: disable remote module
app.on('remote-require', (event) => { event.preventDefault(); });
app.on('remote-get-builtin', (event) => { event.preventDefault(); });
app.on('remote-get-global', (event) => { event.preventDefault(); });
app.on('remote-get-current-window', (event) => { event.preventDefault(); });
app.on('remote-get-current-web-contents', (event) => { event.preventDefault(); });
