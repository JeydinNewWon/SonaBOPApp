const electron = require('electron');
const fs = require('fs');
const shell = require('shelljs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ncp = require('ncp').ncp;
const jsonfile = require('jsonfile');
const appRootDir = require('app-root-dir').get();
const ffmpegPath = appRootDir + '/node_modules/ffmpeg/ffmpeg';
const userDataPath = electron.app.getPath('userData');
const musicDataPath = `${userDataPath}/MusicData`;

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


if (!fs.existsSync(musicDataPath)) {
    shell.mkdir('-p', `${musicDataPath}/main`);
}


electron.ipcMain.on('download-video', (event, arg) => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    var stream = ytdl(arg, {
        quality: "highestaudio"
    });
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`${musicDataPath}/main/${arg}.mp3`)
        .on('end', () => {
            event.sender.send('confirm-download', userDataPath);
        });
});

electron.ipcMain.on('remove-mp3', (event, arg) => {
    fs.unlink(`${userDataPath}/MusicData/main/${arg}.mp3`, (err) => {
        if (err) {
            event.sender.send('confirm-remove', err);
        } else {
            event.sender.send('confirm-remove', userDataPath);
        }
    });
});

electron.ipcMain.on('load-playlist-folders', (event) => {
    fs.readdir(`${musicDataPath}`, (err, files) => {
        event.sender.send('load-playlist-folders-rsp', files);
    });
});

electron.ipcMain.on('save-playlist-folders', (event, playlistName, playlistContents) => {
    var newPlayListPath = `${musicDataPath}/${playlistName}/`;
    if (!fs.existsSync(newPlayListPath)) {
        shell.mkdir('-p', newPlayListPath);
        ncp(`${musicDataPath}/main/`, newPlayListPath, (err) => {
            if (err) {
                event.sender.send('confirm-save-playlist-folders', err);
            } else {
                jsonfile.writeFile(newPlayListPath + '/info.json', playlistContents, { spaces: 4 }, (err) => {
                    event.sender.send('confirm-save-playlist-folders', 'completed');
                });
            }
        });

    } else {
        event.sender.send('confirm-save-playlist-folders', 'Already Exists');
    }
});



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