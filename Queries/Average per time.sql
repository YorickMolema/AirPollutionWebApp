SELECT sensor.Component, AVG(measurement.Value)
from sensor
INNER JOIN measurement ON measurement.SensorID = sensor.sensorID
WHERE measurement.startTime = '2021-01-01 00:00:00'
GROUP BY sensor.Component