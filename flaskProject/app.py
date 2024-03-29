from flask import Flask, request, jsonify
from flaskext.mysql import MySQL


app = Flask(__name__)

app.config['MYSQL_DATABASE_HOST'] = 'localhost'
app.config['MYSQL_DATABASE_USER'] = 'root'
app.config['MYSQL_DATABASE_PASSWORD'] = ''
app.config['MYSQL_DATABASE_DB'] = 'airpollution'

mysql = MySQL()
mysql.init_app(app)




AQILevels = {
    "PM2.5": [10, 20, 25, 50, 75, 800],
    "PM10": [20, 40, 50, 100, 150, 1200],
    "O3": [50, 100, 130, 240, 380, 800],
    "SO2": [100, 200, 350, 500, 7500, 1250],
}

def SQLConnection():
    conn = mysql.connect()
    cur = conn.cursor()
    return cur



def calculateAQI(pollutant, level):
    """
    Calculate the AQI for the given pollutant and its level
    :param pollutant:
    :param level:
    :return: The AQI for the pollutant and its level
    """
    level = int(level)
    array = AQILevels[pollutant]
    if array:
        for i in range(0, len(array)):
            if level < array[i]:
                return i * 20
    else:
        return None


@app.route('/cities', methods = ['GET'])
def cities():
    """
    Endpoint: /cities
    :return: all cities from the database
    """
    query = "SELECT * FROM city ORDER BY city.Name"
    cur = SQLConnection()
    cur.execute(query)
    new_data = []
    columns = ["CityID", "Name", "CountryID"]
    data = cur.fetchall()
    for item in data:
        new_data.append(dict(zip(columns, item)))
    response = jsonify(new_data)
    # Add access-Control-Allow-Origin header, this is required by the newest versions of chrome
    # We choose to allow all origins by giving it the value *
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/stations', methods = ['GET'])
def stations():
    """
    Endpoint: /stations
    :return: all stations from the database
    """
    query = "SELECT * FROM station ORDER BY station.Street"
    cur = SQLConnection()
    cur.execute(query)
    new_data = []
    columns = ["StationID", "StationCode", "CityID", "Street", "Latitude", "Longitude", "TypeOfLocation", "StationType"]
    data = cur.fetchall()
    for item in data:
        new_data.append(dict(zip(columns, item)))
    response = jsonify(new_data)
    # Add access-Control-Allow-Origin header, this is required by the newest versions of chrome
    # We choose to allow all origins by giving it the value *
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/sensors', methods = ['GET'])
def sensors():
    """
    Endpoint: /sensors
    :return: all sensors of the specified stationID
    """
    stationID = request.args.get('stationID')
    record = [stationID]
    query = "SELECT * FROM sensor WHERE stationID = %s"
    cur = SQLConnection()
    cur.execute(query, record)
    new_data = []
    columns = ["SensorID", "StationID", "Component", "Unit", "Duration", "TypeOfMeasurement", "MeasuringSystem", "isGenerated"]
    data = cur.fetchall()
    for item in data:
        new_data.append(dict(zip(columns, item)))
    response = jsonify(new_data)
    # Add access-Control-Allow-Origin header, this is required by the newest versions of chrome
    # We choose to allow all origins by giving it the value *
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response



@app.route('/measurements', methods=['GET'])
def measurements():
    """
    Endpoint: /measurements
    :return: all normal and cleaned measurements of a sensor in a given interval
    """
    startTime = request.args.get('startTime')
    endTime = request.args.get('endTime')
    component = request.args.get('component')
    average = request.args.get('average')
    stationID = request.args.get('station')
    query = ''
    if average == 'Daily':
        query = """SELECT sensor.Component,DATE_FORMAT(measurement.startTime, '%%Y-%%m-%%d'), Round(AVG(measurement.Value),2) , Round(AVG(measurement.Processed_Value),2) 
                    from sensor
                    INNER JOIN measurement ON measurement.SensorID = sensor.sensorID
                    INNER JOIN station s on sensor.StationID = s.StationID
                    INNER JOIN city c on s.CityID = c.CityID
                    WHERE 
                            s.StationID = %s AND
                            measurement.startTime BETWEEN %s AND %s AND
                          sensor.Component = %s
                    GROUP BY sensor.Component, date(measurement.startTime)"""
    if average == 'Hourly':
        query = """SELECT sensor.Component,measurement.startTime,measurement.Value, measurement.Processed_Value
                            from sensor
                            INNER JOIN measurement ON measurement.SensorID = sensor.sensorID
                            INNER JOIN station s on sensor.StationID = s.StationID
                            INNER JOIN city c on s.CityID = c.CityID
                            WHERE 
                                s.StationID = %s AND
                                    measurement.startTime BETWEEN %s AND %s AND
                                  sensor.Component = %s"""
    record = [stationID, startTime, endTime, component]
    cur = SQLConnection()
    cur.execute(query, record)
    new_data = []
    columns = ["Name", "Date", "Value", "Processed_Value"]
    data = cur.fetchall()
    for item in data:
        new_data.append(dict(zip(columns, item)))
    response = jsonify(new_data)
    # Add access-Control-Allow-Origin header, this is required by the newest versions of chrome
    # We choose to allow all origins by giving it the value *
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    app.run(host = "0.0.0.0", port=8080)
