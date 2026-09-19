# Pasteport Desktop 🖥️

Official cross-platform desktop application for **Pasteport — Cross-device sharing + Developer Toolkit**.

Available for **Windows**, **macOS**, and **Linux**.

---

## ✨ Features

- **Global Hotkey (`Ctrl + Shift + P` / `Cmd + Shift + P`)**:
  Press the hotkey from *any* application to instantly summon the quick-share HUD popup.
- **1-Click Clipboard Sharing**:
  Instantly upload your system clipboard to Pasteport and receive a 6-digit code with the direct view URL copied back to your clipboard.
- **Background System Tray Daemon**:
  Minimizes to the system tray (Windows notification area, macOS menu bar, Linux status tray) to stay feather-light (<40MB RAM).
- **Clipboard Monitoring Mode**:
  Optional background watcher detecting new clipboard text for instant sharing.
- **Native OS Notifications**:
  Native toasts via Windows Action Center, macOS Notification Center, and Linux libnotify when a clip is uploaded or received.
- **Complete Developer Toolkit Access**:
  Access all 18 built-in developer utilities (Regex Tester, UUID Generator, JWT Signer, SQL Formatter, Hash Generator, etc.) in a dedicated desktop window.

---

## 🚀 Development & Running Locally

```bash
# Navigate to desktop directory
cd desktop

# Install dependencies
npm install

# Launch in development mode
npm start
```

---

## 📦 Building Standalone Binaries

Build platform-specific installers and portable executables using `electron-builder`:

### Windows
```bash
npm run build:win
# Generates:
# - dist/Pasteport-Setup-1.0.0.exe (NSIS Installer)
# - dist/Pasteport-1.0.0-portable.exe (Portable single-file executable)
```

### macOS
```bash
npm run build:mac
# Generates:
# - dist/Pasteport-1.0.0.dmg (Universal Apple Silicon + Intel)
# - dist/Pasteport-1.0.0-mac.zip
```

### Linux
```bash
npm run build:linux
# Generates:
# - dist/Pasteport-1.0.0.AppImage (Runs on all distributions)
# - dist/pasteport_1.0.0_amd64.deb (Debian / Ubuntu)
```
