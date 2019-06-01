global.$ = require('jquery');
const config = require('../config/config.json');
const request = require('request');
const encodeurl = require('encodeurl');
const decodeurl = require('unescape');
const youtubeAPIKey = config.youtubeAPIKey;

function main() {
    $("#searchwrap").on('submit', (event) => {
        event.preventDefault();

        var searchquery = $("#searchquery").text();

        searchForVideo(searchquery, (rsp) => {
            

        });
    });

    $(".video").on('click', (event) => {
        var id = $(event.currentTarget).attr('id');
        $('#' + id).addClass('selected');
    });
}

function searchForVideo(searchquery, cb) {

    var encodedquery = encodeurl(searchquery);
    
    request.get(`https://www.googleapis.com/youtube/v3/search/?part=snipper&q=${encodedquery}&maxResults=10&key=${youtubeAPIKey}`, (err, rsp, body) => {
        cb(JSON.parse(rsp.body));
    });
}

$(document).ready(main)