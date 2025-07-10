// main.js
const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow, tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 280, height: 400,
    icon: path.join(__dirname, 'tray-icon.png'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('minimize', e => { e.preventDefault(); mainWindow.hide(); });
  mainWindow.on('close',    e => {
    if (!app.isQuiting) { e.preventDefault(); mainWindow.hide(); }
  });
}

app.whenReady().then(() => {
  createWindow();
  tray = new Tray(path.join(__dirname, 'tray-icon.png'));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Timer', click: () => mainWindow.show() },
    { label: 'Quit',       click: () => { app.isQuiting = true; app.quit(); } }
  ]));
  app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: ['--hidden'] });
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
