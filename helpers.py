#!/usr/bin/env python
"""Helper functions to communicate with the City of Los Angeles API and the
    Google Maps API.

    City of LA Parking Meter API endpoint:
        https://data.lacity.org/resource/e7h6-4a3e.json

    Parking Meter Inventory (location data) API endpoint:
        https://data.lacity.org/resource/s49e-q6j2.json

"""

import json
import pandas as pd
import psycopg2
from sodapy import Socrata

from config import config
from flask import render_template, jsonify
# from settings import *

def connect():
    """ Connect to the PostgreSQL database server

    Args:
        N/A

    Retuns:
        A connection to the database.
    """
    conn = None
    try:
        # read connection parameters
        params = config()

        # connect to the PostgreSQL server
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(**params)

        # create a cursor
        # cur = conn.cursor()

        # execute a statement
        # print("PostgreSQL database version: ")
        # cur.execute("SELECT version()")

        # # display the PostgreSQL database server version
        # db_version = cur.fetchone()
        # print(db_version)

        # # close the communication with the PostgreSQL server
        # cur.close()
        # print("Closed connection to the PostgreSQL database...")

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    # finally:
    #     if conn is not None:
    #         conn.close()
    #         print("Closed connection to the PostgreSQL database...")

    return conn

def create_tables():
    """ Create tables in the PostgreSQL database. """
    commands = [
        # "CREATE TABLE inventory (meter_id VARCHAR(10) NOT NULL, latitude DECIMAL NOT NULL, longitude DECIMAL NOT NULL)"
        """  CREATE TABLE inventory (
            space_id VARCHAR(10) NOT NULL,
            blockface VARCHAR(256),
            meterType VARCHAR(20),
            rateType VARCHAR(16),
            rateRange VARCHAR(50),
            meteredTimeLimit INTEGER,
            parkingPolicy VARCHAR(256),
            streetCleaning VARCHAR(128),
            latitude NUMERIC,
            longitude NUMERIC
            ) """
    ]
    conn = None
    try:
        # read the connection parameters
        params = config()
        # connect to the PostgreSQL server
        conn = psycopg2.connect(**params)
        print("Database connection opened")
        cur = conn.cursor()

        # get the updated list of tables
        sqlGetTableList = "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public';"
        cur.execute(sqlGetTableList)
        tables = cur.fetchall()
        if ('public', 'inventory') not in tables:
            # create a table one-by-one
            for command in commands:
                cur.execute(command)
            # commit the changes
            conn.commit()

        # close communication with the PostgreSQL database server
        cur.close()
        print("Closed connection to the PostgreSQL database...")

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Closed connection to the PostgreSQL database...")

def insert_inventory():
    """ Insert data into a PostgreSQL table. """
    commands = ["""INSERT INTO inventory (meter_id, latitude, longitude)"""]
    conn = None
    try:
        # read the connection parameters
        params = config()
        # connect to the PostgreSQL server
        conn = psycopg2.connect(**params)
        print("Database connection opened")
        cur = conn.cursor()
        # execute SQL commands
        for command in commands:
            cur.execute(command)
        # commit changes
        conn.commit()
        # close communication with the PostgreSQL database server
        cur.close()
        print("Closed connection to the PostgreSQL database...")
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Closed connection to the PostgreSQL database...")

def get_all_meters():
    """ Query the PostgreSQL database for all parking meter information. """
    # Get id and coordinates of all parking meters
    conn = None
    try:
        params = config()
        conn = psycopg2.connect(**params)
        print("Database connection opened")
        cur = conn.cursor()
        cur.execute("SELECT space_id, latitude::float, longitude::float FROM inventory")
        result = cur.fetchall()
        meters = {}
        for i in range(len(result)):
            meters[result[i][0]] = {'space_id': result[i][0], 'lat': result[i][1], 'lng': result[i][2]}
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed")
    return meters

def get_vacant_meters():
    """ Query the Socrata API for all vacant parking meter information. """
    # Get id and coordinates of all vacant parking meters
    # Authenticated client
    client = Socrata("data.lacity.org",
                    SODA_app_token,
                    username=SODA_username,
                    password=SODA_pwd)

    # Return JSON from API / converted to Python list of dictionaries by sodapy of
    # vacant parking meters
    vacant_ids = client.get("e7h6-4a3e", occupancystate="VACANT")

    # Get id and coordinates of all parking meters
    conn = None
    vacant_meters = {}
    try:
        params = config()
        conn = psycopg2.connect(**params)
        print("Database connection opened")
        cur = conn.cursor()
        for space in vacant_ids:
            cur.execute("SELECT COUNT(*) FROM inventory WHERE space_id=%s", (space['spaceid'],))
            res = cur.fetchone()
            if res[0] != 0:
                cur.execute("SELECT space_id, latitude::float, longitude::float, "
                            "blockface, metertype, ratetype, raterange, "
                            "meteredtimelimit, parkingpolicy, streetcleaning "
                            "FROM inventory WHERE space_id=%s", (space['spaceid'],))
                result = cur.fetchone()
                # print(result)
                vacant_meters[result[0]] = {'space_id': result[0], 'lat': result[1], 
                    'lng': result[2], 'blockface': result[3], 'metertype': result[4], 
                    'ratetype': result[5], 'raterange': result[6], 
                    'meteredtimelimit': result[7], 'parkingpolicy': result[8], 
                    'streetcleaning': result[9]}
        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:        
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed")

    print("Number of vacant parking meters: " + str(len(vacant_meters)))

    return vacant_meters

def plot_data(data):
    """ Create a plot the given datapoints onto the base Google Map.

    Args:
        data (tuple): (latitude, longitude)

    Retuns:
        A plot of parking meter locations on a base Google Map.
    """

    # Generate base Google Map
    gmap = gmplot.GoogleMapPlotter(34.05223, -118.24368, 16)
    # gmap.plot(latitudes, longitudes)

    gmap.scatter(data[0], data[1], '#FF0000', size=1, marker=False)

    gmap.draw('./templates/mapLA.html')


# JSON test
# with open("settings.json") as f:
#     my_dict = json.load(f)
# print(my_dict["app_token"])
