const { contextBridge, ipcRenderer } = require('electron');

// Expose minimal API to renderer
contextBridge.exposeInMainWorld('kioskAPI', {
  isKiosk: true,
  platform: process.platform,
  verifyPin: (pin) => ipcRenderer.invoke('verify-pin', pin),
  exitApp: () => ipcRenderer.invoke('exit-app'),
});
