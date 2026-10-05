const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sushiKome', {
  setRoom: room => ipcRenderer.send('set-room', room),
  setMode: mode => ipcRenderer.send('set-mode', mode),
  getMode: () => ipcRenderer.invoke('get-mode'),
  getRoom: () => ipcRenderer.invoke('get-room'),
  command: command => ipcRenderer.send('overlay-command', command),
  setSettings: value => ipcRenderer.send('overlay-settings', value),
  onRoomChanged: callback => ipcRenderer.on('room-changed', (_event, value) => callback(value)),
  onModeChanged: callback => ipcRenderer.on('mode-changed', (_event, value) => callback(value)),
  onClearBoard: callback => ipcRenderer.on('clear-board-overlay', () => callback()),
  onClear: callback => ipcRenderer.on('clear-comments', () => callback()),
  onSettings: callback => ipcRenderer.on('overlay-settings', (_event, value) => callback(value))
});
