'use strict';

const url = require('url');
const path = require('path');
const {app, Menu, BrowserWindow, ipcMain, globalShortcut, Tray} = require('electron');
const {ClipboardWatcher} = require('./clipboard-watcher.js');

let mainWindow = null;
let rendererChannel = null;
let tray = null;

function onClosed() {
  // Dereference the window
  // For multiple windows store them in an array
  mainWindow = null;
}

function showWindow(event) {
  // Show the window
  mainWindow.show();
  event.returnValue = false;
}

function onMinimize() {
  // For Meta+Down
  mainWindow.hide();
}

function onBlur() {
  // They dont care about us
  mainWindow.hide();
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
  });

  win.on('closed', onClosed);
  win.on('minimize', onMinimize);
  win.on('blur', onBlur);

  const urlToLoad = url.format({
    pathname: path.join(__dirname, '..', 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true,
  });
  win.loadURL(urlToLoad);


  tray = new Tray(path.join(__dirname, '../renderer/img/clip-32x32.png'));

  const trayContetxtMenu = Menu.buildFromTemplate([{
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
        win.close();
      },
    }]);
  tray.setContextMenu(trayContetxtMenu);

  tray.setToolTip('Clippy');
  tray.setTitle('Clippy');

  tray.on('double-click', showWindow);


  const watcher = new ClipboardWatcher();
  watcher.onData = (data) => {
    rendererChannel.send('clipboard-item', data);
  };

  ipcMain.once('init', (event) => {
    rendererChannel = event.sender;
    watcher.startListening();
  });

  ipcMain.on('hide', _ => {
    win.hide();
  });

  return win;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
  }
});

app.on('ready', () => {
  mainWindow = createMainWindow();
  addEventListeners();
});

function addEventListeners() {
  globalShortcut.register('CommandOrControl+Shift+V', _ => {
    mainWindow.show();
  });
}
