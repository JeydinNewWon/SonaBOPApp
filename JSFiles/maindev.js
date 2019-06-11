// import all required libraries.
global.$ = require('jquery');
const electron = require('electron');
const prompt = require('electron-prompt');

// import all functions.
const search = require('./utils/search.js')
const searchForVideo = search.searchForVideo;
const searchForDurations = search.searchForDurations;
const displayVideos = require('./utils/displayVideo.js');
const loadPlayListTools = require('./utils/loadPlayListTools.js');
const playListLogic = require('./utils/playListLogic.js');

// main function that registers the events to work in the DOM.
function main() {
    submitButtonEvent();
    loadPlaylistEvents();
}

// submitButtonEvent is called when the submit button is pressed.
function submitButtonEvent() {
    // when submit button is called,
    $('#searchwrap').on('submit', (event) => {
        // prevent the event.
        event.preventDefault();
        // checks if error msg element exists.

        // if an error msg is on screen, remove it.
        if ($('#errormsg').length) {
            $('#errormsg').remove();
        }

        // get the value for searchquery.
        var searchQuery = $("#searchquery").val();

        // if the query is nothing,
        if (searchQuery == '') {
            // display an error message to the screen and exit the function.
            $('#searchwrap > h1').after('<p id="errormsg">Please enter a valid search query.</p>');
            return;
        }

        // search for the video.
        searchForVideo(searchQuery, (rsp) => {
            // once the function is complete,
            // if the form is still on screen, remove it.
            if ($('#searchwrap').length) {
                $('#searchwrap').remove();
            }

            // remove class home from body element.
            $('body').removeClass('home');

            // create the videogrid.
            $('.videogridbuttons').after('<div class="videogrid"></div>');

            // create the 'Go Back' button and 'Download' button.
            $('.videogridbuttons').append('<div class="returnbutton">Go Back</div> <div class="downloadbutton">Download</div>');

            // initiate an empty CSV string for the videoIDS.
            var videoIDSCSV = '';

            // initiate an empty object.
            var videoData = {};

            // loop through the response items. For each video in the search,
            rsp.items.forEach((video) => {
                // get thumbnailURL, title and videoID of the video.
                var thumbnailURL = video.snippet.thumbnails.high.url;
                var title = video.snippet.title;
                var videoID = video.id.videoId;

                // create a mini object to store the data.
                var videoDataObject = {
                    'title': title,
                    'thumbnailURL': thumbnailURL,
                }

                // store the mini object into the videoData Object.
                videoData[videoID] = videoDataObject;
                // add the videoID to the CSV empty string.
                videoIDSCSV += `${videoID}%2C`;
            });

            // once the function is complete, search for the video durations.
            searchForDurations(videoIDSCSV, (rsp) => {
                // once the video durations have been found, display the videos to the screen. 
                displayVideos(rsp, videoData, () => {
                    // register the videoSelector and videoGridButtons events.
                    videoSelectorEvent();
                    videoGridButtonsEvent();
                });
            });

        });
    });
}

// videoSelectorEvent. activated when a video is clicked, so that it becomes selected.
function videoSelectorEvent() {
    // when video is clicked.
    $('.video').on('click', (event) => {
        // remove the current selected video.
        $('.video').removeClass('selected');
        // get the HTML id of the video that was just selected.
        var id = $(event.currentTarget).attr('id');
        // select the new video.
        $('#' + id).addClass('selected');
    });
}

// called when the return or download buttons are clicked.
function videoGridButtonsEvent() {
    // if the return button is pressed,
    $('.returnbutton').on('click', () => {
        // remove the videogrid, return button, download button.
        $('.videogrid').remove();
        $('.returnbutton').remove();
        $('.downloadbutton').remove();

        // add the home class back to the body element and re-create the search form.
        $('body').addClass('home')
                 .append(`<form id="searchwrap"> <h1>Search video to stream</h1> <input type="text" name="searchquery" id="searchquery"> <br> <input id="submit" type="submit" value="Submit"> </form>`);

        // register the submit form event again so the page becomes responsive.
        submitButtonEvent();
    });

    // when download button is clicked,
    $('.downloadbutton').on('click', () => {
        // remove all event listeners.
        electron.ipcRenderer.removeAllListeners('confirm-download');

        // if error message exists, remove it.
        if ($('#errormsg').length) {
            $('#errormsg').remove();
        }

        // if no video is selected, display an error message.
        if (!$('.selected').length) {
            $('.videogrid').before('<p id="errormsg" style="margin-left:30px">Please select a video before downloading.</p>');
            return;
        }

        // notify the user the video is downloading.
        $('.videogrid').before('<p id="confirmmsg">Downloading...</p>')

        // extract the videoId, duration and title values from the selected video.
        var selectedVideoID = $('.selected').attr('data-id');
        var duration = $('.selected > span').text();
        var videoTitle = $('.selected > p').text();

        // send a request to the main process to download the video.
        electron.ipcRenderer.send('download-video', selectedVideoID);
        // once the main process is finished downloading and replies to the renderer process,
        electron.ipcRenderer.on('confirm-download', (event, userDataPath) => {
            // append the new video to the playlist.
            $('.playlistbox ul').append(`<li data-id="${selectedVideoID}"><p><i>${videoTitle}</i></p><span class="playlistduration">${duration}</span><span class="delete"></span></li>`);

            // notify the user that the video was successfully downloaded and added to queue.
            $('#confirmmsg').text('Succesfully added to Queue.');

            // activate the remove song button ('x').
            removeMusicEvent(); 

            // get the HTML element of the musicplayer.
            var musicplayer = $('#musicplayer')[0];

            // if the music player is paused OR the playlist has one song,
            if (musicplayer.paused || $('.playlistbox ul').children().length === 1) {
                // set the music source to the respective .mp3 file.
                $('#musicplayer').attr("src", `${userDataPath}/MusicData/main/${selectedVideoID}.mp3`);
                // play the song.
                $('#musicplayer').trigger('play');
            }

            // wait 3 seconds then remove the confirm message.
            setTimeout(() => {
                $('#confirmmsg').remove();
            }, 3000);

            // when the music player has ended,
            musicplayer.onended = function() {
                // remove all listeners.
                electron.ipcRenderer.removeAllListeners('confirm-remove');

                // get the id of the song that has finished.
                var toBeRemovedID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');

                // remove the song from the playlist.
                $('.playlistbox ul li:nth-of-type(1)').remove();

                // if the same song appears in the list again, 
                if ($(`.playlistbox ul li[data-id=${toBeRemovedID}]`).length >= 1) {
                    // get the id of the current song,
                    var currentPlayingSongID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
                    // if the current song's id is equal to the id of the song that is to be removed,
                    if (currentPlayingSongID === toBeRemovedID) {
                        // run playlistlogic with toBeRemovedID as last param.
                        playListLogic(userDataPath, 'main', toBeRemovedID);
                    } else {
                        // else, run playlistlogic with currentPlayingSongID as last param.
                        playListLogic(userDataPath, 'main', currentPlayingSongID);
                    }
                } else {
                    // send a request to the main process to remove the song from storage.
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
                    var isVideoGridExists = $('.videogrid').length;

                    if (rsp === "mainIsReserved" && isVideoGridExists) {
                        $('.videogrid').before('<p id="errormsg">Sorry, that playlist name is reserved.</p>');

                    } else if (rsp === "mainIsReserved" && !isVideoGridExists) {
                        $('#searchwrap > h1').after('<p id="errormsg">Sorry, that playlist name is reserved.</p>');
                    }

                    if (rsp === "alreadyExists" && isVideoGridExists) {
                        $('.videogrid').before('<p id="errormsg">That playlist already exists.</p>');

                    } else if (rsp === "alreadyExits" && !isVideoGridExists) {
                        $('#searchwrap > h1').after('<p id="errormsg">That playlist already exists.</p>');

                    } 

                    if (rsp !== "alreadyExists" && rsp !== "mainIsReserved" && isVideoGridExists) {
                        $('.videogrid').before(`<p id="confirmmsg">Successfully saved playlist!</p>`);
                    } else if (rsp !== "alreadyExists" && rsp !== "mainIsReserved") {
                        $('#searchwrap > h1').after('<p id="confirmmsg">Successfully saved playlist!</p>');
                    }

                    setTimeout(() => {
                        if($('#errormsg').length) {
                            $('#errormsg').remove();
                        }
    
                        if ($('#confirmmsg').length) {
                            $('#confirmmsg').remove();
                        }
                    }, 3000);
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
    // remove the song if the 'x' button is clicked in the playlistbox.
    $('.delete').on('click', (event) => {
        $(event.currentTarget.parentElement).remove();
    });
}

$(document).ready(main);