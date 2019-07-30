from flask import Flask, render_template
from helpers import *
from settings import *
import geopandas as gpd
import gmplot
import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import psycopg2
import pygmaps
from sodapy import Socrata
# import sqlite, csv

app = Flask(__name__)

# Unauthenticated client only works with public data sets. Note 'None' in place 
# of application token, and no username or password:
# client = Socrata("data.lacity.org", None)

# Example authenticated client (needed for non-public datasets):
# client = Socrata(data.lacity.org,
#                   MyAppToken,
#                   username="user@example.com"
#                   password="password")

# First 2000 results, returned as JSON from API / converted to Python list of 
# dictionaries by sodapy.
# results = client.get("e7h6-4a3e", limit=2000)

# Convert to pandas DataFrame
# results_df = pd.DataFrame.from_records(results)

# Create PostgreSQL tables
create_tables()

# Import parking meter inventory data
inventory_file = 'Parking_Meter_Inventory_RAW.csv'
# inventory = pd.read_csv(inventory_file)

# Retrieve data for each parking meter
# latitudes = inventory['Latitude']
# longitudes = inventory['Longitude']
# time_limits = inventory['MeteredTimeLimit']
# rate_ranges = inventory['RateRange']

# Insert parking meter inventory data into PostgreSQL table
# insert_inventory()
# commands = [r"""COPY inventory FROM 'C:/Users/justi/Documents/Projects/ParkEasyLA/Parking_Meter_Inventory(RAW).csv' DELIMITER ',' CSV"""]
# conn = None
# try:
#     # read the connection parameters
#     params = config()
#     # connect to the PostgreSQL server
#     print("Connecting to the PostgreSQL database...")
#     conn = psycopg2.connect(**params)
#     cur = conn.cursor()
#     # execute SQL commands
#     for command in commands:
#         cur.execute(command)
#     # commit changes
#     conn.commit()
#     # close communication with the PostgreSQL database server
#     cur.close()        
# except (Exception, psycopg2.DatabaseError) as error:
#     print(error)
# finally:
#     if conn is not None:
#         conn.close()

@app.route('/')
def main():
    """Landing page for search"""

    # Get id and coordinates of all parking meters
    conn = None
    ids = []
    latitudes = []
    longitudes = []
    try:
        params = config()
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        cur.execute("SELECT space_id, latitude::float, longitude::float FROM inventory")
        result = cur.fetchall()        
        for i in range(len(result)):
            ids.append(result[i][0])
            latitudes.append(result[i][1])
            longitudes.append(result[i][2])
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed")


    # Generate base Google Map
    gmap = gmplot.GoogleMapPlotter(34.05223, -118.24368, 12)
    # gmap.plot(latitudes, longitudes)

    gmap.scatter(latitudes, longitudes, '#FF0000', size=1, marker=False)
    
    # for i in range(len(latitudes)):
    #     gmap.marker(latitudes[i], longitudes[i], title="sampleText")


    # gmap.apikey = GMAP_API_KEY

    # gmap.draw('./templates/sample.html')
    # return render_template("sample.html")
    gmap.draw('./templates/mapLA.html')
    return render_template("mapLA.html")