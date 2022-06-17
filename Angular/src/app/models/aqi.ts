export class AQI {

  constructor() {
    this.Levels = [[10, 20, 25, 50, 75, 800],
                    [20, 40, 50, 100, 150, 1200],
                    [40, 90, 120, 230, 340, 1000],
                    [50, 100, 130, 240, 380, 800],
                    [100, 200, 350, 500, 7500, 1250]]
    this.Pollutants = ["PM2.5", "PM10", "NO2", "O3", "SO2"];
  }

  Levels: Array<Array<number>>;
  Pollutants: Array<string>;
}
