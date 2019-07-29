#!/usr/bin/env python
"""Helper functions to communicate with the City of Los Angeles API and the
    Google Maps API.

    City of LA Parking Meter API endpoint:
        https://data.lacity.org/resource/e7h6-4a3e.json

    Parking Meter Inventory (location data) API endpoint:
        https://data.lacity.org/resource/s49e-q6j2.json

"""

import geopandas as gpd
import gmplot
import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import pygmaps

# JSON test
with open("settings.json") as f:
    my_dict = json.load(f)
print(my_dict["app_token"])

# Import parking meter location data
inventory = pd.read_csv('Parking_Meter_Inventory.csv')
lat_lng = inventory['LatLng']

# Retrieve coordinates of parking meters
latitudes = []
longitudes = []
count = 0
for pair in lat_lng:
    coord = pair.replace('(', '').replace(')', '').split(', ')
    latitudes.append(float(coord[0]))
    longitudes.append(float(coord[1]))

# Retrieve data for each parking meter
time_limit = inventory['MeteredTimeLimit']
rate_range = inventory['RateRange']


# Generate base Google map
# Because Google Maps is not a free service, an API key is needed. Without an
# API key, the map will have a "For Development Purpose Only" overlay on the
# screen and will have low resolution.
gmap = gmplot.GoogleMapPlotter(34.05223, -118.24368, 12)
# gmap.plot(latitudes, longitudes)
gmap.scatter(latitudes, longitudes, '#FF0000', size=40, marker=False)
# gmap.apikey = GMAP_API_KEY
gmap.draw('./mapLA.html')