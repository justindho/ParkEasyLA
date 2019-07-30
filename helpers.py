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
import psycopg2
import pygmaps

from config import config

def connect():
    """ Connect to the PostgreSQL database server """
    conn = None
    try:
        # read connection parameters
        params = config()

        # connect to the PostgreSQL server
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(**params)

        # create a cursor
        cur = conn.cursor()

        # execute a statement
        print("PostgreSQL database version: ")
        cur.execute("SELECT version()")

        # display the PostgreSQL database server version
        db_version = cur.fetchone()
        print(db_version)        

        # close the communication with the PostgreSQL server
        cur.close()
    
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()
            print("Database connection closed")

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
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(**params)
        cur = conn.cursor()

        # get the updated list of tables
        sqlGetTableList = "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public';"        
        cur.execute(sqlGetTableList)        
        tables = cur.fetchall()       
        print("tables datatype: " + str(type(tables)))
        for table in tables:
            print(table)
        if ('public', 'inventory') not in tables:
            # create a table one-by-one                
            for command in commands:                                                    
                cur.execute(command)
            # commit the changes
            conn.commit()        
        
        # close communication with the PostgreSQL database server
        cur.close()
        
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

def insert_inventory():
    """ Insert data into a PostgreSQL table. """
    commands = ["""INSERT INTO inventory (meter_id, latitude, longitude)"""]
    conn = None
    try:
        # read the connection parameters
        params = config()
        # connect to the PostgreSQL server
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        # execute SQL commands
        for command in commands:
            cur.execute(command)
        # commit changes
        conn.commit()
        # close communication with the PostgreSQL database server
        cur.close()        
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if conn is not None:
            conn.close()

# JSON test
# with open("settings.json") as f:
#     my_dict = json.load(f)
# print(my_dict["app_token"])
