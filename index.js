const electron = require('electron');
const fs = require('fs');

function createWindow() {
    let win = new electron.BrowserWindow({
        width: 1300,
        height: 800,
        webPreferences: {
          nodeIntegration: true
        }
    });

    win.loadFile('html/index.html');
}

electron.app.on('ready', createWindow);