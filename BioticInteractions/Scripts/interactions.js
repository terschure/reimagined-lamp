//--------------------------------
// by: Anneke ter Schure, 6084087
//
// data obtained from:  http://api.globalbioticinteractions.org/interaction?bbox=3.36,50.75,7.23,53.59
//                      http://api.globalbioticinteractions.org/interaction?type=json.v2
//--------------------------------

// globals
nodeOpacity = 0.8;
linkOpacity = 0.3;
linkDistance = 100;
layout = "force";
colorNodes = d3.scale.ordinal()
    .domain(["Insects", "Mammals", "Birds", "Plants", "Fungi", "Viruses", "Other"])
    .range(["#FFC000", "#FF0000", "#8D1BFF", "#007800", "#ECFFB1", "#B30065", "#838383"]);
colorLinks = d3.scale.ordinal()
    .domain(["predator", "parasite", "pollinator", "pathogen", "vector"])
    .range(["#8E0000", "#6E4A9C", "#BD40BD", "#004FFF", "#FF8000"]);

d3.json("Data/bioInteractions.json", function(error, json) {
    if (error) return console.warn(error);

    data = json;
    force = d3.layout.force();

    // create the network and show the header and filters when it is loaded
    setNetwork();
    createFilters(["Insects", "Mammals", "Birds", "Plants", "Fungi", "Viruses", "Other"], data);
    createLegend();
    createLayoutButton();
    createSearchBox();
    showNumbers();
    createExplanation();
    createFooter();
    d3.select("#header").style("visibility", "visible");
    d3.select("#wrapper").style("visibility", "visible");

    // ask the user for some patience
    var loading = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "gray")
        .text("Simulating network. One moment please");

    // Use a timeout to allow the rest of the page to load first.
    setTimeout(function() {

        // Run the layout a fixed number of times.
        force.start();
        for (var i = 35; i > 0; --i) force.tick();
        force.stop();
        loading.remove();
    }, 3000);

});

var setNetwork = function() {
    width = window.innerWidth;
    height = window.innerHeight;

    // create a tooltip div for details on the nodes and links
    tooldiv = d3.select("body").append("div")
        .attr("class", "tooltip");

    // set zoom and panning behavior; source: http://bl.ocks.org/mbostock/6123708
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    function zoomed() {
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

    // set force layout for physics simulation
    force.nodes(currentNodes)
        .links(currentLinks)
        .size([width, height])
        .linkStrength(0.2)
        .distance(linkDistance)
        .charge(-8);

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.transition()
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });
};

var setLayout = function(layout, width, height) {
    if(layout == "cluster") {
        force.on("tick", tick)
            .linkStrength(0.001)
            .charge(-1.5)
            .start();

        function tick(e) {
            // Push different nodes in different directions for clustering
            // Source: http://bl.ocks.org/mbostock/1021841
            var k = 6 * e.alpha;
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


var filterNodesData = function() {
    removeDetails();
    var temp = currentNodes;
    var id = this.id;

    // depending on the state of the checkbox, add or remove the data in question
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
    currentLinks = filterLinkData(data, currentNodes)
    updateNetwork();
};

function filterLinkData(data, currentNodes) {
    // prepare data for links in the network;
    // source: http://stackoverflow.com/questions/23986466/d3-force-layout-linking-nodes-by-name-instead-of-index
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

var updateNetwork = function() {
    // redraw the network
    updateLinks(svg);
    updateNodes(svg);
    setLayout(layout, width, height);
    showNumbers();
};

function updateLinks(svg) {
    // remove existing links
    d3.select("#links").transition()
        .duration(500)
        .remove();

    // create the links
    var linksG = svg.append("g")
        .attr("id", "links");
    link = linksG.selectAll("line.link")
        .data(currentLinks);
    link.enter().append("line")
        .attr("class", "link")
        .attr("id", function(d) { return d.source + d.target } )
        .attr("x1", function(d) { return d.source.x })
        .attr("y1", function(d) { return d.source.y })
        .attr("x2", function(d) { return d.target.x })
        .attr("y2", function(d) { return d.target.y })
        .style("stroke", function(d) { return colorLinks(d.interaction) })
        .style("stroke-width", 2)
        .style("stroke-opacity", 0)
        .on("mouseover", function(d) {
            // show tooltip!
            tooldiv.transition()
                .duration(200)
                .style("opacity", ".8");
            tooldiv.html(d.source.speciesName + ' is a ' + d.interaction + ' of ' + d.target.speciesName)
                .style("left", (d3.event.x) + "px")
                .style("top", (d3.event.y - 30) + "px");

            // highlight individual link on hover
            if(highlight == 0 && linklight == 0) {
                d3.select(this).style("stroke-opacity", ".95");
            };
        })
        .on("mouseout", function(d) {
            // hide tooltip
            tooldiv.transition()
                .duration(500)
                .style("opacity", 0);

            // remove highlight
            if(highlight == 0 && linklight == 0) {
                d3.select(this).style("stroke-opacity", linkOpacity);
            };
        });
    link.transition()
        .delay(200)
        .style("stroke-opacity", linkOpacity);
    link.exit().remove();

};

function updateNodes(svg) {
    // manually add drag functionality back
    var drag = force.drag()
        .on("dragstart", dragstart);

    // remove existing nodes
    d3.select("#nodes").transition()
        .duration(500)
        .remove();

    // create the nodes to sit on top of the links
    var nodesG = svg.append("g")
        .attr("id", "nodes");
    node = nodesG.selectAll(".node")
        .data(currentNodes, function(d) { return d.id });
    node.enter().append("circle")
        .attr("class", "node")
        .attr("id", function(d) { return d.id })
        .attr("r", 3)
        .style("fill", function(d) { return colorNodes(d.group) })
        .style("opacity", nodeOpacity)
        .style("stroke", 1 )
        .style("stroke-width", 1.0)
        .on("mouseover", tooltipNode)
        .on("mouseout", hideTooltip)
        .on("click", function(d) { return connectedNodes(d.id) })
        .call(drag);

    function dragstart(d) {
        d3.event.sourceEvent.stopPropagation();
        d.fixed = true;
    }

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

    node.exit().remove();
};

highlight = 0; // Remember whether the highlighting and details are shown
function connectedNodes(id) {
    // show all relations of one individual node
    if (highlight == 0) {

        // select node
        var d = d3.select("[id='" + id + "']").node().__data__;
        showDetails(d);

        // reduce the opacity of all but this node
        node.style("opacity", function (o) {
            return d == o ? 1 : 0.2;
        });

        // store the neighbouring nodes in an array
        objects = [];

        // reduce the opacity of all but these links
        // and print details about the relationship
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
            return d == o.source || d == o.target ? 0.95 : 0.1;
        });

        // reduce the opacity of all neigbouring nodes
        objects.forEach(function(o) {
            d3.select("[id='" + o.id + "']")
                .style("opacity", 1);
        });
        // do not show numbers
        d3.select("#numbers").style("opacity", 0);

        // reset highlight to reset opacity
        highlight = 1;
    }
    else {
        removeDetails();
     };
};

function removeDetails() {
    // Put them back to original opacity
    node.style("opacity", nodeOpacity);
    link.style("stroke-opacity", linkOpacity);
    // show numbers again
    d3.select("#numbers").style("opacity", 0.7);
    // remove previous details
    d3.select("#details").remove();
    highlight = 0;
};

function showDetails(d) {
    var div = d3.select("body").append("div")
        .attr("id", "details");
    div.append("text")
        .style("font-size", "32px")
        .style("color", colorNodes(d.group))
        .text(d.speciesName)
    div.append("p")
        .style("font-size", "14px")
        .style("color", colorNodes(d.group))
        .text("(" + d.group + ")");
    div.append("p").text(d.path)
        .style("font-size", "10px");
};


var createFilters = function(speciesGroups, allData) {
    // create the filters/legend
    filterdiv = d3.select("body").append("div");
    filterdiv.attr("id", "filters")
        .attr("class", "legend")
        .append("p")
        .style("color", "gray")
        .text("Species groups:")
            .selectAll("input")
            .data(speciesGroups)
            .enter()
            .append("label")
                .attr("for", function(d) { return d; })
                .text(function(d) { return " " + d; })
                .style("font-weight", "bolder")
                .style("color", function(d) { return colorNodes(d) })
            .append("input")
                .attr("checked", true)
                .attr("type", "checkbox")
                .attr("id", function(d) { return d; })
                .on("click", filterNodesData);
};

var showNumbers = function() {
    d3.select("#numbers").remove();
    d3.select("body").append("div")
        .attr("id", "numbers")
        .append("p")
            .text(currentNodes.length + " species")
        .append("p")
            .text(currentLinks.length + " interactions");
};

linklight = 0; // remember whether links are highlighted
var createLegend = function () {
    var legend = d3.select("#filters").append("p")
        .append("text")
            .style("font-weight", "normal")
            .style("color", "gray")
            .text("Interaction types:")
        .selectAll("text")
        .data(colorLinks.domain())
        .enter()
        .append("text")
            .style("background-color", colorLinks)
            .style("color", "black")
            .style("font-weight", "bolder")
            .style("cursor", "pointer")
            .text(function(d) { return d + ";"; })
            .on("mouseover", function (entry) {
                // highlight corresponding links of interaction-type
                if(highlight == 0) {
                    linklight = 1;
                    link.style("stroke-opacity", function(o) {
                        return entry == o.interaction ? 0.8 : 0.05;
                    })
                };
            })
            .on("click", function() {
                // remove the highlight
                if(highlight == 0) {
                    linklight = 0;
                    link.style("stroke-opacity", linkOpacity)
                }
            });
}

var createLayoutButton = function() {
        filterdiv.append("input")
            .attr("class", "buttons")
            .attr("name", "cluster")
            .attr("type", "button")
            .attr("value", "Cluster")
            .on("click", function() {
                if(layout == "force") {
                    d3.select(this).attr("value", "Disperse")
                    layout = "cluster"
                    setLayout("cluster", width, height);
                }
                else if(layout == "cluster") {
                    d3.select(this).attr("value", "Cluster")
                    layout = "force"
                    setLayout("force", width, height);
                };
            });
};

var createSearchBox = function() {
    // make the input box
    d3.select("body").append("div")
        .attr("id", "search-box")
        .append("label")
            .attr("for", "search")
        .append("input")
            .attr("id", "search")
            .attr("placeholder", "Search network..");

    // make the 'go' button
    d3.select("#search-box").append("input")
        .attr("class", "buttons")
        .attr("type", "button")
        .attr("value", "Go")
        .on("click", function() {
            // get node id and highlight the connectedNodes by search term
            var selectedVal = document.getElementById('search').value;
            data.nodes.forEach(function(object) {
                if(object["speciesName"] == selectedVal) {
                    connectedNodes(object.id);
                };
            });
        });

    // get a list of species names as search options autocomplete
    var optArray = [];
    for (var i = 0; i < currentNodes.length - 1; i++) {
        optArray.push(currentNodes[i].speciesName);
    }
    optArray = optArray.sort();
    $(function () {
        $("#search").autocomplete({
            source: optArray
        });
    });
};

var createExplanation = function() {
    d3.select("body").append("div")
        .attr("id", "text")
        .append("p").html("<br>HOW TO:<br><br>Click on a node to get details<br>Click on the 'Cluster' button to regroup the data<br>Select the checkboxes to show certain data<br>Hover over the 'Interaction types' legend to highlight them<br>...and click on it to see all of them again.<br><br>Have fun exploring!<br><br><br><br>")
        .append("p").html("SOME BACKGROUND TO THIS BIOTIC INTERACTIONS VISUALISATION<br><br>Animals, plants, fungi and bacteria all over the world interact in different ways and over micro-scale to global distances. Many species specific research papers on these interactions have been published, but in order to get an overview of what data is already available and how a system of interactions or an ecosystem functions, it is important to combine these results into one visualisation. Note that the data used for the visalisation certainly does not contain all interactions and species currently known. This is however published data from scientific research.")
        .append("p").html("I made this visualisation of the GloBi dataset as a final project for the Minor Programming at the University of Amsterdam, thus combining my background in Biology (I'll be a MSc in this subject in a couple of days!) with my new skills in programming.")
        .append("p").html("The data used for this visualisation is not mine, but is from the GloBi project: Poelen, J. H., Simons, J. D., & Mungall, C. J. (2014). Global Biotic Interactions: An open infrastructure to share and analyze species-interaction datasets. Ecological Informatics. <a href=http://www.sciencedirect.com/science/article/pii/S1574954114001125 target=_blank>doi:10.1016/j.ecoinf.2014.08.005</a><br><br><br>");
};

var createFooter = function() {
    d3.select("body").append("div")
        .attr("id", "footer")
        .html("This project is created with data from the <a href=http://www.globalbioticinteractions.org/ target=_blank>Global Biotic Interactions project</a> by Encyclopedia of Life (EOL) <br> and with the use of the <a href=https://github.com/mbostock/d3/ target=_blank>D3</a> JavaScript library. <br><br> Copyright (c) 2016 Anneke ter Schure");
};
