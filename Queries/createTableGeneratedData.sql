CREATE TABLE SensorGenerated(
    SensorID INT AUTO_INCREMENT PRIMARY KEY,
    StationID INT,
    FOREIGN KEY (StationID)
        REFERENCES Station(StationID)
        ON DELETE CASCADE,
    Component varchar(255) NOT NULL,
    Unit varchar(255) NOT NULL,
    Duration varchar(255),
    UNIQUE(StationID,  Component),
    INDEX (Component)
);

CREATE TABLE MeasurementGenerated(
    MeasurementID INT AUTO_INCREMENT PRIMARY KEY,
    SensorID INT,
    FOREIGN KEY (SensorID)
        REFERENCES Sensor(SensorID)
        ON DELETE CASCADE,
    startTime DATETIME,
    endTime DATETIME,
    Value FLOAT,
    INDEX(startTime),
    INDEX(endTime)
);
