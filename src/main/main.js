import fs from 'fs';
import url from 'url';
import path from 'path';
import {promisify} from 'util';
import {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} from 'electron';
import AutoLaunch from 'auto-launch';
import ClipboardWatcher from './clipboard-watcher';
import {EVENT} from '../constants';

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const isProduction = process.env.NODE_ENV === 'production';
const autoLaunch = new AutoLaunch({name: 'Clippy'});

let mainWindow = null;
let rendererChannel = null;
let tray = null;
let accStat = null;

const userDataPath = app.getPath('userData');
const settingsFilePath = path.resolve(userDataPath, 'settings.json');
const historyFilePath = path.resolve(userDataPath, 'history.json');
const indexFilePath = path.resolve(__dirname, '../renderer/index.html');
const trayIconPath = path.resolve(__dirname, '../renderer/img/clippy-32.png');

// default app settings, will be updated later
const appSettings = {
  runOnStartup: false,
  persistentHistory: false
};

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

const trayTemplate = [{
    label: 'Toggle Dev Tools',
    click: () => rendererChannel && rendererChannel.toggleDevTools()
  }, {
    type: 'separator'
  }, {
    label: 'Show Clippy',
    click: showWindow
  }, {
    label: 'Clear',
    click: () => {
      rendererChannel.send(EVENT.ITEMS_CLEAR);
    }
  }, {
    label: 'Quit',
    click: () => {
      mainWindow.close();
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
  const win = new BrowserWindow(browserWindowOptions);

  // Basic events for window
  win.on('closed', onWindowClosed);
  win.on('minimize', hideWindow);
  win.on('blur', hideWindow);

  const urlToLoad = url.format({
    pathname: indexFilePath,
    protocol: 'file:',
    slashes: true
  });
  win.loadURL(urlToLoad);

  tray = new Tray(trayIconPath);

  const trayContextMenu = Menu.buildFromTemplate(trayTemplate);
  tray.setContextMenu(trayContextMenu);

  tray.setToolTip('Clippy');
  tray.setTitle('Clippy');

  tray.on('double-click', showWindow);

  (async () => {
    try {
      // merge default and saved settings
      const data = await readFile(settingsFilePath, {encoding: 'utf-8'});
      Object.assign(appSettings, JSON.parse(data));
    } catch (err) {
      console.error('[ERR] Error reading settings', settingsFilePath);
      console.error(err);
    }
  })();

  return win;
}

async function persistItems(items) {
  try {
    await writeFile(historyFilePath, JSON.stringify(items, null, isProduction ? '' : '  '));
    console.log('[INF] Wrote history to', historyFilePath);
  } catch (error) {
    console.error('[ERR] Error while saving history:', historyFilePath);
    console.error(error);
  }
}

async function persistSettings() {
  try {
    await writeFile(settingsFilePath, JSON.stringify(appSettings, null, '  '));
    console.log('[INF] Wrote settings to', settingsFilePath);
  } catch (error) {
    console.error('[ERR] Error while writing settings file:', settingsFilePath);
    console.error(error);
  }
}

async function onSettingsChange(event, settings) {
  if (settings) {
    if (settings.runOnStartup === true) {
      autoLaunch.enable();
    } else {
      autoLaunch.disable();
    }

    if (settings.persistentHistory === true) {
      // start saving items, flush current to drive
    } else {
      // stop saving items, delete everything from drive
      try {
        const fileStat = await stat(historyFilePath);
        if (fileStat.isFile()) {
          await unlink(historyFilePath);
        }
      } catch (error) {}

    }

    appSettings.persistentHistory = settings.persistentHistory;
  }

  appSettings.runOnStartup = await autoLaunch.isEnabled();

  persistSettings(); // flush settings immediately

  rendererChannel.send(EVENT.SETTINGS_UPDATE, appSettings);
}

async function onAppInit() {
  const clipboardWatcher = new ClipboardWatcher();
  clipboardWatcher.on('item', (item) => {
    rendererChannel.send(EVENT.ITEM_NEW, item);
  });
  clipboardWatcher.startListening();

  if (appSettings.persistentHistory === true) {
    try {
      console.log('[INF] Restoring persistent history');
      const data = await readFile(historyFilePath, {encoding: 'utf-8'});
      rendererChannel.send(EVENT.ITEMS_RESTORE, JSON.parse(data));
    } catch (error) {
      console.error('[ERR] Failed to restore persistent history');
    }
  }

  // send settings to renderer at startup
  await onSettingsChange();
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

ipcMain.on(EVENT.APP_INIT, onAppInit);
ipcMain.on(EVENT.APP_HIDE, hideWindow);

ipcMain.on(EVENT.SETTINGS_CHANGE, onSettingsChange);

ipcMain.on(EVENT.ITEMS_SAVE, (event, items) => {
  if (appSettings.persistentHistory) {
    persistItems(items);
  }
});
