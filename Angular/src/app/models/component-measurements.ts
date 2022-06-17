import {Row} from "angular-google-charts";

export class ComponentMeasurements {
  constructor(name: string) {
    this.name = name;
    this.measurements = new Array<Row>();
    this.measurementsProcessed = new Array<Row>();
    this.filteredMeasurements = new Array<Row>();
    this.filteredMeasurementsProcessed = new Array<Row>();
    this.allFilteredMeasurements = new Array<Row>();
  }
  name: string;
  measurements: Array<Row>;
  measurementsProcessed: Array<Row>;
  filteredMeasurements: Array<Row>;
  filteredMeasurementsProcessed: Array<Row>;
  allFilteredMeasurements: Array<Row>;
}
