const ps = require('python-shell');

function downloader(videoURL, cb) {
    var opts = {
        mode: 'text',
        args: [videoURL]
    }

    ps.PythonShell.run('../../downloader/downloader.py', opts, () => {
        
    });
}


module.exports = downloader;