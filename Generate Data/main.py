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
    mycursor.execute("SELECT distinct startTime,endTime from measurement")
    times = mycursor.fetchall()
    record = [stationID, component, "µg/m³", "hour"]
    mycursor.execute("""
                INSERT INTO sensorgenerated (StationID, Component, Unit, Duration)
                VALUES (%s, %s, %s, %s)""", record)
    sensorID = mycursor.lastrowid
    for i in range(0, len(generatedData)):
        record = [sensorID, times[i][0], times [i][1], generatedData[i]]
        mycursor.execute("""
        INSERT INTO measurementgenerated (SensorID, startTime, endTime, Value)
        VALUES (%s, %s, %s, %s)""", record)
    mydb.commit()


def generateData(averageAQIValues, componentsToGenerate, stationID):
    for component in componentsToGenerate:
        data = []
        for i in range (0, len(averageAQIValues)):
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
    AQIValues = []
    for component in values:
        aqi = []
        for i in range(0,len(values[component])):
            AQIIndex = 0
            data = values[component][i]
            while AQIIndex <= 3 and AQILevels[component][AQIIndex] < data:
                AQIIndex = AQIIndex + 1
            if AQIIndex == 0:
                if data == 0:
                    percentage = 0
                else:
                    percentage = AQILevels[component][AQIIndex] / data
            elif AQIIndex == 4:
                percentage = 0
            else:
                intervallSize = AQILevels[component][AQIIndex] - AQILevels[component][AQIIndex - 1]
                a = data - AQILevels[component][AQIIndex - 1]
                percentage = a / intervallSize
            x = AQIIndex * AQISTEPS + percentage * AQISTEPS
            if x > 100: x = 100
            aqi.append(x)
        AQIValues.append(aqi)
    AverageAQI = [sum(i) for i in zip(*AQIValues)]
    AverageAQI = [x / len(AQIValues) for x in AverageAQI]
    generateData(AverageAQI, componentsToGenerate, stationID)


def getDataFromDatabase(componentsToGenerate, componentsPresent, stationID):
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
            getDataFromDatabase(componentsToGenerate, componentPresent, stationID)
        print(componentPresent)




if __name__ == '__main__':
    mycursor.execute("Select Count(*) from station")
    numberOfStations = mycursor.fetchall()
    numberOfStations = numberOfStations[0]
    numberOfStations = numberOfStations[0]
    getComponents()
