//--------------------------------
// by: Anneke ter Schure, 6084087
//
// make localhost server: python -m SimpleHTTPServer
// use url: http://localhost:8000/index.html
//
// data obtained from: http://api.globalbioticinteractions.org/interaction?bbox=3.36,50.75,7.23,53.59
// http://api.globalbioticinteractions.org/interaction?type=json.v2
//--------------------------------
d3.json("/Data/bioInteractions.json", function(error, json) {
    if (error) return console.warn(error);
    data = json;
    force = d3.layout.force();
    setNetwork();
    d3.select("#header").style("visibility", "visible");
    d3.select(".filters").style("visibility", "visible");

    var speciesGroups = ["Insects", "Mammals", "Birds", "Plants", "Fungi", "Viruses", "Other"];
    createFilters(speciesGroups, data);
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
    filterdiv.text("FILTERS: ")
        .attr("class", "filters");
};

var createFilters = function(speciesGroups, allData) {
    d3.select(".filters").selectAll("input")
        .data(speciesGroups)
        .enter()
        .append("label")
            .attr("for", function(d) { return d; })
            .text(function(d) { return d; })
            .style("color", "white")
        .append("input")
            .attr("checked", true)
            .attr("type", "checkbox")
            .attr("id", function(d) { return d; })
            .on("click", function (d) { return updateNetwork(); });
};

var setNetwork = function() {
    width = window.innerWidth;
    height = window.innerHeight;

    // create new div element containing svg element for the network
    d3.select("body").append("div")
        .attr("id", "interactions")
            .attr("width", width)
            .attr("height", height);

    svg = d3.select("#interactions").append("svg")
        .attr("class", "network")
            .attr("width", width)
            .attr("height", height);

    // show all species and inderactions
    currentNodes = data.nodes;
    currentLinks = filterLinkData(data.links);
    updateLinks(svg);
    updateNodes(svg);
    // layout can be "force", "cluster" or "radial"
    setLayout("cluster", width, height);
};

var setLayout = function(layout, width, height) {
    // set force layout for physics simulation
    force.nodes(currentNodes)
        .links(currentLinks)
        .size([width, height]);

    if(layout == "radial") {
        var groups = sortedGroups(currentNodes, currentLinks);
        var center = { "x":width/2, "y":height/2 };
        var radius = 300;
        var increment = 18;
        makeRadial(center, radius, increment, groups);
        force.on("tick", radialTick)
            // .charge(function(node) { return -Math.pow(node.radius, 2.0) / 2 })
            .start();

        var radialTick = function(e) {
            node.each(moveToRadialLayout(e.alpha));
            node.attr("cx", function(d) { return d.x;})
                .attr("cy", function(d) { return d.y;});
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            if(e.alpha < 0.03) {
                force.stop();
                return updateLinks();
            }

        };
        var moveToRadialLayout = function(alpha) {
            var k;
	        k = alpha * 0.1;
	        return function(d) {
                var centerNode;
		        centerNode = groupCenters(groupBy(d));
		        d.x += (centerNode.x - d.x) * k;
		        return d.y += (centerNode.y - d.y) * k;
	        };
        };
    }
    else if(layout == "cluster") {
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

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
        };
    }
    else {
        force.distance(40)
            .charge(-10)
            .start();

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

var updateNetwork = function() {
    currentNodes = filterNodeData();
    currentLinks = filterLinkData();
    updateLinks(svg);
    updateNodes(svg);
    // layout can be "force" or "radial"
    setLayout("force", width, height);
};

function filterNodeData() {
    filteredNodes = [];

    d3.selectAll("input").on("change", function() {
        console.log("checked:", this.checked)
        var id = this.id
        console.log(id)

        if(this.checked) {
            var selection = [];
            currentNodes.filter( function(entry) {
                selection = entry.group === id;
            });
            return currentNodes.concat(selection);
        }
        else {
            currentNodes.filter( function(entry) {
                return entry.group !== id;
            });
        };
    });
    console.log("Filtered: ", filteredNodes);
    return filteredNodes;
};

function filterLinkData() {
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
    d3.select("#links").remove();

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
        .style("stroke-opacity", ".1")
        .on("mouseover", function(d) {
            // show tooltip!
            tooldiv.transition()
                .duration(200)
                .style("opacity", '.8');
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

            // reduce the opacity of all but the neighbouring nodes
            node.style("opacity", function (o) {
                return d == o ? 1 : 0.1;
            });
            objects = [];

            link.style("opacity", function (o) {
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
            objects.forEach(function(o) {
                d3.select("[id='" + o.id + "']")
                    .style("opacity", 1);
            });
            // reset highlight to reset opacity
            highlight = 1;
        }
        else {
            // Put them back to opacity = 1
            node.style("opacity", 1);
            link.style("opacity", 1);
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

function makeRadial(center, radius, increment, keys) {
    console.log("Radial:", increment)
    // store key-location values and set layout
    var values = d3.map();
    var startAngle = -120;
    var currentAngle = startAngle;
    setKeys();

    // create layout depending on keys
    function setKeys() {
        console.log("Setting the keys...", keys)
        values = d3.map();
        var numberInner = 360 / increment
        if(keys.length < numberInner) {
            increment = 360 / keys.length;
            console.log(increment);
        };
        var innerKeys = keys.slice(0, numberInner);
        innerKeys.forEach(function(k) { return place(k); });

        // setup outer circle
        var outerKeys = keys.slice(numberInner);
        radius = radius + radius / 1.8;
        increment = 360 / outerKeys.length
        outerKeys.forEach(function(k) { return place(k); });
    }

    // Get new location for key
    function place(key) {
        console.log("Setting the place...")
        var value = radialLocation(center, currentAngle, radius);
        values.set(key,value);
        currentAngle += increment;
        return value;
    }

    // Get a radial position given a certain angle
    function radialLocation(center, angle, radius) {
        console.log("Getting radial position...")
        var x = (center.x + radius * Math.cos(angle * Math.PI / 180));
        var y = (center.y + radius * Math.sin(angle * Math.PI / 180));
        return { "x":x, "y":y };
    }
}

function sortedGroups(nodes, links) {
    // return an array of group values
    var groups = [];
    var counts = {};
    links.forEach(function(l) {
        var _name, _name1;
    	if (counts[_name = l.source.group] == null) {
    		counts[_name] = 0;
    	}
        else {counts[l.source.group] += 1;};
    	if (counts[_name1 = l.target.group] == null) {
    		counts[_name1] = 0;
    	}
    	else {counts[l.target.group] += 1;};
    });
    nodes.forEach(function(n) {
        var _name;
	    return counts[_name = n.group] != null ? counts[_name] : counts[_name] = 0;
    });
    groups = d3.entries(counts).sort( function (a,b) {
        return b.value - a.value
    });
    groups = groups.map(function(v) { return v.key; });
    return groups;
};
