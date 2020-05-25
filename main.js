'use strict';

// Module to control application life.
const electron = require('electron');
const app = electron.app;

//Declar globally to avoid garbage collection
let mainWindow;

// Monitor for changes to reload ALL content
const path = require('path');

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

// Ready promise; some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  createWindow();

  app.on('activate', function () {
    // macOS can require re-creating the window
    if (BrowserWindow.getAllWindows().length === 0) 
      createWindow();
  })
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') 
    app.quit();
});

/**
 * Create the new Browser Window.
 */
function createWindow () {
  // Module to create native browser window.
  const BrowserWindow = electron.BrowserWindow;

  // Create the browser window with node ON
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {nodeIntegration: true}
  });

    // Open the DevTools when shown
  mainWindow.on('show', function () {
    mainWindow.webContents.openDevTools();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    //Clear references
    mainWindow = null;
  });
  
  // Call show explicitly to trigger the event
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.show();
}