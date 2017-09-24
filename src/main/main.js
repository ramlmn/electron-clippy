'use strict';

const url = require('url');
const path = require('path');
const autoLaunch = new (require('auto-launch'))({name: 'Clippy'});
const {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} = require('electron');
const {ClipboardWatcher} = require('./clipboard-watcher.js');

let mainWindow = null;
let rendererChannel = null;
let tray = null;
let accStat = null;
let startupStat = null;

const trayTemplate = [{
    label: 'Clippy',
  }, {
    type: 'separator',
  }, {
    label: 'Show',
    click: showWindow,
  }, {
    label: 'Clear',
    click: _ => {
      rendererChannel.send('clear-items');
    },
  }, {
    label: 'Quit',
    click: _ => {
      mainWindow.close();
    },
  }];

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
  rendererChannel.send('clipboard-item', data);
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
    width: 700,
    height: 450,
    show: false,
    center: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    movable: false,
    frame: false,
    transparent: true,
    title: 'Clippy',
    alwaysOnTop: true,
  });

  // Basic events for window
  win.on('closed', onClosed);
  win.on('minimize', hideWindow);
  win.on('blur', hideWindow);

  const urlToLoad = url.format({
    pathname: path.join(__dirname, '../renderer/index.html'),
    protocol: 'file:',
    slashes: true,
  });
  win.loadURL(urlToLoad);


  // Settingup tray icon
  tray = new Tray(path.join(__dirname, '../renderer/img/clip-32x32.png'));

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
  // Start watching clipboard
  watcher.startListening();

  // Check startup status
  startupStat = await autoLaunch.isEnabled();

  // Send stats to renderer
  rendererChannel.send('stats', {accelerator: accStat, startup: startupStat});
}

async function handleSettings(event, args) {
  if (args.startup !== startupStat) {
    // Setting changed
    if (args.startup === true) {
      autoLaunch.enable();
    } else {
      autoLaunch.disable();
    }

    startupStat = await autoLaunch.isEnabled();
    rendererChannel.send('stats', {startup: startupStat});
  }
}
