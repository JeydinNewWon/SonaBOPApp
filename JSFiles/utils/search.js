const request = require('request');
const encodeurl = require('encodeurl');

// import the API credentials.
const config = require('../config/config.json');
const youtubeAPIKey = config.youtubeAPIKey;


// searchForVideo function.
function searchForVideo(searchquery, cb) {

    // get the query and encode it into a url format.
    var encodedquery = encodeurl(searchquery);
    
    // request from the YouTube Data API and get the 10 search results.
    request.get(`https://www.googleapis.com/youtube/v3/search/?part=snippet&q=${encodedquery}&maxResults=10&key=${youtubeAPIKey}`, (err, rsp, body) => {
        // run the callback with the response body as parameter.
        cb(JSON.parse(rsp.body));
    });
}

// searchForDuration function. Searches for video durations from the YouTubeDataAPI.
function searchForDurations(videoIDCSV, cb) {
    // request from the YouTube Data API and get the durations.
    request.get(`https://www.googleapis.com/youtube/v3/videos/?part=contentDetails&id=${videoIDCSV}&key=${youtubeAPIKey}`, (err, rsp, body ) => {
        // run the callback with the response body as parameter.
        cb(JSON.parse(rsp.body));
    });
}


module.exports = {
    "searchForVideo": searchForVideo,
    "searchForDurations": searchForDurations
}