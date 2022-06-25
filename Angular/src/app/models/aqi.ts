export class AQI {

  constructor() {
    this.Levels = [[20, 50, 90, 140],
                    [30, 75, 125, 200],
                    [40, 100, 180, 240],
                    [30, 75, 125, 200]]
    this.Pollutants = ["PM2.5", "PM10", "O3", "SO2"];
  }

  Levels: Array<Array<number>>;
  Pollutants: Array<string>;
}
