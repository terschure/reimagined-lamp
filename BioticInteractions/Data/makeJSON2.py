# Makes a JSON of the AllInteractions.csv file
# Seperating the nodes (the species) from the links (interactions)
# five types of interactions can be distinguished between:
#  1. species A is a parasiteOf species B
#  2. species A is a pathogenOf species B
#  3. species A pollinates species B
#  4. species A preysOn species B
#  5. species A is a vectorOf species B
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
links = []

# loop through readfile and copy modify only needed data
for each in reader:
    # skip headers and 'no:match' data
    if each['sourceID'] != "source_taxon_external_id" and each['sourceID'] != 'no:match' and each['targetID'] != 'no:match' and each['sourceName'] != 'no name':
        # make new object if species is not yet in nodes list
        if each['sourceID'] not in nodes:
            data = {}
            data['id'] = each['sourceID']
            data['speciesName'] = each['sourceName']
            data['path'] = each['sourcePath']

            # differentiate groups according to taxonomy
            if 'Insecta' in each['sourcePath']:
                data['group'] = 'Insects'
            elif 'Mammalia' in each['sourcePath']:
                data['group'] = 'Mammals'
            elif 'Plantae' in each['sourcePath']:
                data['group'] = 'Plants'
            elif 'Fungi' in each['sourcePath']:
                data['group'] = 'Fungi'
            elif 'Viruses' in each['sourcePath']:
                data['group'] = 'Viruses'
            elif 'Aves' in each['sourcePath']:
                data['group'] = 'Birds'
            else:
                data['group'] = 'remaining'

            if data not in nodes:
                nodes.append(data)
        if each['targetID'] not in nodes:
            data = {}
            data['id'] = each['targetID']
            data['speciesName'] = each['targetName']
            data['path'] = each['targetPath']

            # differentiate groups according to taxonomy
            if 'Insecta' in each['targetPath']:
                data['group'] = 'Insects'
            elif 'Mammalia' in each['targetPath']:
                data['group'] = 'Mammals'
            elif 'Plantae' in each['targetPath']:
                data['group'] = 'Plants'
            elif 'Fungi' in each['targetPath']:
                data['group'] = 'Fungi'
            elif 'Viruses' in each['targetPath']:
                data['group'] = 'Viruses'
            elif 'Aves' in each['targetPath']:
                data['group'] = 'Birds'

            if data not in nodes:
                nodes.append(data)

        # add interaction to corresponding lists
        data = {}
        data['source'] = each['sourceID']
        data['target'] = each['targetID']
        if each['interactionType'] == "parasiteOf":
            data['interaction'] = 'parasite'
        elif each['interactionType'] == "pathogenOf":
            data['interaction'] = 'pathogen'
        elif each['interactionType'] == "pollinates":
            data['interaction'] = 'pollinator'
        elif each['interactionType'] == "preysOn":
            data['interaction'] = 'predator'
        elif each['interactionType'] == "vectorOf":
            data['interaction'] = 'vector'
        if data not in links:
            links.append(data)

datapoints["nodes"] = nodes
datapoints["links"] = links

# make outputfile
with open('bioInteractions2.json', 'w') as outfile:
     json.dump(datapoints, outfile, sort_keys = True, indent = 4,
     ensure_ascii=False)
