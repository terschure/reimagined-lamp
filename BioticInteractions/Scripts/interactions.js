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

d3.json("/Data/bioInteractions2.json", function(error, json) {
    if (error) return console.warn(error);
    Network(json);
});

var Network = function(data) {
    // set properties
    var height, network, update, width;
    width = window.innerWidth;
    height = window.innerHeight;

    // for debugging purposes
    // data.links.forEach(function(link, index, list) {
    //     if (typeof data.nodes[link.source] === 'undefined') {
    //         console.log('undefined source', link);
    //     }
    //     else if (typeof data.nodes[link.target] === 'undefined') {
    //         console.log('undefined target', link);
    //     }
    // });

    // create a list of source and target objects (instead of ID's) for the links
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

    // set force layout for physics simulation
    var force = d3.layout.force()
        .nodes(data.nodes)
        .links(edges)
        .size([width, height])
        .distance(40)
        .charge([-10])
        .start();

    // create a tooltip div with settings
    var tooldiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("font", "11px sans-serif")
        .style("padding", "4px")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("opacity", 0);

    // create new div element containing svg element for the network
    d3.select("body").append("div")
        .attr("id", "interactions")
            .attr("width", width)
            .attr("height", height);
            // .style("background", "black");

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
            .style("stroke", function(d) {
                if (d.interaction == 'predator') { return "#e41a1c" }
                else if (d.interaction == 'parasite') { return "#ff7f00" }
                else if (d.interaction == 'pollinator') { return "#f781bf" }
                else if (d.interaction == 'pathogen') { return "#984ea3" }
                else if (d.interaction == 'vector') { return "#377eb8" }
            })
            .style("stroke-width", 2)
            .style("stroke-opacity", ".3")
            .on("mouseover", function(d) {
                // show tooltip!
                tooldiv.transition()
                    .duration(200)
                    .style("opacity", '.7');
                tooldiv.html(d.source.speciesName + ' is a ' + d.interaction + ' of ' + d.target.speciesName)
                    .style("left", (d3.event.x) + "px")
                    .style("top", (d3.event.y - 30) + "px");
            })
            .on("mouseout", function(d) {
                // hide tooltip
                tooldiv.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


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
                // show tooltip!
                tooldiv.transition()
                    .duration(200)
                    .style("opacity", '.7');
                tooldiv.html(d.speciesName)
                    .style("left", (d3.event.x) + "px")
                    .style("top", (d3.event.y - 30) + "px");
            })
            .on("mouseout", function(d) {
                // hide tooltip
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

    // uncomment for a static network:
    // force.start();
    // for (var i = 10; i > 0; --i) force.tick();
    // force.stop();

    };
};

//
// window.onload = function () {
//     // do stuff when everything else (text, images, scripts etc.) are loaded
// };
