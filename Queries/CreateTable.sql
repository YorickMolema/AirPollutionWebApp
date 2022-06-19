USE airpollution;
DROP TABLE IF EXISTS Measurement;
DROP TABLE IF EXISTS Sensor;
DROP TABLE IF EXISTS Station;
DROP TABLE IF EXISTS City;
DROP TABLE IF EXISTS Country;
CREATE TABLE Country(
    CountryID INT AUTO_INCREMENT PRIMARY KEY,
    Name varchar(255) UNIQUE NOT NULL,
    INDEX (Name)
);


CREATE TABLE City(
    CityID INT AUTO_INCREMENT PRIMARY KEY,
    Name varchar(255) UNIQUE NOT NULL,
    CountryID INT,
    FOREIGN KEY (CountryID)
        REFERENCES Country(CountryID)
        ON DELETE CASCADE,
    INDEX (Name)
);

CREATE TABLE Station(
    StationID INT AUTO_INCREMENT PRIMARY KEY,
    StationCode varchar(255) UNIQUE NOT NULL,
    CityID INT,
    FOREIGN KEY (CityID)
        REFERENCES City(CityID)
        ON DELETE CASCADE,
    Street varchar(255),
    Latitude FLOAT,
    Longitude FLOAT,
    TypeOfLocation varchar(255),
    StationType varchar(255),
    INDEX (StationCode)
);

CREATE TABLE Sensor(
    SensorID INT AUTO_INCREMENT PRIMARY KEY,
    StationID INT,
    FOREIGN KEY (StationID)
        REFERENCES Station(StationID)
        ON DELETE CASCADE,
    Component varchar(255) NOT NULL,
    Unit varchar(255) NOT NULL,
    Duration varchar(255),
    TypeOfMeasurement varchar(255) NOT NULL,
    MeasuringSystem varchar(255) NOT NULL,
    UNIQUE(StationID, TypeOfMeasurement, MeasuringSystem, Component),
    INDEX (Component),
    INDEX (TypeOfMeasurement),
    INDEX (MeasuringSystem)
);

CREATE TABLE Measurement(
    MeasurementID INT AUTO_INCREMENT PRIMARY KEY,
    SensorID INT,
    FOREIGN KEY (SensorID)
        REFERENCES Sensor(SensorID)
        ON DELETE CASCADE,
    startTime DATETIME,
    endTime DATETIME,
    Value FLOAT,
    Processed_Value Float,
    INDEX(startTime),
    INDEX(endTime)
);

INSERT INTO COUNTRY(name) VALUES ('Netherlands');






