import {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} from 'electron';
import url from 'url';
import path from 'path';
import AutoLaunch from 'auto-launch';
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
    click: showWindow
  }, {
    label: 'Clear',
    click: () => {
      rendererChannel.send('clear-items');
    }
  }, {
    label: 'Quit',
    click: () => {
      mainWindow.close();
    }
  }
];

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
  accStat = addEventListeners();
  rendererChannel = mainWindow.webContents;
});

// Settingup clipboard watcher
const watcher = new ClipboardWatcher();
watcher.on('item', data => {
  rendererChannel.send('new-item', data);
});

ipcMain.once('init', onInit);

ipcMain.on('hide', hideWindow);

ipcMain.on('settings', handleSettings);

function onClosed() {
  // Dereference the window
  mainWindow = null;
}

function showWindow(event) {
  // Show the window
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
  win.on('closed', onClosed);
  win.on('minimize', hideWindow);
  win.on('blur', hideWindow);

  const urlToLoad = url.format({
    pathname: path.resolve(__dirname, '../renderer/index.html'),
    protocol: 'file:',
    slashes: true
  });
  win.loadURL(urlToLoad);

  // Settingup tray icon
  tray = new Tray(path.resolve(__dirname, '../renderer/img/clip-32x32.png'));

  const trayContetxtMenu = Menu.buildFromTemplate(trayTemplate);
  tray.setContextMenu(trayContetxtMenu);

  tray.setToolTip('Clippy');
  tray.setTitle('Clippy');

  tray.on('double-click', showWindow);

  return win;
}

function addEventListeners() {
  return globalShortcut.register('CommandOrControl+Shift+V', showWindow);
}

async function onInit() {
  watcher.startListening();

  startupStat = await autoLaunch.isEnabled();

  rendererChannel.send('app-stats', {accelerator: accStat, startup: startupStat});
}

async function handleSettings(event, args) {
  if (args.startup !== startupStat) {
    if (args.startup === true) {
      autoLaunch.enable();
    } else {
      autoLaunch.disable();
    }

    startupStat = await autoLaunch.isEnabled();
    rendererChannel.send('app-stats', {startup: startupStat});
  }
}
