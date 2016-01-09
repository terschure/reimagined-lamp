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
    var options = { width: 1000, height: 500 };
    Network(options, json);
});


var Network = function(options, data) {
    console.log(data)
    var height, network, update, width;
    width = options.width;
    height = options.height;

    // create new div element containing svg element
    d3.select("body").append("div")
        .attr("id", "network")
            .attr("width", width)
            .attr("height", height);

    var svg = d3.select("#network").append("svg")
        .attr("class", "network")
            .attr("width", width)
            .attr("height", height);

    network(svg, data);
    function network(selection, data) {
        // main implementation
        node = selection.selectAll("circle")
            .data(data.Nodes, function(d) { return d.speciesID });

        node.enter().append("circle")
            .attr("class", "node")
            .attr("cx", function() { return Math.random() * width; } )
            .attr("cy", function() { return Math.random() * height; } )
            .attr("r", function() { return "3"; } )
            .style("fill", function() { return "steelblue" } )
            .style("stroke", function() { return "1" } )
            .style("stroke-width", 1.0)

        // node.on("mouseover", showDetails)
        //     .on("mouseout", hideDetails)

        // node.exit().remove()

    };
};


//
// window.onload = function () {
//     // do stuff when everything else (text, images, scripts etc.) are loaded
// };
