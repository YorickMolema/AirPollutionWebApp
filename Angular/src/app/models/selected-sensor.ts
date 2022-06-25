export class SelectedSensor {

  constructor(Name: string, Selected: boolean) {
    this.Name = Name;
    this.Selected = Selected;
    this.percentageOfCleanedMeasurements = 0;
    this.totalNumberOfMeasurements = 0;
  }

  Name: string;
  Selected: boolean;
  percentageOfCleanedMeasurements: number;
  totalNumberOfMeasurements: number;
}
