# Day 1
Finding a nice subject and an open source dataset to use for the project. The dataset I found is already used for a simple visualisation showing only the direct connections around one specific species. I feel that that is not a good representation of the dataset or what it stands for, namely that almost everything on earth is interconnected. Therefore I will aim to use the data to show exactly that and subsequently allow the user to select and zoom in on the data.

There are several visualisation types that can be used for this:
* [A bundle diagram](http://mbostock.github.io/d3/talk/20111116/bundle.html)
* [A chord diagram](http://sdk.gooddata.com/gooddata-js/example/chord-chart-to-analyze-sales/)
* [A network map](http://christophergandrud.github.io/networkD3/)
* [A sankey diagram](http://bost.ocks.org/mike/sankey/); note: here I'll need the biomass data per species group.. which might be a cool extra feature but not the main focus.

As the dataset contains data for many different species and many interactions; it may be wise to focus on a standard network map with filtering options such as habitat and the type of interactions.

![](doc/NetworkSketch.jpg =200)

# Day 2
Setting up folder structure and deciding what data is needed. Ideally, the user may be allowed to filter on the specific species, their habitat or their interactions. That means that per species there should be a JSON object containing this information, however due to the size of the dataset it may be better to use the API.
Made some more sketches.

![](doc/BundleSketch.jpg =200)

# Day 3
Fiddling with an example d3 source code from https://github.com/jhpoelen/eol-globi-js/blob/master/examples
but is very slow - possibly due to API as loading time changes when I change search query - so definitely going to make my own JSON file and minimise the size.

![](doc/BipartiteFiddle.png =200)
