/*
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

function downloader(videoURL, cb) {
    ffmpeg.setFfmpegPath('../../bin/ffmpeg');
    var stream = ytdl(videoURL, { quality: "highestaudio" } );
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`../../MusicData/${videoURL}.mp3`)
        .on('end', () => {
            cb('done');
        });
}

downloader('GO0PtD02qqg', (output) => {
    console.log(output);
});*/