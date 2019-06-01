global.$ = require('jquery');
const test = require('./testmodule.js');

function myDocument() {
    $('.button').on('click', () => {
        test();
    });
}

$(document).ready(myDocument);