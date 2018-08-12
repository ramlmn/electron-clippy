import {ipcRenderer as ipc} from 'electron';
import {bind} from 'hyperhtml/esm';
import {subscribe, dispatch} from 'global-dispatcher';
import './components/clippy-app';
import './renderer.css';

// @TODO: relaunch if necessary on reloads
ipc.on('new-item', (event, item) => {
  dispatch('new-item', item);
});

ipc.on('app-stats', (event, ...args) => {
  dispatch('app-stats', ...args);
});

subscribe('settings-change', settings => ipc.send('settings-change', settings));
subscribe('hide-window', () => ipc.send('hide'));

window.addEventListener('load', () => ipc.send('init'));

bind(document.body)`<clippy-app />`;
