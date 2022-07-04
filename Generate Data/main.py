import mysql.connector
import math

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="",
  database = "airpollution"
)

mycursor = mydb.cursor()
AQISTEPS = 25
AQILevels = {
    "PM2.5": [20, 50, 90, 140],
    "PM10": [15, 38, 70, 100],
    "O3": [40, 100, 180, 240],
    "SO2": [30, 75, 125, 200]
}

def uploadData(generatedData, stationID, component):
    """
    This function is used to upload the generated data to the database.
    We create a new sensor for every component.
    After this the measurements are uploaded to that sensor.
    :param generatedData: A list with the generated data we want to uplaod
    :param stationID: The ID of the station for which we want to upload the data
    :param component: The component name for which we want to upload the data
    :return:
    """
    mycursor.execute("SELECT distinct startTime,endTime from measurement")
    times = mycursor.fetchall()
    record = [stationID, component, "µg/m³", "hour", 1]
    mycursor.execute("""
                INSERT INTO sensor(StationID, Component, Unit, Duration, isGenerated)
                VALUES (%s, %s, %s, %s, %s)""", record)
    sensorID = mycursor.lastrowid
    for i in range(0, len(generatedData)):
        record = [sensorID, times[i][0], times [i][1], generatedData[i]]
        mycursor.execute("""
        INSERT INTO measurement(SensorID, startTime, endTime, Value)
        VALUES (%s, %s, %s, %s)""", record)
    mydb.commit()


def generateData(averageAQIValues, componentsToGenerate, stationID):
    """
    :param averageAQIValues: A list containing the average AQI value for every time
    :param componentsToGenerate: A list containing the names of the components we want to generate
    :param stationID: the ID of the station for which we want to generate data
    :return:
    """

    for component in componentsToGenerate:
        data = []
        for i in range (0, len(averageAQIValues)):
            # Calculate the concentration of the component
            position = averageAQIValues[i]/25
            position = math.modf(position)
            pDecimal = position[0]
            pInt = position[1]
            pInt = math.floor(pInt)
            if pInt == 0:
                value = AQILevels[component][pInt] * pDecimal
            elif pInt == 4:
                value = AQILevels[component][3]
            else:
                value = AQILevels[component][pInt -1]
                interval = AQILevels[component][pInt] - AQILevels[component][pInt - 1]
                if interval < 0:
                    print(interval)
                value += pDecimal * interval
            data.append(math.floor(value))
        uploadData(data, stationID, component)







def calculateAverageAQI(values, componentsToGenerate, stationID):
    """
    :param values: A dictionary key = component name, value = measurements values
    :param componentsToGenerate: A list containing the names of the components measured at the station
    :param stationID: The ID of the station for which we want to generate data

    This function calculates the AQI for every measurement, after this the AQI is averaged and ready to use for data generation purposes
    :return:
    """
    AQIValues = []
    for component in values:
        aqi = []
        for i in range(0,len(values[component])):
            AQIIndex = 0
            data = values[component][i]  # Get the measurement value
            # In the AQI table there are only 4 items, so index may ever exceed 3
            # If the measurement value is larger than the AQI value we want to stop the loop as well
            # We do this because we want to know the first index where the measurement is larger then the AQI value
            while AQIIndex <= 3 and AQILevels[component][AQIIndex] < data:
                AQIIndex = AQIIndex + 1

            # We want to calculate the percentage of the interval in the AQI table see calculation
            # Measurement value is smaller then first AQI value
            if AQIIndex == 0:
                if data == 0:
                    percentage = 0
                else:
                    percentage = data / AQILevels[component][AQIIndex]

            elif AQIIndex == 4:
                percentage = 0
            else:
                intervallSize = AQILevels[component][AQIIndex] - AQILevels[component][AQIIndex - 1]
                a = data - AQILevels[component][AQIIndex - 1]
                percentage = a / intervallSize

            # Calculate the AQI value, in the table steps of 25 are taken. See AQISTEPS value
            x = AQIIndex * AQISTEPS + percentage * AQISTEPS
            if x > 100 : x = 100

            aqi.append(x)
        AQIValues.append(aqi)

    # Calculate the average AQI of all measurements at a time
    AverageAQI = [sum(i) for i in zip(*AQIValues)]
    AverageAQI = [x / len(AQIValues) for x in AverageAQI]
    generateData(AverageAQI, componentsToGenerate, stationID)


def getDataFromDatabase(componentsToGenerate, componentsPresent, stationID):
    """
    :param componentsToGenerate: A list containing the names of the components which need to be generated
    :param componentsPresent: A list containnig the names of the components measured at the station
    :param stationID: The ID of the station for which we want to generate data

    This function selects the measurements from the database and calls another function to calculate the AQI for these values

    :return:
    """
    values = {}
    for componentPresent in componentsPresent:
        record = [stationID, componentPresent]
        mycursor.execute("""SELECT Processed_Value from measurement
                                    INNER JOIN sensor s on measurement.SensorID = s.SensorID
                                    WHERE s.StationID = %s AND
                                    s.Component = %s""", record)
        x = mycursor.fetchall()
        x =  [item for t in x for item in t]
        values[componentPresent] = x
    calculateAverageAQI(values, componentsToGenerate, stationID)


def getComponents():
    """
    This function looks which components needs to be generated at every station.
    :return: if all data is generated and uplaoded
    """
    mycursor.execute("SELECT * FROM station")
    stationInfo = mycursor.fetchall()
    stationIDs = [x for x, _, _, _, _ , _ , _, _ in stationInfo]
    allComponents = AQILevels.keys()
    for stationID in stationIDs:
        record = [stationID]
        mycursor.execute("""SELECT Component from sensor
                                INNER join station s on sensor.StationID = s.StationID
                                where s.StationID = %s""", record)
        componentPresent = mycursor.fetchall()
        componentPresent = [item for t in componentPresent for item in t]
        componentsToGenerate = allComponents - componentPresent
        if len(componentsToGenerate) > 0:
            #If there are components to generate retrieve their data
            getDataFromDatabase(componentsToGenerate, componentPresent, stationID)
        print(componentPresent)




if __name__ == '__main__':
    getComponents()
