const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

let settingsWindow = null;
let overlayWindow = null;
let currentRoom = '';

function createOverlay() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;
  overlayWindow = new BrowserWindow({
    x, y, width, height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
  overlayWindow.on('closed', () => { overlayWindow = null; });
}

function createSettings() {
  settingsWindow = new BrowserWindow({
    width: 430,
    height: 560,
    minWidth: 390,
    minHeight: 520,
    title: 'すし米 Overlay',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

app.whenReady().then(() => {
  createOverlay();
  createSettings();

  globalShortcut.register('CommandOrControl+Shift+K', () => {
    if (!overlayWindow) createOverlay();
    else overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.showInactive();
  });
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (!settingsWindow) createSettings();
    else { settingsWindow.show(); settingsWindow.focus(); }
  });

  app.on('activate', () => {
    if (!settingsWindow) createSettings();
    if (!overlayWindow) createOverlay();
  });
});

ipcMain.on('set-room', (_event, room) => {
  currentRoom = String(room || '').replace(/\D/g, '').slice(0, 4);
  if (overlayWindow) overlayWindow.webContents.send('room-changed', currentRoom);
});

ipcMain.on('overlay-command', (_event, command) => {
  if (!overlayWindow) return;
  if (command === 'show') overlayWindow.showInactive();
  if (command === 'hide') overlayWindow.hide();
  if (command === 'clear') overlayWindow.webContents.send('clear-comments');
});

ipcMain.on('overlay-settings', (_event, value) => {
  if (overlayWindow) overlayWindow.webContents.send('overlay-settings', value || {});
});

ipcMain.handle('get-room', () => currentRoom);

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
