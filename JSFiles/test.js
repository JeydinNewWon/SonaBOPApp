electron = require('electron');

electron.ipcRenderer.send('asynchronous-message', 'async ping');

