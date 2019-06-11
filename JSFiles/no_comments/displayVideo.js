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