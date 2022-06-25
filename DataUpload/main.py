""""
This python program is made to convert the CSV files from https://data.rivm.nl/data/luchtmeetnet/
The first 7 rows are converted. These rows contain information about the download of the CSV file, 
this information is discarded. When studying the CSV file we noted that this information is ended by ;;;.
This means information before ;;; is discarded.
The rest of the first 7 rows contains information about the stations measuring air pollution.
This information is saved with headers in rows, we need the header in the columns, meaning we have to swap the table axes.
After this we create a new document for the measurements, here the first seven lines are deleted.

INPUT: location of csv file
OUTPUT: 2 separate csv files, one for station information, one for measurements. Location is the same as CSV file.
"""

import re
import os
import mysql.connector
import zipfile
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats



from pathlib import Path

COUNTRY_ID_NETHERLANDS = 1
NUMBER_OF_COLUMN_NAMES = 7
LOCATION_OF_COMPONENT = 9
cnx = mysql.connector.connect(user='root',
                              password='',
                              host='localhost',
                              database='airpollution')

cursor = cnx.cursor()
city_pks = {}
station_pks = {}
sensor_pks = {}
components = []


def executeSQLQuery(query, record):
    for i in range(0, len(record)):
        try:
            cursor.execute(query, record[i])
        except :
            print("Command skipped: ", record[i])
    cnx.commit()
    return cursor.lastrowid


def executeSQLFile(file_location: Path):
    fd = open(file_location, 'r')
    sqlFile = fd.read()
    fd.close()
    sqlCommands = sqlFile.split(';')

    for command in sqlCommands:
        try:
            if command.strip() != '':
                cursor.execute(command)
        except IOError as msg:
            print
            "Command skipped: ", msg
    cnx.commit()
    return cursor.lastrowid


def stations(file_name: Path):
    with open(file_name) as file:
        # Read the first 7 lines of the CSV file
        head = file.readlines()[:LOCATION_OF_COMPONENT]
        # Remove the information we want to discard, this is the information before ;;;
        for i in range(0, NUMBER_OF_COLUMN_NAMES):
            pattern = '.*;;;'
            head[i] = re.sub(pattern, '', head[i])
    # The rest of the data contains information about the stations.
    # We first split the data so that we get a list of lists, each list item contains exactly 1 item
    column_names = []
    coordinates = []
    location = []
    components = head[LOCATION_OF_COMPONENT - 1].split(';')
    components = components[0:3]
    for i in range(0, NUMBER_OF_COLUMN_NAMES):
        # Remove newline from last item
        column_names.append(head[i].split(';'))
        if i == 1:
            for j in range(0, len(column_names[i])):
                if j == 0:
                    location.append(['Stad', 'Straat'])
                else:
                    location.append(column_names[i][j].split('-'))
                    if len(location[j]) > 1:
                        location[j][1] = location[j][1].replace('\n', '')
                    else:
                        location[j].append('')
        if i == 2:
            for j in range(0, len(column_names[i])):
                coordinates.append(column_names[i][j].split(','))
                coordinates[j][0] = coordinates[j][0].replace('(', '')
                coordinates[j][1] = coordinates[j][1].replace(')', '')
                coordinates[j][1] = coordinates[j][1].replace('\n', '')

        column_names[i][len(column_names[i]) - 1] = column_names[i][len(column_names[i]) - 1].replace('\n', '')
    # We want to store the information about the stations in a new CSV file

    for i in range(1, len(column_names[0])):
        city_name = [location[i][0]]
        city_name = city_name[0]
        country_id = COUNTRY_ID_NETHERLANDS
        record = [[city_name, country_id]]
        query = "INSERT IGNORE INTO city (Name, CountryID) VALUES (%s,%s)"
        city_pk = executeSQLQuery(query, record)
        if city_pk != 0:
            city_pks[city_name] = city_pk

        city_id = city_pks[city_name]
        record = [
            [column_names[0][i], city_id, location[i][1], coordinates[i][0], coordinates[i][1], column_names[3][i],
             column_names[4][i]]]
        query = "INSERT IGNORE INTO station (StationCode, CityID, Street, Latitude, Longitude, TypeOfLocation, StationType) VALUES (%s,%s,%s,%s,%s,%s,%s)"
        station_id = executeSQLQuery(query, record)
        if station_id != 0:
            station_pks[column_names[0][i]] = station_id

        station_id = station_pks[column_names[0][i]]
        query = "INSERT IGNORE INTO Sensor (StationID, Component, Duration, Unit, TypeOfMeasurement, MeasuringSystem) VALUES (%s,%s,%s,%s, %s, %s)"
        record = [[station_id,components[0], components[1], components[2], column_names[5][i], column_names[6][i]]]
        sensor_id = executeSQLQuery(query, record)
        sensor_pks[column_names[0][i]] = sensor_id


def measurements(file_name: Path):
    with open(file_name) as file:
        # Read the first 7 lines of the CSV file
        head = file.readlines()[(LOCATION_OF_COMPONENT - 2):]  # Look at location
    for i in range(0, len(head)):
        # Remove newline from last item
        head[i] = head[i].split(';')
        del head[i][0:3]
    station_ids = head[0][2:]
    station_ids[len(station_ids) - 1] = station_ids[len(station_ids) - 1].replace('\n', '')
    head = head[1:]
    records = []
    for i in range(0, len(head)):
        # records = []
        x = []
        year_time_start = head[i][0]
        year_time_start = year_time_start[:4] + '-' + year_time_start[4:6] + '-' + year_time_start[
                                                                                   6: len(year_time_start)] + ':00'
        year_time_end = head[i][1]
        year_time_end = year_time_end[:4] + '-' + year_time_end[4:6] + '-' + year_time_end[
                                                                             6: len(year_time_start)] + ':00'

        for j in range(0, (len(head[i]) - 2)):
            sensor_id = sensor_pks[station_ids[j]]
            x.append([sensor_id, year_time_start, year_time_end, head[i][j + 2]])
        records.append(x)
    i = 0
    finalDataFrame = pd.DataFrame()
    for indexInRecord in range(0, len(records[0])):
        df = pd.DataFrame()
        dataForDataFrame = []
        for indexInRecordList in range(0, len(records)):
            x = records[indexInRecordList][indexInRecord][3:4]
            x = x[0]
            if x != '' and x != '\n':
                x = float(x)
                if x < 0.0:
                    x = None
            else:
                x = None
            dataForDataFrame.append({indexInRecord: x})
        df = pd.DataFrame(dataForDataFrame)
        finalDataFrame =  pd.concat([finalDataFrame, df], axis=1)
        i += 1
    finalDataFrame = finalDataFrame.interpolate(method='linear', limit_direction='forward', axis=0)

    z = np.abs(stats.zscore(finalDataFrame))
    threshold = 3
    for i in range(0, len(z.columns)):
        for j in range(0, len(z)):
            if z[i][j] > threshold:
                finalDataFrame[i][j] = None
    finalDataFrame = finalDataFrame.interpolate(method='linear', axis=0, limit_direction="both")

    query = """INSERT INTO Measurement (SensorID,  startTime, endTime, Value, Processed_Value) VALUES (%s,%s,%s,%s, %s)"""
    for i in range(0, len(finalDataFrame.columns)):
        for j in range(0, len(finalDataFrame)):
            records[j][i].append(finalDataFrame[i][j])
    for i in range(0,len(records)):
        executeSQLQuery(query, records[i])

def uploadfiles(file_name: Path):
    for (root, dirs, file) in os.walk(file_name.parent):
        for f in file:
            if 'PM10' in f or 'PM25' in f or 'SO2' in f or 'O3' in f:
                if f.endswith('.csv'):
                    stations(Path(str(file_name.parent) + "\\"+f))
                    measurements(Path(str(file_name.parent) + "\\" + f))
                    print(f, 'is uploaded')


def unzip(filename: Path):
    zipped_file = zipfile.ZipFile(filename)
    zipped_file.extractall(str(filename.parent) + "\\")


if __name__ == '__main__':
    input = input()
    executeSQLFile(Path("C:\AirPollutionWebApp\Queries\CreateTable.sql"))
    file_location = Path(input)
    unzip(file_location)
    uploadfiles(file_location)

# C:\School repository\RUG\Bachelor Project\Data\2021.zip
