export class DBSensor {

  constructor(SensorID: number, StationID: number, Component: string, Unit: string, Duration: string, TypeOfMeasurement: string, MeasuringSystem: string) {
    this.SensorID = SensorID;
    this.StationID = StationID;
    this.Component = Component;
    this.Unit = Unit;
    this.Duration = Duration;
    this.TypeOfMeasurement = TypeOfMeasurement;
    this.MeasuringSystem = MeasuringSystem;
  }

  SensorID: number;
  StationID: number;
  Component: string;
  Unit: string;
  Duration: string;
  TypeOfMeasurement: string;
  MeasuringSystem: string;
}
