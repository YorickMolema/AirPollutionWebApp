import {Row} from "angular-google-charts";

export class ComponentMeasurements {
  constructor(name: string, isGenerated:boolean) {
    this.name = name;
    this.filteredMeasurements = new Array<Row>();
    this.allMeasurements = new Array<Row>();
    this.isGenerated = isGenerated;
  }
  name: string;
  filteredMeasurements: Array<Row>;
  allMeasurements: Array<Row>;
  isGenerated: boolean;
}
