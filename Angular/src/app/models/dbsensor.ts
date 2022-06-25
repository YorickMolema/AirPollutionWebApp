import {Row} from "angular-google-charts";

export class DBSensor {

  constructor(SensorID: number, StationID: number, Component: string, Unit: string, Duration: string, TypeOfMeasurement: string, MeasuringSystem: string, isGenerated: boolean) {
    this.SensorID = SensorID;
    this.StationID = StationID;
    this.Component = Component;
    this.Unit = Unit;
    this.Duration = Duration;
    this.TypeOfMeasurement = TypeOfMeasurement;
    this.MeasuringSystem = MeasuringSystem;
    this.isGenerated = isGenerated;
  }

  SensorID: number;
  StationID: number;
  Component: string;
  Unit: string;
  Duration: string;
  TypeOfMeasurement: string;
  MeasuringSystem: string;
  isGenerated: boolean;
}

export class GUISensor extends DBSensor {
  Selected: boolean;
  numberOfCleanedMeasurements: number;
  totalNumberOfMeasurements: number;
  hasDataFromDB: boolean = false;

  filteredMeasurements: Array<Row>;
  allMeasurements: Array<Row>;

  constructor(dbSensor: DBSensor) {

    super(dbSensor.SensorID,
      dbSensor.StationID,
      dbSensor.Component,
      dbSensor.Unit,
      dbSensor.Duration,
      dbSensor.TypeOfMeasurement,
      dbSensor.MeasuringSystem,
      dbSensor.isGenerated);

    this.Selected = false;
    this.numberOfCleanedMeasurements = 0;
    this.totalNumberOfMeasurements = 0;

    this.filteredMeasurements = new Array<Row>();
    this.allMeasurements = new Array<Row>();
  }

  public select() {
    this.Selected = true;
  }
}
