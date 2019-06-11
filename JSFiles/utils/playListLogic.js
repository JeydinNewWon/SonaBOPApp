// playListLogic is the main function that powers the automatic queue system.
function playListLogic(userDataPath, playListName, selectedVideoID) {
    // if there are still elements left in the playlist,
    if ($('.playlistbox ul').children().length > 0) {
        // get the videoID of the top song.
        selectedVideoID = $('.playlistbox ul li:nth-of-type(1)').attr('data-id');
        // set the source of music to the respective .mp3 file.
        $('#musicplayer').attr("src", `${userDataPath}/MusicData/${playListName}/${selectedVideoID}.mp3`);
        // play the song.
        $('#musicplayer').trigger('play');
    }
}

module.exports = playListLogic;