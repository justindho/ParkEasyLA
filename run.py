from flask import Flask, render_template, jsonify
from helpers import *
from settings import *
import json
import matplotlib.pyplot as plt
import pandas as pd
import psycopg2
from sodapy import Socrata

app = Flask(__name__)

# Authenticated client
client = Socrata("data.lacity.org",
                  SODA_app_token,
                  username=SODA_username,
                  password=SODA_pwd)

# Return JSON from API / converted to Python list of dictionaries by sodapy of 
# vacant parking meters
vacant_meters = None
while (vacant_meters == None):
    vacant_meters = client.get("e7h6-4a3e", occupancystate="VACANT")
# try:
#     vacant_meters = client.get("e7h6-4a3e", occupancystate="VACANT")
# except:
#     print("Timeout occurred")

# Convert to pandas DataFrame
results_df = pd.DataFrame.from_records(vacant_meters)
# print(results_df.head())
# print(results_df.iloc[0])
# print(type(results_df.iloc[0]))
# print("type of spaceid: " + str(type(results_df.iloc[0]['spaceid'])))
# print("Number of vacant parking meters: " + str(results_df.shape[0]))

# Get coordinates of vacant parking meters
# query for lat/lng coordinates using spaceid in postgreSQL db
lat_lng = []
try:
    params = config()
    conn = psycopg2.connect(**params)
    cur = conn.cursor()
    result1 = results_df.iloc[0]
    spaceid = result1['spaceid']    
    cur.execute("SELECT latitude::float, longitude::float FROM inventory WHERE space_id='%s';" % spaceid)
    result = cur.fetchall()           
    for i in range(len(result)):
        lat_lng.append((result[i][0], result[i][1]))      
    cur.close()    
except (Exception, psycopg2.DatabaseError) as error:    
    print(error)
finally:
    if conn is not None:
        conn.close()
        print("Database connection closed")



# lat_lng = []
# for i in range(results_df.shape[0]):
#     lat_lng.append((results_df.iloc[i]))

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
    """ Landing page for search """        

    return render_template("home.html")
      
    # for i in range(len(latitudes)):
    #     gmap.marker(latitudes[i], longitudes[i], title="sampleText")


    # gmap.apikey = GMAP_API_KEY

    # plot_data(get_all_meters())
    # plot_data(lat_lng[0])
    # return render_template("mapLA.html")

@app.route('/vacantMeters')
def vacancies():
    """ Get vacant parking meters """
    
    return jsonify(get_vacant_meters())

@app.route('/allMeters')
def all_meters():
    """ Get all parking meters """
    meter_data = get_all_meters()
    return jsonify(meter_data)