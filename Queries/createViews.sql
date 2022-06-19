CREATE OR REPLACE VIEW vw_Measurements_per_day AS
SELECT sensor.Component                               as Component,
       Round(AVG(measurement.Value), 2)               AS Average,
       DATE_FORMAT(measurement.startTime, '%Y-%m-%d') as Day,
       c.Name                                         as CityName,
       c.CityID                                       as CityID
from sensor
         INNER JOIN measurement ON measurement.SensorID = sensor.sensorID
         INNER JOIN station s on sensor.StationID = s.StationID
         INNER JOIN city c on s.CityID = c.CityID
GROUP BY CityID, sensor.Component, date(measurement.startTime)