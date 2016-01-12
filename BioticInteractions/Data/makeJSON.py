# Makes a JSON of the AllInteractions.csv file
# Seperating the nodes (the species) from the links (interactions)
# five types of interactions can be distinguished between:
#  1. species A is a parasiteOf species B
#  2. species A is a pathogenOf species B
#  3. species A pollinates species B
#  4. species A preysOn species B
#  5. species A is a vectorOf species B
#
# TODO: make sure there are no double species!!
# Made by Anneke ter Schure

# imports
import csv
import json

# open and read datafile
fieldnames = ['sourceID', 'sourceName', 'sourcePath', 'interactionType',
        'targetID', 'targetName', 'targetPath']
datafile = open('AllInteractions.csv', 'r')
reader = csv.DictReader(datafile, fieldnames)

# initialise data lists
datapoints = {}
nodes = []
parasites = []
pathogens = []
pollinators = []
predators = []
vectors = []

# loop through readfile and copy modify only needed data
for each in reader:
    # skip headers
    if each['sourceID'] != "source_taxon_external_id":
        # add interaction to corresponding lists
        # print each
        if each['interactionType'] == "parasiteOf":
            data = {}
            data['source'] = each['sourceID']
            data['target'] = each['targetID']
            if data not in parasites:
                parasites.append(data)
        elif each['interactionType'] == "pathogenOf":
            data = {}
            data['source'] = each['sourceID']
            data['target'] = each['targetID']
            if data not in pathogens:
                pathogens.append(data)
        elif each['interactionType'] == "pollinates":
            data = {}
            data['source'] = each['sourceID']
            data['target'] = each['targetID']
            if data not in pollinators:
                pollinators.append(data)
        elif each['interactionType'] == "preysOn":
            data = {}
            data['source'] = each['sourceID']
            data['target'] = each['targetID']
            if data not in predators:
                predators.append(data)
        elif each['interactionType'] == "vectorOf":
            data = {}
            data['source'] = each['sourceID']
            data['target'] = each['targetID']
            if data not in vectors:
                vectors.append(data)

        # make new object if species is not yet in datapoints
        if each['sourceID'] not in datapoints:
            data = {}
            data['id'] = each['sourceID']
            data['speciesName'] = each['sourceName']
            data['path'] = each['sourcePath']
            nodes.append(data)
        elif each['targetID'] not in datapoints:
            data = {}
            data['id'] = each['targetID']
            data['speciesName'] = each['targetName']
            data['path'] = each['targetPath']
            nodes.append(data)

datapoints["Nodes"] = nodes
datapoints["Parasites"] = parasites
datapoints["Pathogens"] = pathogens
datapoints["Pollinators"] = pollinators
datapoints["Predators"] = predators
datapoints["Vectors"] = vectors

# make outputfile
with open('bioInteractions.json', 'w') as outfile:
     json.dump(datapoints, outfile, sort_keys = True, indent = 4,
     ensure_ascii=False)