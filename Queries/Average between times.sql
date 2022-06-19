SELECT sensor.Component, Round(AVG(measurement.Value),2), DATE_FORMAT(measurement.startTime, '%Y-%m-%d')
from sensor
INNER JOIN measurement ON measurement.SensorID = sensor.sensorID
INNER JOIN station s on sensor.StationID = s.StationID
INNER JOIN city c on s.CityID = c.CityID
WHERE measurement.startTime BETWEEN '2021-01-01 00:00:00' AND '2021-02-01 00:00:00' AND
      C.Name = 'Groningen' AND
      sensor.Component = 'BC'
GROUP BY sensor.Component, date(measurement.startTime)