//--------------------------------
// by: Anneke ter Schure, 6084087
//
// make localhost server: python -m SimpleHTTPServer
// use url: http://localhost:8000/index.html
//
// data obtained from: http://api.globalbioticinteractions.org/interaction?bbox=3.36,50.75,7.23,53.59
// http://api.globalbioticinteractions.org/interaction?type=json.v2
//--------------------------------

var data;

d3.json("/Data/bioInteractions.json", function(error, json) {
    if (error) return console.warn(error);
    data = json;

    // http://boundingbox.klokantech.com/ 3.36,50.75,7.23,53.59 (W,S,E,N)
    var netherlands = { nw_lng: 3.36, se_lat: 50.75, se_lng: 7.23, nw_lat: 53.59 };
    var options = { location: netherlands, width: 1000, height: 300 };
    drawNetwork(options);
});

function drawNetwork(options) {
    d3.select("body").append("div")
        .attr("id", "network")
                .attr("width", options.width)
                .attr("height", options.height);
};


window.onload = function () {
    // do stuff when everything else (text, images, scripts etc.) are loaded
};
