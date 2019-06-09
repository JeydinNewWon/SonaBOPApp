global.$ = require('jquery');
//const searchForVideo = require('./utils/search.js').searchForVideo;
//const searchForDurations = require('./utils/search.js').searchForDurations;
const timeConverter = require('iso8601-duration');
const electron = require('electron');

const request = require('request');
const encodeurl = require('encodeurl');
const config = require('../config/config.json');
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


function main() {
    submitButtonEvent();
}

function submitButtonEvent() {
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

            $('body').removeClass('home');
            $('.videogridbuttons').after('<div class="videogrid"></div>');
            $('.videogridbuttons').append('<div class="returnbutton">Go Back</div> <div class="downloadbutton">Download</div>');

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
                    var videoID = idResult.id;
                    var thumbnailURL = videoData[videoID]['thumbnailURL'];
                    var title = videoData[videoID]['title'];

                    var duration = idResult.contentDetails.duration;
                    var durationObject = timeConverter.parse(duration);

                    var hours = durationObject.hours.toString().length === 1 ? `0${durationObject.hours}` : `${durationObject.hours}`;
                    var minutes = durationObject.minutes.toString().length === 1 ? `0${durationObject.minutes}` : `${durationObject.minutes}`;
                    var seconds = durationObject.seconds.toString().length === 1 ? `0${durationObject.seconds}` : `${durationObject.seconds}`;

                    var formattedTime = durationObject.hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;

                    //accomodates for proper css formatting when including hours in the timestamp.
                    var classGenerator = durationObject.hours > 0 ? `timestamp hashours` : `timestamp`;

                    $('.videogrid').append(
                        `<div class="video" id="video${counter}" data-id="${idResult.id}"> 
                            <img src="${thumbnailURL}"> 
                            <span class="${classGenerator}">${formattedTime}</span>
                            <p>${title}</p>
                        </div>`
                        );

                    counter += 1;
                });

                videoSelectorEvent();
                videoGridButtonsEvent();
            });

        });
    });
}

function videoSelectorEvent() {
    $('.video').on('click', (event) => {
        $('.video').removeClass('selected');
        var id = $(event.currentTarget).attr('id');
        $('#' + id).addClass('selected');
    });
}

function videoGridButtonsEvent() {
    $('.returnbutton').on('click', () => {
        $('body').empty();
        $('body').before('<header></header>');
        $('body').append(`<form id="searchwrap"> <h1>Search video to stream</h1> <input type="text" name="searchquery" id="searchquery"> <br> <input id="submit" type="submit" value="Submit"> </form>`);
        submitButtonEvent();
    });

    $('.downloadbutton').on('click', () => {
        var selectedVideoID = $('.selected').attr('data-id');
        var videoTitle = $('.selected > p').text();
        electron.ipcRenderer.send('asynchronous-message', selectedVideoID);
        electron.ipcRenderer.on('asynchronous-reply', (event, arg) => {
            console.log(videoTitle);
        });
    });
}


$(document).ready(main);