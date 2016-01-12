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

d3.json("/Data/test.json", function(error, json) {
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

    var tooldiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("font", "11px sans-serif")
        .style("padding", "4px")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("opacity", 0);

    var edges = [];
    data.links.forEach(function(e) {
        var sourceNode = data.nodes.filter(function(n) {
            return n.id === e.source;
        })[0],
            targetNode = data.nodes.filter(function(n) {
                return n.id === e.target;
            })[0];

        edges.push({
            source: sourceNode,
            target: targetNode,
            interaction: e.interaction
        });
    });

    var force = d3.layout.force()
        .nodes(data.nodes)
        .links(edges)
        .size([width, height])
        .distance(50)
        .charge([-500])
        .start();

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
            .data(edges)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style("stroke", "red" )
            .style("stroke-opacity", ".3");

        // create the nodes to sit on top of the links
        var nodesG = svg.append("g")
            .attr("id", "nodes");
        var node = nodesG.selectAll(".node")
            .data(data.nodes, function(d) { return d.id })
        .enter().append("circle")
            .attr("class", "node")
            .attr("id", function(d) { return d.id })
            .attr("r", 3)
            .style("fill", "steelblue")
            .style("stroke", 1 )
            .style("stroke-width", 1.0)
            .call(force.drag)
            .on("mouseover", function(d) {
                tooldiv.transition()
                    .duration(200)
                    .style("opacity", .7);
                tooldiv.html(d.speciesName)
                    .style("left", (d3.event.x) + "px")
                    .style("top", (d3.event.y - 30) + "px");
            })
            .on("mouseout", function(d) {
                tooldiv.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

        });

    };
};

//
// window.onload = function () {
//     // do stuff when everything else (text, images, scripts etc.) are loaded
// };
