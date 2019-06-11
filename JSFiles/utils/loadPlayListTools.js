function loadPlayListTools() {
    // button logic to create a toggle system for the load playlist button.
    $('.loadplaylist').css('display', 'none');
    $('.loadplaylist ul li').remove();
    $('#loadbutton').css('display', 'block');
}

module.exports = loadPlayListTools;