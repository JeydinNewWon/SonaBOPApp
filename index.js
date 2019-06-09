const electron = require('electron');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

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

if (!fs.existsSync('./MusicData/')) {
    fs.mkdirSync('./MusicData/');
}

electron.ipcMain.on('download-video', (event, arg) => {
    ffmpeg.setFfmpegPath('./bin/ffmpeg');
    var stream = ytdl(arg, {
        quality: "highestaudio"
    });
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`./MusicData/${arg}.mp3`)
        .on('end', () => {
            event.sender.send('confirm-download', 'done');
        });
});

electron.ipcMain.on('remove-mp3', (event, arg) => {
    fs.unlink(`./MusicData/${arg}.mp3`, (err) => {
        if (err) {
            event.sender.send('confirm-remove', err);
        } else {
            event.sender.send('confirm-remove', 'done');
        }
    });
})

/*
function downloader(videoURL, cb) {
    ffmpeg.setFfmpegPath('./bin/ffmpeg');
    var stream = ytdl(videoURL, { quality: "highestaudio" } );
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`./MusicData/${videoURL}.mp3`)
        .on('end', () => {
            cb('done');
        });
}

downloader('GO0PtD02qqg', (output) => {
    console.log(output);
});
*/
electron.app.on('ready', createWindow);