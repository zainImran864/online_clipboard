const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard, Notification, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let quickPopupWindow = null;
let tray = null;
let clipboardMonitorInterval = null;
let lastClipboardText = '';
let isMonitoringClipboard = true;

const PASTEPORT_URL = process.env.PASTEPORT_URL || 'https://pasteport.zain-imran.com';
const API_SEND_URL = `${PASTEPORT_URL.replace(/\/$/, '')}/api/cli/send`;

// Native notification helper
function notify(title, body) {
    if (Notification.isSupported()) {
        new Notification({
            title: title || 'Pasteport',
            body: body || '',
            silent: false,
        }).show();
    }
}

// Upload clipboard text to Pasteport via HTTP
async function uploadClipboardText(text) {
    try {
        const response = await fetch(API_SEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                expiryHours: 24,
            }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            clipboard.writeText(data.url);
            notify(
                '🚀 Clipboard Shared via Pasteport!',
                `Share Code: ${data.code}\nLink copied to your clipboard: ${data.url}`
            );
            return data;
        } else {
            notify('⚠️ Share Failed', data.error || 'Could not upload to Pasteport');
            return null;
        }
    } catch (err) {
        notify('⚠️ Connection Error', err.message);
        return null;
    }
}

// Create Main Application Window
function createMainWindow() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        return;
    }

    const windowIcon = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Pasteport — Cross-device sharing + Developer Toolkit',
        icon: windowIcon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadURL(PASTEPORT_URL);

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create Quick Action HUD Popup Window
function createQuickPopupWindow() {
    const windowIcon = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

    quickPopupWindow = new BrowserWindow({
        width: 440,
        height: 280,
        show: false,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        icon: windowIcon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const popupHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pasteport Quick Share</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #0f172a; color: #f8fafc; padding: 18px; border-radius: 16px; border: 1px solid #334155; user-select: none; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .title { font-size: 13px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; }
        .close-btn { background: transparent; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 4px; }
        .close-btn:hover { color: #f43f5e; }
        .preview-box { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; font-family: monospace; font-size: 11px; height: 110px; overflow-y: auto; color: #cbd5e1; word-break: break-all; }
        .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
        .hotkey-hint { font-size: 11px; color: #64748b; }
        .hotkey-badge { background: #334155; color: #94a3b8; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-family: monospace; }
        .btn { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; border: none; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.15s; }
        .btn:hover { filter: brightness(1.1); }
        .btn:active { transform: scale(0.97); }
    </style>
</head>
<body>
    <div class="header">
        <span class="title">⚡ Quick Share Clipboard</span>
        <button class="close-btn" onclick="window.pasteportDesktop.closeQuickPopup()">✕</button>
    </div>
    <div class="preview-box" id="preview">Reading clipboard...</div>
    <div class="footer">
        <span class="hotkey-hint"><span class="hotkey-badge">Ctrl+Shift+P</span> to trigger</span>
        <button class="btn" id="sendBtn" onclick="handleSend()">Send to Pasteport 🚀</button>
    </div>
    <script>
        let currentText = '';
        window.addEventListener('DOMContentLoaded', () => {
            currentText = navigator.clipboard ? '' : '';
        });
        window.pasteportDesktop.onHotkeyPressed((text) => {
            currentText = text;
            document.getElementById('preview').innerText = text || '(Clipboard is empty)';
        });
        async function handleSend() {
            if (!currentText) return;
            const btn = document.getElementById('sendBtn');
            btn.innerText = 'Sharing...';
            btn.disabled = true;
            await window.pasteportDesktop.sendClipboard(currentText);
            window.pasteportDesktop.closeQuickPopup();
        }
    </script>
</body>
</html>
    `;

    quickPopupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(popupHtml)}`);

    quickPopupWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            quickPopupWindow.hide();
        }
    });

    quickPopupWindow.on('closed', () => {
        quickPopupWindow = null;
    });

    quickPopupWindow.on('blur', () => {
        if (quickPopupWindow && !quickPopupWindow.isDestroyed()) {
            quickPopupWindow.hide();
        }
    });
}

// Show Quick Action Popup Centered on Screen
function showQuickPopup() {
    const text = clipboard.readText();

    if (!quickPopupWindow || quickPopupWindow.isDestroyed()) {
        createQuickPopupWindow();
    }

    try {
        const mousePos = screen.getCursorScreenPoint();
        const currentDisplay = screen.getDisplayNearestPoint(mousePos);
        const { width, height } = quickPopupWindow.getBounds();

        const x = Math.round(currentDisplay.bounds.x + (currentDisplay.bounds.width - width) / 2);
        const y = Math.round(currentDisplay.bounds.y + (currentDisplay.bounds.height - height) / 2);

        quickPopupWindow.setPosition(x, y);
        quickPopupWindow.show();
        quickPopupWindow.focus();
        quickPopupWindow.webContents.send('hotkey-pressed', text);
    } catch (err) {
        console.error('Error displaying quick popup:', err);
    }
}

// Create System Tray Icon and Menu
function createTray() {
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    const iconPath = path.join(__dirname, 'assets', iconName);
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Pasteport — Open App',
            click: () => {
                if (!mainWindow) createMainWindow();
                mainWindow.show();
                mainWindow.focus();
            },
        },
        {
            label: 'Quick Share Clipboard (Ctrl+Shift+P)',
            click: async () => {
                const text = clipboard.readText();
                if (text && text.trim().length > 0) {
                    await uploadClipboardText(text);
                } else {
                    notify('Pasteport', 'Clipboard is currently empty');
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Clipboard Monitoring',
            type: 'checkbox',
            checked: isMonitoringClipboard,
            click: (item) => {
                isMonitoringClipboard = item.checked;
                if (isMonitoringClipboard) {
                    startClipboardMonitor();
                    notify('Pasteport', 'Clipboard monitor enabled');
                } else {
                    stopClipboardMonitor();
                    notify('Pasteport', 'Clipboard monitor disabled');
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Quit Pasteport',
            click: () => {
                app.isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip('Pasteport — Cross-Device Sharing + Developer Toolkit');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (!mainWindow) createMainWindow();
        mainWindow.show();
        mainWindow.focus();
    });
}

// Clipboard Background Monitor
function startClipboardMonitor() {
    if (clipboardMonitorInterval) return;
    lastClipboardText = clipboard.readText();

    clipboardMonitorInterval = setInterval(() => {
        if (!isMonitoringClipboard) return;
        const current = clipboard.readText();
        if (current && current !== lastClipboardText) {
            lastClipboardText = current;
            // Optionally notify user that clipboard changed and can be shared
        }
    }, 1500);
}

function stopClipboardMonitor() {
    if (clipboardMonitorInterval) {
        clearInterval(clipboardMonitorInterval);
        clipboardMonitorInterval = null;
    }
}

// IPC Handlers
ipcMain.handle('send-clipboard', async (_, text) => {
    return await uploadClipboardText(text);
});

ipcMain.on('show-notification', (_, { title, body }) => {
    notify(title, body);
});

ipcMain.on('copy-to-clipboard', (_, text) => {
    clipboard.writeText(text);
});

ipcMain.on('close-quick-popup', () => {
    if (quickPopupWindow && !quickPopupWindow.isDestroyed()) {
        quickPopupWindow.hide();
    }
});

process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception in main process:', err);
});

// App Lifecycle
app.whenReady().then(() => {
    createMainWindow();
    createQuickPopupWindow();

    try {
        createTray();
    } catch {
        // Tray icon creation fallback if icon asset not found in dev
    }

    // Register Global Hotkey: CommandOrControl+Shift+P
    const hotkeyRegistered = globalShortcut.register('CommandOrControl+Shift+P', () => {
        showQuickPopup();
    });

    if (hotkeyRegistered) {
        console.log('Registered global hotkey: CommandOrControl+Shift+P (Ctrl+Shift+P / Cmd+Shift+P)');
    } else {
        console.warn('Failed to register global hotkey CommandOrControl+Shift+P');
    }

    startClipboardMonitor();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    stopClipboardMonitor();
});

app.on('window-all-closed', () => {
    // Keep app running in background tray on macOS and Windows
    if (process.platform === 'darwin') {
        // Keep in dock
    }
});
