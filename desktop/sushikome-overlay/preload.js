const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sushiKome', {
  setRoom: room => ipcRenderer.send('set-room', room),
  getRoom: () => ipcRenderer.invoke('get-room'),
  command: command => ipcRenderer.send('overlay-command', command),
  setSettings: value => ipcRenderer.send('overlay-settings', value),
  onRoomChanged: callback => ipcRenderer.on('room-changed', (_event, value) => callback(value)),
  onClear: callback => ipcRenderer.on('clear-comments', () => callback()),
  onSettings: callback => ipcRenderer.on('overlay-settings', (_event, value) => callback(value))
});
