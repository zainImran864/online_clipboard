const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pasteportDesktop', {
    isDesktop: true,
    platform: process.platform,
    version: '1.0.2',
    sendClipboard: (text) => ipcRenderer.invoke('send-clipboard', text),
    onHotkeyPressed: (callback) => ipcRenderer.on('hotkey-pressed', (_, data) => callback(data)),
    showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
    copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text),
    closeQuickPopup: () => ipcRenderer.send('close-quick-popup'),
});
