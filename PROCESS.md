# Day 1
Finding a nice subject and an open source dataset to use for the project. The dataset I found is already used for a simple visualisation showing only the direct connections around one specific species. I feel that that is not a good representation of the dataset or what it stands for, namely that almost everything on earth is interconnected. Therefore I will aim to use the data to show exactly that and subsequently allow the user to select and zoom in on the data.

There are several visualisation types that can be used for this:
* [A bundle diagram](http://mbostock.github.io/d3/talk/20111116/bundle.html)
* [A chord diagram](http://sdk.gooddata.com/gooddata-js/example/chord-chart-to-analyze-sales/)
* [A network map](http://christophergandrud.github.io/networkD3/)
* [A sankey diagram](http://bost.ocks.org/mike/sankey/); note: here I'll need the biomass data per species group.. which might be a cool extra feature but not the main focus.

As the dataset contains data for many different species and many interactions; it may be wise to focus on a standard network map with filtering options such as habitat and the type of interactions.

![](doc/NetworkSketch.jpg)

# Day 2
Setting up folder structure and deciding what data is needed. Ideally, the user may be allowed to filter on the specific species, their (taxonomic) kingdom, their habitat or their interactions. That means that per species there should be a JSON object containing this information, however due to the size of the dataset it may be better to use the API.
Made some more sketches.

![](doc/BundleSketch.jpg)

# Day 3
Fiddling with an example d3 source code from https://github.com/jhpoelen/eol-globi-js/blob/master/examples
but is very slow - possibly due to API as loading time changes when I change search query - so definitely going to make my own JSON file and minimise the size.

![](doc/BipartiteFiddle.png)

# Day 4
Decided to not use the JSON format provided by the [API](http://api.globalbioticinteractions.org/interaction?type=json.v2) as atom tends to crash. Instead I downloaded the CSV files for each 'active' interaction type; e.g. the interaction type "isParasiteOf" instead of "hasParasite" via the API like this: http://api.globalbioticinteractions.org/interaction?interactionType=isParasiteOf&type=csv. This halves the amount of data without actually losing interactions.

# Day 5
Mainly got stuck on creating the nodes and links in d3 and adding a force layout.

# Day 6
Found a probable explanation for my troubles with plotting the data in a network, namely dataset issues such as interactions (links) in which one of the species (source or target) has no id. Therefore I made a small test.json file to continue making a network visualisation, implementing a force layout and creating a tooltip.
![](doc/TestNetwork.png)

# Day 7
Finally fixed the dataset! There was one tiny link that led to a node that wasn't there. Also added a tooltip to the edges/links. ![](doc/FirstBigNetwork.png)
