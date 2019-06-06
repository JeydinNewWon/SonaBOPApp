const request = require('request');
const encodeurl = require('encodeurl');
const config = require('../../config/config.json');
const youtubeAPIKey = config.youtubeAPIKey;

function searchForVideo(searchquery, cb) {

    var encodedquery = encodeurl(searchquery);
    
    request.get(`https://www.googleapis.com/youtube/v3/search/?part=snippet&q=${encodedquery}&maxResults=10&key=${youtubeAPIKey}`, (err, rsp, body) => {
        cb(JSON.parse(rsp.body));
    });
}

function searchForDurations(videoIDCSV, cb) {
    request.get(`https://www.googleapis.com/youtube/v3/videos/?part=contentDetails&id=${videoIDCSV}&key=${youtubeAPIKey}`, (err, rsp, body ) => {
        cb(JSON.parse(rsp.body));
    });
}

module.exports = {
    'searchForVideo': searchForVideo,
    'searchForDurations': searchForDurations
}