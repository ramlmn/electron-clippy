import fs from 'fs';
import url from 'url';
import path from 'path';
import {promisify} from 'util';
import {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray, clipboard, nativeImage} from 'electron';
import AutoLaunch from 'auto-launch';
import {EVENT} from '../constants';
import ClipboardWatcher from './clipboard-watcher';

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const isProduction = process.env.NODE_ENV === 'production';
const autoLaunch = new AutoLaunch({name: 'Clippy'});

let mainWindow = null;
let rendererChannel = null;
let tray = null;

const userDataPath = app.getPath('userData');
const settingsFilePath = path.resolve(userDataPath, 'settings.json');
const historyFilePath = path.resolve(userDataPath, 'history.json');
const indexFilePath = path.resolve(__dirname, '../renderer/index.html');
const trayIconPath = path.resolve(__dirname, '../renderer/img/clippy-32.png');

// Default app settings, will be updated later
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

const trayTemplate = [
  {
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
      // Merge default and saved settings
      const data = await readFile(settingsFilePath, {encoding: 'utf-8'});
      Object.assign(appSettings, JSON.parse(data));
    } catch (error) {
      console.error('[ERR] Error reading settings', settingsFilePath);
      console.error(error);
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

    if (settings.persistentHistory === false) {
      // Stop saving items, delete everything from drive
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

  persistSettings(); // Flush settings immediately

  rendererChannel.send(EVENT.SETTINGS_UPDATE, appSettings);
}

async function onAppInit() {
  const clipboardWatcher = new ClipboardWatcher();
  clipboardWatcher.on('item', item => {
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

  // Send settings to renderer at startup
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
  registerGlobalShortcut();
  mainWindow = createMainWindow();
  rendererChannel = mainWindow.webContents;
});

ipcMain.on(EVENT.APP_INIT, onAppInit);
ipcMain.on(EVENT.APP_HIDE, hideWindow);

ipcMain.on(EVENT.SETTINGS_CHANGE, onSettingsChange);

ipcMain.on(EVENT.ITEMS_SAVE, (event, items) => {
  if (appSettings.persistentHistory) {
    persistItems(items);
  }
});

// Image data cannot be written from the renderer process on Linux platforms
// So data is sent here instead to be copied to clipboard
// Bug: https://github.com/electron/electron/issues/8151
ipcMain.on(EVENT.COPY_TO_CLIPBOARD, (event, data) => {
  if (typeof data === 'string') {
    clipboard.write({
      image: nativeImage.createFromDataURL(data)
    });
  } else {
    clipboard.write(data);
  }
});
