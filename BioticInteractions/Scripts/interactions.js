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
    // set properties
    var height, network, update, width;
    width = options.width;
    height = options.height;
    // var force = d3.layout.force()
    //     .charge(-120)
    //     .linkDistance(30)
    //     .size([width, height])
    //     .nodes(data.Nodes)
    //     .links(data.Pollinators);

    // create new div element containing svg element
    d3.select("body").append("div")
        .attr("id", "interactions")
            .attr("width", width)
            .attr("height", height);

    var svg = d3.select("#interactions").append("svg")
        .attr("class", "network")
            .attr("width", width)
            .attr("height", height);

    network(svg, data);

    function network(svg, data) {

        // create the links
        var linksG = svg.append("g")
            .attr("id", "links");
        var link = linksG.selectAll("line.link")
            .data(data.Pollinators, function(d) { return d.source+"-"+d.target })
        link.enter().append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("stroke", "red" )
            .style("stroke-opacity", ".7");

        // create the nodes to sit on top of the links
        var nodesG = svg.append("g")
            .attr("id", "nodes");
        var node = nodesG.selectAll(".node")
            .data(data.Nodes, function(d) { return d.id })
        .enter().append("circle")
            .attr("class", "node")
            .attr("r", 3)
            .attr("cx", function() { return Math.random() * width; } )
            .attr("cy", function() { return Math.random() * height; } )
            .style("fill", "steelblue")
            .style("stroke", 1 )
            .style("stroke-width", 1.0);
            // .call(force.drag);

        // force.on("tick", function() {
        //     link.attr("x1", function(d) { return d.source.x; })
        //         .attr("y1", function(d) { return d.source.y; })
        //         .attr("x2", function(d) { return d.target.x; })
        //         .attr("y2", function(d) { return d.target.y; });
        //
        //     node.attr("cx", function(d) { return d.x; })
        //         .attr("cy", function(d) { return d.y; });
        // });

        // node.on("mouseover", showDetails)
        //     .on("mouseout", hideDetails)

        // node.exit().remove()

    };

    // force.start();
};

//
// window.onload = function () {
//     // do stuff when everything else (text, images, scripts etc.) are loaded
// };
