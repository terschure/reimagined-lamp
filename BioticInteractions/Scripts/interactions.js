//--------------------------------
// by: Anneke ter Schure, 6084087
//
// make localhost server: python -m SimpleHTTPServer
// use url: http://localhost:8000/index.html
//
// data obtained from: http://api.globalbioticinteractions.org/interaction?bbox=3.36,50.75,7.23,53.59
// http://api.globalbioticinteractions.org/interaction?type=json.v2
//--------------------------------
force = d3.layout.force();

d3.json("/Data/bioInteractions.json", function(error, json) {
    if (error) return console.warn(error);
    data = json;
    Network(data);
    d3.select("#header").style("visibility", "visible");
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

    // filterdiv = d3.select("body").append("div");
    // filterdiv.append("input").attr("type", "checkbox")
    //     .attr("id", "group")
    //     .attr("class", "filters")
    //     .html("checkbox");
};

var Network = function(data) {
    // set properties; set layout to "radial" for a radial layout TODO
    var layout = "force";
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

    // create new div element containing svg element for the network
    d3.select("body").append("div")
        .attr("id", "interactions")
            .attr("width", width)
            .attr("height", height);

    var svg = d3.select("#interactions").append("svg")
        .attr("class", "network")
            .attr("width", width)
            .attr("height", height);

    Update();
    updateLinks(svg, currentLinks);
    updateNodes(svg, currentNodes);

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

var Update = function() {
    currentNodes = filterNodeData(data.nodes);
    currentLinks = filterLinkData(data.links, currentNodes);
};

function filterNodeData(allNodes) {
    var filteredNodes = allNodes;
    filteredNodes = allNodes.filter( function(entry) {
        return entry.group === 'Fungi'|| entry.group === 'Plants' || entry.group === 'Viruses';
    });
    return filteredNodes;
};

function filterLinkData(allLinks, currentNodes) {
    // prepare data for links in the network
    var edges = [];
    allLinks.forEach(function(e) {
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

function updateLinks(svg, data) {
    // var filteredData = [];
    // data.forEach(function(e) {
    //     if(e.source != 'undefined' && e.target != 'undefined') { filteredData.push(e) }
    // });

    // create the links
    var linksG = svg.append("g")
        .attr("id", "links");
    link = linksG.selectAll("line.link")
        .data(data);
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
        .style("stroke-opacity", ".5")
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

function updateNodes(svg, data) {
    // create the nodes to sit on top of the links
    var nodesG = svg.append("g")
        .attr("id", "nodes");
    node = nodesG.selectAll(".node")
        .data(data, function(d) { return d.id });
    node.enter().append("circle")
        .attr("class", "node")
        .attr("id", function(d) { return d.id })
        .attr("r", 3)
        .style("fill", function(d) {
            if (d.group == 'Insecta') { return "steelblue" }
            else if (d.group == 'Mammals') { return "red" }
            else if (d.group == 'Plants') { return "green" }
            else if (d.group == 'Fungi') { return "white" }
            else if (d.group == 'Viruses') { return "purple" }
            else if (d.group == 'Birds') { return "orange" }
            else { return "grey" }
        })
        .style("stroke", 1 )
        .style("stroke-width", 1.0)
        .call(force.drag)
        .on("mouseover", tooltipNode)
        .on("mouseout", function(d) {
            // hide tooltip
            tooldiv.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("dblclick", connectedNodes);

    function tooltipNode() {
        var d = d3.select(this).node().__data__;
        // show tooltip!
        tooldiv.transition()
            .duration(200)
            .style("opacity", '.8');
        tooldiv.html(d.speciesName)
            .style("left", (d3.event.x) + "px")
            .style("top", (d3.event.y - 30) + "px");
    };

    // Remember whether the highlighting is on
    var highlight = 0;
    function connectedNodes() {
        // show links of one individual node
        if (highlight == 0) {
            //Reduce the opacity of all but the neighbouring nodes
            var d = d3.select(this).node().__data__;
            tooltipNode;
            node.style("opacity", function (o) {
                return d == o ? 1 : 0.1;
            });
            link.style("opacity", function (o) {
                return d == o.source | d == o.target ? 1 : 0.1;
            });

            //Reduce the op
            highlight = 1;
        } else {
            //Put them back to opacity=1
            node.style("opacity", 1);
            link.style("opacity", 1);
            highlight = 0;
        }
    };
    node.exit().remove();
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
