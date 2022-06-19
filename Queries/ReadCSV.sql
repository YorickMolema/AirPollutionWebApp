LOAD DATA INFILE 'C:/School repository/RUG/Bachelor Project/Data/station.csv'
INTO TABLE temporarystation
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES
    TERMINATED BY '\n'
    IGNORE 1 LINES
    (@StationCode, @City, @Street, @Latitude, @Longitude, @TypeOfLocation, @StationType, @TypeOfMeasurement, @MeasuringSystem)

SET
    StationID := NULL,
    StationCode = @StationCode,
    City = @City,
    Street = @Street,
    Latitude = Cast(@Latitude + 0 AS DECIMAL(8,6)),
    Longitude = Cast(@Longitude + 0 AS DECIMAL(8,6)),
    TypeOfLocation = @TypeOfLocation,
    StationType = @StationType,
    TypeOfMeasurement = @TypeOfMeasurement,
    MeasuringSystem = @MeasuringSystem
;