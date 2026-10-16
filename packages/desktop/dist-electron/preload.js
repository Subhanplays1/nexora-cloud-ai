import { contextBridge } from 'electron';
contextBridge.exposeInMainWorld('nexoraDesktop', {
    platform: process.platform,
    version: '1.0.0',
    notify: (title, body) => {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    },
});
