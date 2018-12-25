import {ipcRenderer} from 'electron';
import {bind} from 'hyperhtml/esm';
import {subscribe, dispatch} from 'global-dispatcher';
import {EVENT} from '../constants';
import './components/clippy-app';
import './renderer.css';

bind(document.body)`<clippy-app />`;

// some back and forth event handlers
// between main and render processes
ipcRenderer.on(EVENT.ITEM_NEW, (event, item) => dispatch(EVENT.ITEM_NEW, item));

subscribe(EVENT.ITEMS_SAVE, data => ipcRenderer.send(EVENT.ITEMS_SAVE, data));
ipcRenderer.on(EVENT.ITEMS_CLEAR, () => dispatch(EVENT.ITEMS_CLEAR));
ipcRenderer.on(EVENT.ITEMS_RESTORE, (event, items) => dispatch(EVENT.ITEMS_RESTORE, items));

ipcRenderer.on(EVENT.SETTINGS_UPDATE, (event, settings) => dispatch(EVENT.SETTINGS_UPDATE, settings));
subscribe(EVENT.SETTINGS_CHANGE, settings => ipcRenderer.send(EVENT.SETTINGS_CHANGE, settings));

subscribe(EVENT.APP_HIDE, () => ipcRenderer.send(EVENT.APP_HIDE));

window.addEventListener('load', () => ipcRenderer.send(EVENT.APP_INIT));
