const timeConverter = require('iso8601-duration');

// displayVideos function displays video data to the screen.
function displayVideos(rsp, videoData, cb) {
    // initiate a counter.
    var counter = 1
    // for each of the videos in the returned from the response,
    rsp.items.forEach((idResult) => {
        // get the videoID, thumbnailURL and title from the videoData Object.
        var videoID = idResult.id;
        var thumbnailURL = videoData[videoID]['thumbnailURL'];
        var title = videoData[videoID]['title'];

        // get the duration from the searchForDuration response;
        var duration = idResult.contentDetails.duration;
        // parse the iso8601 format to an Object.
        var durationObject = timeConverter.parse(duration);

        // format the times, adding 0's in front of single-digit values for h, m or s , while leaving double-digit values for h,m or s alone.
        var hours = durationObject.hours.toString().length === 1 ? `0${durationObject.hours}` : `${durationObject.hours}`;
        var minutes = durationObject.minutes.toString().length === 1 ? `0${durationObject.minutes}` : `${durationObject.minutes}`;
        var seconds = durationObject.seconds.toString().length === 1 ? `0${durationObject.seconds}` : `${durationObject.seconds}`;

        // if the video has hours, add hours in front, else, leave it in m:s.
        var formattedTime = durationObject.hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;

        // accomodates for proper css formatting when including hours in the timestamp.
        var classGenerator = durationObject.hours > 0 ? `timestamp hashours` : `timestamp`;

        // create a video box and display onto the screen.
        $('.videogrid').append(
            `<div class="video" id="video${counter}" data-id="${idResult.id}"> 
                <img src="${thumbnailURL}"> 
                <span class="${classGenerator}">${formattedTime}</span>
                <p>${title}</p>
            </div>`
            );

        // increment the counter.
        counter += 1;
    });

    // run the callback to register the events.
    cb();
}

module.exports = displayVideos;