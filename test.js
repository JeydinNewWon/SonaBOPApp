global.$ = require('jquery');
const config = require('./config/config.json');
const request = require('request');
const encodeurl = require('encodeurl');
const decode = require('unescape');
const youtubeAPIKey = config.youtubeAPIKey;

function searchForVideo(searchquery, cb) {

    var encodedquery = encodeurl(searchquery);
    getOpts = {
        'header': {
            'Accept': 'application/json'
        },
        'body': JSON.stringify({
            'q': encodedquery,
            'key': youtubeAPIKey,
            'maxResults': 10
        })
    }
    
    request.get(`https://www.googleapis.com/youtube/v3/search/?part=snippet&q=${encodedquery}&key=${youtubeAPIKey}&maxResults=10`, (err, rsp, body) => {
        cb(JSON.parse(rsp.body));
    });
}

searchForVideo('when leblanc gets reverted', (rsp) => {
    console.log(rsp.items[0].snippet.thumbnails);
});