import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nexoraDesktop', {
  platform: process.platform,
  version: '1.0.0',
  notify: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
});
