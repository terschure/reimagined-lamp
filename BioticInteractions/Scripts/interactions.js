//--------------------------------
// by: Anneke ter Schure, 6084087
//
// make localhost server: python -m SimpleHTTPServer
// use url: http://localhost:8000/index.html
//
// data obtained from: http://api.globalbioticinteractions.org/interaction?bbox=3.36,50.75,7.23,53.59
// http://api.globalbioticinteractions.org/interaction?type=json.v2
//--------------------------------

// globals
nodeOpacity = 0.8;
linkOpacity = 0.2;
linkDistance = 100;
layout = "force"

d3.json("/Data/bioInteractions.json", function(error, json) {
    if (error) return console.warn(error);

    // set global variables
    data = json;
    force = d3.layout.force();

    // create the network and show the header and filters when it is loaded
    setNetwork();
    createFilters(["Insects", "Mammals", "Birds", "Plants", "Fungi", "Viruses", "Other"], data);
    createButtons();
    createSearchBox();
    d3.select("#header").style("visibility", "visible");
    d3.select(".filters").style("visibility", "visible");
    d3.select(".buttons").style("visibility", "visible");
});

window.onload = function () {
    // do stuff when everything else (text, images, scripts etc.) are loaded
    // create a tooltip div with settings
    tooldiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("font", "11px sans-serif")
        .style("padding", "4px")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("opacity", 0);

    filterdiv = d3.select("body").append("div");
    filterdiv.attr("id", "filters")
        .attr("class", "filters");
};

var createFilters = function(speciesGroups, allData) {
    d3.select("#filters").selectAll("input")
        .data(speciesGroups)
        .enter()
        .append("label")
            .attr("for", function(d) { return d; })
            .text(function(d) { return " " + d; })
            .style("color", "white")
        .append("input")
            .attr("checked", true)
            .attr("type", "checkbox")
            .attr("id", function(d) { return d; })
            .on("click", filterNodesData);
};

var createButtons = function() {
    // d3.select("body").append("div")
        // .attr("id", "layout")
        filterdiv.append("input")
            .attr("class", "buttons")
            .attr("name", "cluster")
            .attr("type", "button")
            .attr("value", "Change Layout")
            // .style("bottom", "3%")
            // .style("margin-left", "3%")
            .on("mouseover", function() {
                d3.select(this).style("background-color", "lightsteelblue")
            })
            .on("mouseout", function() {
                d3.select(this).style("background-color", "black")
            })
            .on("click", function() {
                if(layout == "force") {
                    layout = "cluster"
                    setLayout("cluster", width, height);
                }
                else if(layout == "cluster") {
                    layout = "force"
                    setLayout("force", width, height);
                };
            });
    // // d3.select("body").append("div")
    // //     .attr("id", "force")
    //     filterdiv.append("input")
    //         .attr("class", "buttons")
    //         .attr("name", "cluster")
    //         .attr("type", "button")
    //         .attr("value", "Force")
    //         // .style("bottom", "3%")
    //         // .style("margin-left", "10%")
    //         .on("mouseover", function() {
    //             d3.select(this).style("background-color", "lightsteelblue")
    //         })
    //         .on("mouseout", function() {
    //             d3.select(this).style("background-color", "black")
    //         })
    //         .on("click", function() {
    //             if(layout == "cluster") {
    //                 layout = "force"
    //                 setLayout("force", width, height);
    //             };
    //         });
};
// <div class="ui-widget">
//    <input id="search">
//     <button type="button" onclick="searchNode()">Search</button>
// </div>
var createSearchBox = function() {

    filterdiv.append("form").append("input")
        .attr("id", "search")
        .attr("type", "text")
        .attr("placeholder", "Search network..")
    filterdiv.append("button")
            .attr("class", "button")
            .attr("type", "button")
            .attr("value", "Search")
            .on("click", searchNode());

    var optArray = [];
    for (var i = 0; i < data.nodes.length - 1; i++) {
        optArray.push(data.nodes[i].speciesName);
    }
    optArray = optArray.sort();
    $(function () {
        $("#search").autocomplete({
            source: optArray
        });
    });
    function searchNode() {
        //find the node
        var selectedVal = document.getElementById('search').value;
        var node = d3.selectAll(".node");
        if (selectedVal == "none") {
            node.style("stroke", "white").style("stroke-width", "1");
        } else {
            var selected = node.filter(function (d, i) {
                return d.speciesName != selectedVal;
            });
            selected.style("opacity", "0");
            var link = d3.selectAll(".link")
            link.style("opacity", "0");
            d3.selectAll(".node, .link").transition()
                .duration(5000)
                .style("opacity", 1);
        }
    };
};

var setNetwork = function() {
    width = window.innerWidth;
    height = window.innerHeight;

    // set zoom and panning behavior; source: http://bl.ocks.org/mbostock/6123708
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    function zoomed() {
        console.log("zoom")
        d3.select("#nodes").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        d3.select("#links").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    };

    // create new div element containing svg element for the network
    d3.select("body").append("div")
        .attr("id", "interactions")
        .attr("width", width)
        .attr("height", height);

    svg = d3.select("#interactions").append("svg")
        .attr("class", "network")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    // show all species and inderactions
    currentNodes = data.nodes;
    currentLinks = filterLinkData(data, currentNodes);
    updateLinks(svg);
    updateNodes(svg);
    // layout can be "force", "cluster" or "radial"
    setLayout(layout, width, height);
};

var setLayout = function(layout, width, height) {
    // set force layout for physics simulation
    force.nodes(currentNodes)
        .links(currentLinks)
        .size([width, height]);

    if(layout == "cluster") {
        force.on("tick", tick)
            .linkStrength(0.001)
            .charge(-1.5)
            .start();

        function tick(e) {
            // Push different nodes in different directions for clustering
            // Source: http://bl.ocks.org/mbostock/1021841
            var k = 6 * e.alpha;
            // console.log(e.alpha);
            currentNodes.forEach(function(o, i) {
                if(o.group == "Plants") { return o.y += k, o.x += -k; }
                else if(o.group == "Fungi") { return o.y += k, o.x += k; }
                else if(o.group == "Mammals") { return o.y += -k/2, o.x += k*2; }
                else if(o.group == "Insects") { return o.y += -k, o.x += k; }
                else if(o.group == "Birds") { return o.y += -k, o.x += -k; }
                else if(o.group == "Viruses") { return o.y += k/2, o.x += -k*2; }
                else { return o.y += -k/2, o.x += k/2; };
            });

            node.transition()
                .duration(300)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        };
    }
    else {
        force.distance(40)
            .linkStrength(0.2)
            .distance(linkDistance)
            .charge(-8)
            .start();

        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.transition()
                .duration(400)
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        });
    };
};

var updateNetwork = function() {
    currentLinks = filterLinkData(data, currentNodes);
    updateLinks(svg);
    updateNodes(svg);
    // layout can be "force", "cluster" or "radial"
    setLayout(layout, width, height);
};

// IDEA: exactly two filters are selected;
// position the groups opposite of each other
var filterNodesData = function() {
    var temp = currentNodes;
    var id = this.id;
    console.log(id);
    // temp = temp.filter( function(entry) { return entry.group == id });

    if(this.checked) {
        var selection = data.nodes.filter( function(entry) {
            return entry.group == id;
        });
        temp = temp.concat(selection);
    }
    else {
        temp = temp.filter( function(entry) {
            return entry.group != id;
        });
    };
    currentNodes = temp;
    // console.log(temp);
    currentLinks = filterLinkData(data, currentNodes)
    updateLinks(svg);
    updateNodes(svg);
    setLayout(layout, width, height);
};


function filterLinkData(data, currentNodes) {
    // prepare data for links in the network
    var edges = [];
    data.links.forEach(function(e) {
        var sourceNode = currentNodes.filter(function(n) {
            return n.id === e.source;
        })[0],
        targetNode = currentNodes.filter(function(n) {
            return n.id === e.target;
        })[0];
        // only parse links that are valid after filtering the nodes
        if(sourceNode != undefined && targetNode != undefined) {
            edges.push({
                source: sourceNode,
                target: targetNode,
                interaction: e.interaction
            });
        };
    });
    return edges;
};

function updateLinks(svg) {
    // remove existing links
    d3.select("#links").transition().remove();

    // create the links
    var linksG = svg.append("g")
        .attr("id", "links");
    link = linksG.selectAll("line.link")
        .data(currentLinks);
    link.enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x })
        .attr("y1", function(d) { return d.source.y })
        .attr("x2", function(d) { return d.target.x })
        .attr("y2", function(d) { return d.target.y })
        .style("stroke", function(d) {
            if (d.interaction == 'predator') { return "#e41a1c" }
            else if (d.interaction == 'parasite') { return "#ff7f00" }
            else if (d.interaction == 'pollinator') { return "#f781bf" }
            else if (d.interaction == 'pathogen') { return "#984ea3" }
            else if (d.interaction == 'vector') { return "#377eb8" }
        })
        .style("stroke-width", 2)
        .style("stroke-opacity", linkOpacity)
        .on("mouseover", function(d) {
            // show tooltip!
            tooldiv.transition()
                .duration(200)
                .style("opacity", ".8");
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
    link.exit().remove();
};

function updateNodes(svg) {
    // remove existing nodes
    d3.select("#nodes").remove();

    // create the nodes to sit on top of the links
    var nodesG = svg.append("g")
        .attr("id", "nodes");
    node = nodesG.selectAll(".node")
        .data(currentNodes, function(d) { return d.id });
    node.enter().append("circle")
        .attr("class", "node")
        .attr("id", function(d) { return d.id })
        .attr("r", 3)
        .style("fill", function(d) {
            if (d.group == 'Insects') { return "orange" }
            else if (d.group == 'Mammals') { return "red" }
            else if (d.group == 'Plants') { return "green" }
            else if (d.group == 'Fungi') { return "white" }
            else if (d.group == 'Viruses') { return "purple" }
            else if (d.group == 'Birds') { return "#5712A4" }
            else { return "grey" }
        })
        .style("opacity", nodeOpacity)
        .style("stroke", 1 )
        .style("stroke-width", 1.0)
        .call(force.drag)
        .on("mouseover", tooltipNode)
        .on("mouseout", hideTooltip)
        .on("click", connectedNodes);

    function tooltipNode() {
        // show tooltip!
        var d = d3.select(this).node().__data__;
        tooldiv.transition()
            .duration(200)
            .style("opacity", '.8');
        tooldiv.html(d.speciesName)
            .style("left", (d3.event.x) + "px")
            .style("top", (d3.event.y - 30) + "px");
    };

    function hideTooltip() {
        // hide tooltip
        tooldiv.transition()
            .duration(500)
            .style("opacity", 0);
    };

    // Remember whether the highlighting is on
    var highlight = 0;
    function connectedNodes() {
        // show links of one individual node
        if (highlight == 0) {
            // select node and show detailed information
            var d = d3.select(this).node().__data__;
            showDetails(d);

            // reduce the opacity of all but this node
            node.style("opacity", function (o) {
                return d == o ? 1 : 0.2;
            });

            // store the neighbouring nodes in an array
            objects = [];

            // reduce the opacity of all but these links
            // and show details about the relationship
            link.style("stroke-opacity", function (o) {
                if(d === o.source) {
                    objects.push(o.target);
                    d3.select("#details").append("p")
                        .text(".. is a " + o.interaction + " of " + o.target.speciesName);
                }
                else if(d === o.target) {
                    objects.push(o.source);
                    d3.select("#details").append("p")
                        .text(o.source.speciesName + " is a " + o.interaction + " of this species");
                };
                return d == o.source || d == o.target ? 0.8 : 0.1;
            });

            // reduce the opacity of all neigbouring nodes
            objects.forEach(function(o) {
                d3.select("[id='" + o.id + "']")
                    .style("opacity", 1);
            });
            // reset highlight to reset opacity
            highlight = 1;
        }
        else {
            // Put them back to original opacity
            node.style("opacity", nodeOpacity);
            link.style("stroke-opacity", linkOpacity);
            highlight = 0;
            // remove previous details
            d3.select("#details").remove();
        };
    };
    node.exit().remove();
};

function showDetails(d) {
    var div = d3.select("body").append("div")
        .attr("id", "details");
    div.append("h4").text(d.speciesName);
    div.append("p").text(d.path)
        .style("font-size", "7px");
};
