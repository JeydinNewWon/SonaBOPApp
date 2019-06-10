global.$ = require('jquery');
const timeConverter = require('iso8601-duration');
const electron = require('electron');
const request = require('request');
const encodeurl = require('encodeurl');
const prompt = require('electron-prompt');
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
    loadPlaylistEvents();
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
                displayVideos(rsp, videoData, () => {
                    videoSelectorEvent();
                    videoGridButtonsEvent();
                });
            });

        });
    });
}


function displayVideos(rsp, videoData, cb) {
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
    cb();
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
        $('.videogrid').remove();
        $('.returnbutton').remove();
        $('.downloadbutton').remove();
        $('body').addClass('home')
                 .append(`<form id="searchwrap"> <h1>Search video to stream</h1> <input type="text" name="searchquery" id="searchquery"> <br> <input id="submit" type="submit" value="Submit"> </form>`);
        submitButtonEvent();
    });

    $('.downloadbutton').on('click', () => {
        electron.ipcRenderer.removeAllListeners('confirm-download');

        if ($('#errormsg').length) {
            $('#errormsg').remove();
        }
        if (!$('.selected').length) {
            $('.videogrid').before('<p id="errormsg" style="margin-left:30px">Please select a video before downloading.</p>');
            return;
        }

        $('.videogrid').before('<p id="confirmmsg">Downloading...</p>')

        var selectedVideoID = $('.selected').attr('data-id');
        var duration = $('.selected > span').text();
        var videoTitle = $('.selected > p').text();

        electron.ipcRenderer.send('download-video', selectedVideoID);
        electron.ipcRenderer.on('confirm-download', (event, userDataPath) => {
            $('.playlistbox ul').append(`<li data-id="${selectedVideoID}"><p><i>${videoTitle}</i></p><span class="playlistduration">${duration}</span><span class="delete"></span></li>`);
            $('#confirmmsg').text('Succesfully added to Queue.');
            removeMusicEvent(); 
            var musicplayer = $('#musicplayer')[0];
            if (musicplayer.paused || $('.playlistbox ul').children().length === 1) {
                $('#musicplayer').attr("src", `${userDataPath}/MusicData/main/${selectedVideoID}.mp3`);
                $('#musicplayer').trigger('play');
            }

            setTimeout(() => {
                $('#confirmmsg').remove();
            }, 3000);

            musicplayer.onended = function() {
                electron.ipcRenderer.removeAllListeners('confirm-remove');
                var toBeRemovedID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
                $('.playlistbox ul li:nth-of-type(1)').remove();
                if ($(`.playlistbox ul li[data-id=${toBeRemovedID}]`).length >= 1) {
                    var currentPlayingSongID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
                    if (currentPlayingSongID === toBeRemovedID) {
                        playListLogic(userDataPath, 'main', toBeRemovedID);
                    } else {
                        
                        playListLogic(userDataPath, 'main', currentPlayingSongID);
                    }
                } else {
                    electron.ipcRenderer.send('remove-mp3', toBeRemovedID);
                    electron.ipcRenderer.on('confirm-remove', (event, userDataPath) => {
                        playListLogic(userDataPath, 'main', toBeRemovedID);
                    });
                }
            }
        });
    });
}

function loadPlaylistEvents() {
    $('#loadbutton').on('click', (event) => {
        $('.loadplaylist').css('display', 'block');
        $('#loadbutton').css('display', 'none');
        electron.ipcRenderer.send('load-playlist-folders');
        electron.ipcRenderer.once('load-playlist-folders-rsp', (event, playListFolders) => {
            playListFolders.forEach((folder) => {
                if (folder !== '.DS_Store' && folder !== 'main') {
                    $('.loadplaylist ul').append(`<li>${folder}</li>`);
                }
            });
            readPlaylistEvent();
        });
    });

    $('#savebutton').on('click', (event) => {
        if ($('#errormsg').length) {
            $('#errormsg').remove();
        }

        prompt({ title: 'Save Playlist' , label: 'Enter Playlist Name: '}).then((playListName) => {
            if (playListName === null) {
                return;
            } else {
                var counter = 1;
                var playlistContents = {};

                if ($('.playlistbox ul li').length === 0) {
                    if ($('.videogrid').length) {
                        $('.videogrid').before(`<p id="errormsg">Please add items to the playlist</p>`);
                    } else {
                        $('#searchwrap > h1').after('<p id="errormsg">Please add items to the playlist</p>');
                    }
                    return;
                }
        
                $('.playlistbox ul li').toArray().forEach(() => {
                    var selector = `.playlistbox ul li:nth-of-type(${counter})`;
        
                    var title = $(selector + ' > p').text();
                    var id = $(selector).attr('data-id');
                    var duration = $(selector + ' .playlistduration').text();
        
                    playlistContents[id] = {
                        "title": title,
                        "duration": duration
                    }
        
                    counter += 1;
                });

                electron.ipcRenderer.send('save-playlist-folders', playListName, playlistContents);
                electron.ipcRenderer.once('confirm-save-playlist-folders', (event, rsp) => {
                    if ($('.videogrid').length) {
                        $('.videogrid').before(`<p id="confirmmsg">Successfully saved playlist!</p>`);
                        setTimeout(() => {
                            $('#confirmmsg').remove();
                        }, 3000);
                    } else {
                        $('#searchwrap > h1').after('<p id="confirmmsg">Successfully saved playlist!</p>');
                        setTimeout(() => {
                            $('#confirmmsg').remove();
                        }, 3000);
                    }
                });
            }
        }).catch((err) => {
            if (err) console.err(err);
        });
    });

    $('#loadcancelbutton').on('click', () => {
        loadPlayListTools();
    });
}

function readPlaylistEvent() {
    $('.loadplaylist ul li').on('click', (event) => {
        var playListToLoad = $(event.currentTarget).text();
        electron.ipcRenderer.send('read-playlist', playListToLoad);
        electron.ipcRenderer.once('read-playlist-rsp', (event, playListToLoadPath, userDataPath, obj) => {
            loadPlayListTools();
            $('.playlistbox ul li').remove();
            var videoIDS = Object.keys(obj);
            videoIDS = videoIDS.reverse();
            videoIDS.forEach((id) => {
                $('.playlistbox ul').append(`<li data-id="${id}"><p><i>${obj[id]["title"]}</i></p><span class="playlistduration">${obj[id]["duration"]}</span><span class="delete"></span></li>`);
            });
            $('#musicplayer').attr('src', `${playListToLoadPath}/${videoIDS[0]}.mp3`);
            $('#musicplayer').trigger('play');

            var musicplayer = $('#musicplayer')[0];

            musicplayer.onended = function() {
                var toBeRemovedID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
                $('.playlistbox ul li:nth-of-type(1)').remove();
                var currentPlayingSongID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
                playListLogic(userDataPath, playListToLoad, currentPlayingSongID);
            }

        });
    });
}

function removeMusicEvent() {
    $('.delete').on('click', (event) => {
        $(event.currentTarget.parentElement).remove();
    });
}

function loadPlayListTools() {
    $('.loadplaylist').css('display', 'none');
    $('.loadplaylist ul li').remove();
    $('#loadbutton').css('display', 'block');
}

function playListLogic(userDataPath, playListName, selectedVideoID) {
    if ($('.playlistbox ul').children().length > 0) {
        selectedVideoID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
        $('#musicplayer').attr("src", `${userDataPath}/MusicData/${playListName}/${selectedVideoID}.mp3`);
        $('#musicplayer').trigger('play');
    }
}


$(document).ready(main);