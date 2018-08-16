import {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} from 'electron';
import url from 'url';
import path from 'path';
import AutoLaunch from 'auto-launch';
import {EVENT} from '../constants';
import ClipboardWatcher from './clipboard-watcher';

const autoLaunch = new AutoLaunch({name: 'Clippy'});

let mainWindow = null;
let rendererChannel = null;
let tray = null;
let accStat = null;
let startupStat = null;

const trayTemplate = [
  {
    label: 'Clippy'
  }, {
    type: 'separator'
  }, {
    label: 'Show',
    click: () => showWindow()
  }, {
    label: 'Clear',
    click: () => {
      if (rendererChannel) {
        rendererChannel.send(EVENT.ITEM_CLEAR);
      }
    }
  }, {
    label: 'Quit',
    click: () => {
      if (mainWindow) {
        mainWindow.close();
      }
    }
  }
];

function registerGlobalShortcut() {
  return globalShortcut.register('CommandOrControl+Shift+V', showWindow);
}

function onWindowClosed() {
  mainWindow = null;
}

function showWindow(event) {
  mainWindow.show();

  if (event) {
    event.returnValue = false;
  }
}

function hideWindow(event) {
  // Hide the window
  mainWindow.hide();

  if (event) {
    event.returnValue = false;
  }
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    show: false,
    center: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    movable: false,
    frame: false,
    transparent: true,
    title: 'Clippy',
    alwaysOnTop: true
  });

  // Basic events for window
  win.on('closed', onWindowClosed);
  win.on('minimize', hideWindow);
  win.on('blur', hideWindow);

  const urlToLoad = url.format({
    pathname: path.resolve(__dirname, '../renderer/index.html'),
    protocol: 'file:',
    slashes: true
  });
  win.loadURL(urlToLoad);

  tray = new Tray(path.resolve(__dirname, '../renderer/img/clippy-32.png'));

  const trayContextMenu = Menu.buildFromTemplate(trayTemplate);
  tray.setContextMenu(trayContextMenu);

  tray.setToolTip('Clippy');
  tray.setTitle('Clippy');

  tray.on('double-click', showWindow);

  return win;
}

const watcher = new ClipboardWatcher();
watcher.on('item', data => {
  rendererChannel.send(EVENT.ITEM_NEW, data);
});

async function onAppInit() {
  watcher.startListening();

  startupStat = await autoLaunch.isEnabled();

  rendererChannel.send(EVENT.APP_STATS, {accelerator: accStat, startup: startupStat});
}

async function handleSettings(event, args) {
  if (args.startup !== startupStat) {
    if (args.startup === true) {
      autoLaunch.enable();
    } else {
      autoLaunch.disable();
    }

    startupStat = await autoLaunch.isEnabled();
    rendererChannel.send(EVENT.APP_STATS, {startup: startupStat});
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
    rendererChannel = mainWindow.webContents;
  }
});

app.on('ready', () => {
  mainWindow = createMainWindow();
  accStat = registerGlobalShortcut();
  rendererChannel = mainWindow.webContents;
});

ipcMain.once(EVENT.APP_INIT, onAppInit);

ipcMain.on('hide', hideWindow);
ipcMain.on(EVENT.SETTINGS_CHANGE, handleSettings);
