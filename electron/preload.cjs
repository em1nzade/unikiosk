const { contextBridge } = require('electron');

// Expose minimal API to renderer
contextBridge.exposeInMainWorld('kioskAPI', {
  isKiosk: true,
  platform: process.platform,
});
