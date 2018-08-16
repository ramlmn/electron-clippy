import {ipcRenderer as ipc} from 'electron';
import {bind} from 'hyperhtml/esm';
import {subscribe, dispatch} from 'global-dispatcher';
import {EVENT} from '../constants';
import './components/clippy-app';
import './renderer.css';

// @TODO: relaunch if necessary on reloads
ipc.on(EVENT.ITEM_NEW, (event, item) => {
  dispatch(EVENT.ITEM_NEW, item);
});

ipc.on(EVENT.APP_STATS, (event, ...args) => {
  dispatch(EVENT.APP_STATS, ...args);
});

subscribe(EVENT.SETTINGS_CHANGE, settings => {
  ipc.send(EVENT.SETTINGS_CHANGE, settings);
});
subscribe(EVENT.APP_HIDE, () => ipc.send(EVENT.APP_HIDE));

window.addEventListener('load', () => ipc.send(EVENT.APP_INIT));

bind(document.body)`<clippy-app />`;
