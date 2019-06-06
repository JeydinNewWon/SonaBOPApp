global.$ = require('jquery');
const config = require('./config/config.json');
const request = require('request');
const encodeurl = require('encodeurl');
const decode = require('unescape');
const youtubeAPIKey = config.youtubeAPIKey;
const timeConverter = require('iso8601-duration');

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

function ids(cb) {
    request.get(`https://www.googleapis.com/youtube/v3/videos/?part=contentDetails&id=HYmn5BQIxdQ&key=${youtubeAPIKey}`, (err, rsp, body) => {
        cb(JSON.parse(rsp.body));
    });
}

ids((rsp) => {
    var time = rsp.items[0].contentDetails.duration;
    var formattedTime = timeConverter.parse(time);

    console.log(`${formattedTime.minutes}:${formattedTime.seconds}`);
});