USE airpollution;
Drop TABLE IF EXISTS temporarymeasurement;
Drop TABLE IF EXISTS temporarysensor;
Drop TABLE IF EXISTS temporarystation;
CREATE TABLE TemporaryStation(
    TemporaryStationID INT AUTO_INCREMENT PRIMARY KEY,
    StationCode varchar(255) NOT NULL UNIQUE,
    City varchar(255),
    Street varchar(255),
    Latitude DECIMAL(8,6),
    Longitude DECIMAL(8,6),
    TypeOfLocation varchar(255),
    StationType varchar(255)
);

CREATE TABLE TemporarySensor(
    TemporarySensorID INT AUTO_INCREMENT PRIMARY KEY,
    StationID INT,
    FOREIGN KEY (StationID)
        REFERENCES temporarystation(TemporaryStationID)
        ON DELETE CASCADE,
    Component varchar(255) NOT NULL,
    Unit varchar(255) NOT NULL,
    Duration varchar(255),
    TypeOfMeasurement varchar(255) NOT NULL,
    MeasuringSystem varchar(255) NOT NULL,
    UNIQUE(StationID, TypeOfMeasurement, MeasuringSystem, Component)
);

CREATE TABLE temporaryMeasurement(
    TemporaryMeasurementID INT AUTO_INCREMENT PRIMARY KEY,
    SensorID INT,
    FOREIGN KEY (SensorID)
        REFERENCES temporarysensor(TemporarySensorID)
        ON DELETE CASCADE,
    startTime DATETIME,
    endTime DATETIME,
    Value FLOAT
);





