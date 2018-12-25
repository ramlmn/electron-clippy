import url from 'url';
import path from 'path';
import {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} from 'electron';
import AutoLaunch from 'auto-launch';
import ClipboardWatcher from './clipboard-watcher';
import {EVENT} from '../constants';

const isProduction = process.env.NODE_ENV === 'production';
const autoLaunch = new AutoLaunch({name: 'Clippy'});

let mainWindow = null;
let rendererChannel = null;
let tray = null;
let accStat = null;

const browserWindowOptions = {
  width: 800,
  height: 500,
  show: false,
  center: true,
  resizable: false,
  minimizable: false,
  maximizable: !isProduction,
  closable: !isProduction,
  fullscreenable: false,
  skipTaskbar: true,
  movable: false,
  frame: false,
  transparent: true,
  title: 'Clippy',
  alwaysOnTop: true
};

const appSettings = {
  runOnStartup: false
};

const trayTemplate = [{
    label: 'Toggle Dev Tools',
    click: () => rendererChannel && rendererChannel.toggleDevTools()
  }, {
    type: 'separator'
  }, {
    label: 'Show Clippy',
    click: () => showWindow()
  }, {
    label: 'Clear',
    click: () => rendererChannel && rendererChannel.send(EVENT.ITEM_CLEAR)
  }, {
    label: 'Quit',
    click: () => mainWindow && mainWindow.close()
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
  const win = new BrowserWindow(browserWindowOptions);

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

async function handleSettingsChange(event, settings) {
  if (settings) {
    if (settings.runOnStartup === true) {
      autoLaunch.enable();
    } else {
      autoLaunch.disable();
    }
  }

  appSettings.runOnStartup = await autoLaunch.isEnabled();

  rendererChannel.send(EVENT.SETTINGS_UPDATE, appSettings);
}

async function onAppInit() {
  watcher.startListening();

  // send settings to renderer at startup
  await handleSettingsChange();
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
  try {
    mainWindow = createMainWindow();
    accStat = registerGlobalShortcut();
    rendererChannel = mainWindow.webContents;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

ipcMain.once(EVENT.APP_INIT, onAppInit);

ipcMain.on(EVENT.APP_HIDE, hideWindow);
ipcMain.on(EVENT.SETTINGS_CHANGE, handleSettingsChange);
