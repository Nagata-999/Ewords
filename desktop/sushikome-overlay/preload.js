const { contextBridge, ipcRenderer } = require('electron');
const SB_URL='https://rxyoyveykxdfrpomkltl.supabase.co';
const SB_KEY='sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7';
let banChannel=null;
const banListeners={pointer:[],stroke:[],sticky:[],clearSticky:[],clearInk:[]};
function connectBan(room){if(banChannel){banChannel.unsubscribe();banChannel=null}const code=String(room||'').replace(/\D/g,'').slice(0,4);if(!code)return;let createClient;try{({createClient}=require('@supabase/supabase-js'))}catch(e){console.error('Sushi Ban realtime unavailable',e);return}const sb=createClient(SB_URL,SB_KEY);banChannel=sb.channel('sushiban:'+code,{config:{broadcast:{self:false,ack:false}}});[['pointer','pointer'],['stroke','stroke'],['sticky','sticky'],['clear-sticky','clearSticky'],['clear-ink','clearInk']].forEach(([event,key])=>banChannel.on('broadcast',{event},({payload})=>banListeners[key].forEach(fn=>fn(payload||{}))));banChannel.subscribe()}

contextBridge.exposeInMainWorld('sushiKome', {
  setRoom: room => ipcRenderer.send('set-room', room),
  setMode: mode => ipcRenderer.send('set-mode', mode),
  setTeacherPen: enabled => ipcRenderer.send('set-teacher-pen', !!enabled),
  getTeacherPen: () => ipcRenderer.invoke('get-teacher-pen'),
  onTeacherPenChanged: callback => ipcRenderer.on('teacher-pen-changed', (_event, value) => callback(value)),
  getMode: () => ipcRenderer.invoke('get-mode'),
  getRoom: () => ipcRenderer.invoke('get-room'),
  command: command => ipcRenderer.send('overlay-command', command),
  setSettings: value => ipcRenderer.send('overlay-settings', value),
  onRoomChanged: callback => ipcRenderer.on('room-changed', (_event, value) => callback(value)),
  onModeChanged: callback => ipcRenderer.on('mode-changed', (_event, value) => callback(value)),
  onClearBoard: callback => ipcRenderer.on('clear-board-overlay', () => callback()),
  onClear: callback => ipcRenderer.on('clear-comments', () => callback()),
  onSettings: callback => ipcRenderer.on('overlay-settings', (_event, value) => callback(value)),
  connectBan,
  sendBan: (event,payload)=>{if(banChannel)banChannel.send({type:'broadcast',event,payload})},
  onBan: (event,callback)=>{if(banListeners[event])banListeners[event].push(callback)}
});
