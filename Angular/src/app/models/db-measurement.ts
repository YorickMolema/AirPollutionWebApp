export class DbMeasurement {

  constructor(Name: string, date: Date, Value: number, Processed_Value: number) {
    this.Name = Name;
    this.Date = date;
    this.Value = Value;
    this.Processed_Value = Processed_Value;
  }

  Name: string;
  Date: Date;
  Value: number;
  Processed_Value: number;
}
