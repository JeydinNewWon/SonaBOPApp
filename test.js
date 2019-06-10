var fs = require('fs');
const path = require('path');
const pathname = path.join(__dirname, 'html');
fs.readdir(pathname, (err, files) => {
    if (err) {
        console.log(err);
    }
    console.log(files);
});