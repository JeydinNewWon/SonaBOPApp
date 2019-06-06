global.$ = require('jquery');
const config = require('../config/config.json');
const searchForVideo = require('./utils/search.js').searchForVideo;
const searchForDurations = require('./utils/search.js').searchForDurations;
const encodeurl = require('encodeurl');
const decodeurl = require('unescape');
const youtubeAPIKey = config.youtubeAPIKey;

function main() {
    $('#searchwrap').on('submit', (event) => {
        event.preventDefault();
        // checks if error msg element exists.
        if ($('#errormsg').length) {
            $('#errormsg').remove();
        }

        var searchQuery = $("#searchquery").val();

        if (searchQuery == '') {
            $('#searchwrap > h1').after('<p id="errormsg">Please enter a valid search query.</p>');
            return;
        }

        searchForVideo(searchQuery, (rsp) => {
            if ($('#searchwrap').length) {
                $('#searchwrap').remove();
            }

            $('body').append('<div class="videogrid"></div> <div class="playlistbox"><ul><li>mood</li></ul></div>');

            var videoIDSCSV = '';

            var videoData = {};

            rsp.items.forEach((video) => {
                var thumbnailURL = video.snippet.thumbnails.high.url;
                var title = video.snippet.title;
                var videoID = video.id.videoId;

                var videoDataObject = {
                    'title': title,
                    'thumbnailURL': thumbnailURL,
                }

                videoData[videoID] = videoDataObject;
                videoIDSCSV += `${videoID}%2C`;
            });

            searchForDurations(videoIDSCSV, (rsp) => {
                var counter = 1
                rsp.items.forEach((idResult) => {
                    $('.videogrid').append(`<div class="video" id="video${counter}"><i</div>`)
                });
            });

        });
    });

    $('.video').on('click', (event) => {
        $('.video').removeClass('selected');
        var id = $(event.currentTarget).attr('id');
        $('#' + id).addClass('selected');
    });
}

$(document).ready(main)