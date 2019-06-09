const ps = require('python-shell');

function downloader(videoURL, cb) {
    var opts = {
        mode: 'text',
        args: [videoURL]
    }

    ps.PythonShell.run('downloader/downloader.py', opts, (err, output) => {
        cb(output);
    });
}

downloader('https://www.youtube.com/watch?v=HYmn5BQIxdQ', (output) => {
    console.log(output);
});