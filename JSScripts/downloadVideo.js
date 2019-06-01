const ps = require('python-shell');


function downloadVideo() {
    var options = {
        mode: 'text',
        args: ''
    }
    
    ps.PythonShell.run('downlaoder.py')

}
