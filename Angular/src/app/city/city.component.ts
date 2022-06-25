import {Component, OnInit} from '@angular/core';
import {SharedService} from "../shared.service";
import {ActivatedRoute} from "@angular/router";
import {ChartType,} from "angular-google-charts";
import {map} from "rxjs";
import {DBCity} from "../models/dbcity";
import {DBStation} from "../models/dbstation";
import {DBSensor, GUISensor} from "../models/dbsensor";
import {DbMeasurement} from "../models/db-measurement";
import {ComponentMeasurements} from "../models/component-measurements";
import {FormControl, FormGroup} from "@angular/forms";
import {AQI} from "../models/aqi";
import {AQIvalue} from "../models/aqivalue";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from "@angular/material-moment-adapter";

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MMM',
  },
  display: {
    dateInput: 'DD/MMM',
    monthYearLabel: 'MMM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.css'],
  providers: [{
    provide: DateAdapter,
    useClass: MomentDateAdapter,
    deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
  }, {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}]
})


export class CityComponent implements OnInit {

  //Variables for drawing graphs
  typeLine: ChartType = ChartType.LineChart
  columnNames = ['Date'];
  optionsLine = {
    hAxis: {
      title: 'Date'
    },
    vAxis: {
      title: 'Concentration in µg/m³'
    }
  };
  width = 550;
  height = 400;

  //Variables for gauage meter
  typeGauge: ChartType = ChartType.Gauge
  optionsGauge = {
    animation: {
      duration: 2000
    },
    greenFrom: 0,
    greenTo: 30,
    redFrom: 70,
    redTo: 100,
    yellowFrom: 30,
    yellowTo: 70,
  };

  //Variables for picking date
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  })


  //Selected City and Station in the UI
  selectedCity: DBCity | undefined;
  selectedStation: DBStation | undefined;


  constructor(private service: SharedService, private route: ActivatedRoute) {
  }

  color = 'lightblue'

  tiles: Tile[] = [
    {text: 'One', cols: 4, rows: 1, color: 'lightblue'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1'},
  ];

  //List containing all cities
  citiesList: Array<DBCity> = new Array<DBCity>();
  //List containing all stations of selected city
  stationList: Array<DBStation> = new Array<DBStation>();
  //List containing all sensors in selected station
  sensorList: Array<DBSensor> = new Array<DBSensor>();

  //A clickable sensor for in the UI
  allAvailableSensors: Array<GUISensor> = new Array<GUISensor>();
  //A list containing all type of averages
  averages: Array<string> = new Array<string>();
  //The selected average of the list
  selectedAverage: string | undefined;
  //Are all sensors in the UI selected
  allSensorsSelected: boolean = false;
  //Is there a valid date selected
  validDateSelected: boolean = false;
  //Start and end date selected in the UI
  selectedStartDate: string = '';
  selectedEndDate: string = '';
  //Date where date picker starts
  openingDate: Date = new Date(2020, 12, 1);
  //Is the simulation running
  simulationIsRunning: boolean = false;
  //Is the simulation button selected
  isSimulationSelected: boolean = false;
  //The live simulation time
  currentSimulationTime: Date = new Date(2020, 12, 1);
  //The values for AQI calculation
  AQITable: AQI = new AQI()
  //The AQI values per component
  AQIValues: Array<AQIvalue> = new Array<AQIvalue>()
  //The average overall AQI value
  AverageAQIValue: number = 0;


  ngOnInit(): void {
    this.averages.push("Hourly");
    this.averages.push("Daily");
    this.simulationIsRunning = false;
    //Retrieve the cities for the dropdown menu
    this.refreshCitiesList();
  }

  public get selectedSensors(): Array<GUISensor> {
    return this.allAvailableSensors.filter(s => s.Selected);
  }

  refreshCitiesList() {
    //Fill the citieslist with all the information about all the cities for the dropdown menu
    this.service.getCities().subscribe(data => {
      this.citiesList = data;
    })
  }

  selectedOneCity(): void {
    //A city is selected in the dropdown menu, now get the sensors for the dropdown menu of stations
    this.deselectAllSensors();
    this.refreshStationList();
  }

  refreshStationList() {
    //Fill the stationList with all the stations of the selected city
    this.service.getStations().pipe(
      map(station => station.filter(station => (station.CityID === this.selectedCity?.CityID)))
    ).subscribe(data => {
      this.stationList = data;
    })
  }


  selectedOneStation(): void {
    //A station is selected in the dropdown menu, now get the sensors for the dropdown menu of sensors
    this.refreshSensorList();
    this.allAvailableSensors = new Array<GUISensor>()
    this.simulationIsRunning = false;
  }

  refreshSensorList(): void {
    //Fill the sensorList with all the sensors of the selected station
    this.service.getSensors(this.selectedStation?.StationID).subscribe(data => {
      this.allAvailableSensors = [];
      // convert database sensors to GUI sensors so we can use it in the GUI to select / filter etc.
      data.forEach((x) => {
        this.allAvailableSensors.push(new GUISensor(x))
      })
    })
  }

  /**
   *
   * @param sensor the sensor for which the measurements have to be retrieved
   */
  addMeasurementData(sensor: GUISensor): void {
    //Retrieve all the measurements of the selected sensors
    sensor.numberOfCleanedMeasurements = 0;
    if (sensor.hasDataFromDB) { return ; }



    if (this.selectedCity !== undefined && this.validDateSelected && this.selectedAverage && this.selectedStation) {
      //Get data from the backend
      this.service.getMeasurementDataDailyAverage(
        this.selectedStartDate + ' 00:00:00', this.selectedEndDate + ' 00:00:00', sensor.Component, this.selectedAverage, this.selectedStation).subscribe(
        (data: DbMeasurement[]) => {
          if (data.length > 0) {
            data.forEach(measurement => {
/*
              const newRow = [measurement.Date, measurement.Value];
              componentMeasurement.measurements.push(newRow);
*/
              if (sensor.isGenerated) {
                const newRowAll = [measurement.Date, measurement.Value]
                sensor.allMeasurements.push(newRowAll)
              }
              else{
                sensor.numberOfCleanedMeasurements += measurement.Value !== measurement.Processed_Value ? 1 : 0;
                const newRowAll = [measurement.Date, measurement.Value, measurement.Processed_Value];
                sensor.allMeasurements.push(newRowAll)
              }
            });

            // FIrst time we set the "filtered" collection is set to the whole collection
            // Later, if a filter is applied using the GUI, this set is built from the variable 'component.measurements.
            sensor.filteredMeasurements = sensor.allMeasurements;
          }

          sensor.totalNumberOfMeasurements = data.length;
          sensor.hasDataFromDB = true;
          this.calculateAQI();
        }
      )
    }


  }

  /***
   * Called when the user clicked on a sensor in the UI
   * @param sensor the clicked sensor
   */
  updateAllSensorsSelected(sensor: GUISensor): void {
    if (sensor.Selected) {
      this.addMeasurementData(sensor);
    }

    if (sensor.Selected) {
    } else {
      //Remove the AQI value of the sensor for the list
/*
      idx = this.AQIValues.findIndex((value) => value.Name === sensor.Component)
      if (idx !== -1) {
        this.AQIValues.splice(idx, 1);
        this.AQIValues = [...this.AQIValues];
        this.calculateAverageAQI()

      }
*/

    }
    this.allAvailableSensors.filter(sensor => sensor.Selected)
      .forEach(sensor => {
        // calc AQI
      })
    return;
  }

  waitOneSecond(): Promise<unknown> {
    return new Promise(f => setTimeout(f, 1000));
  }


  stopSimulation() : void {
    this.simulationIsRunning = false;
  }
  /***
   * This function is called when the simulation has to start
   */
  async startSimulation(): Promise<void> {
    if (this.selectedSensors.length > 0) {
      if (this.selectedEndDate != null) {
        this.simulationIsRunning = true;
        const endOfSimulation = new Date(this.selectedEndDate);
        this.currentSimulationTime = new Date(this.selectedStartDate);
        //We want to simulate until the selected end time is reached
        while (this.currentSimulationTime <= endOfSimulation && this.simulationIsRunning) {
          //Every second we want to go one day or one hour forward
          await this.waitOneSecond();

          this.filterSensorData();

          if (this.selectedAverage == "Daily") {
            this.currentSimulationTime = new Date(this.currentSimulationTime.setDate(this.currentSimulationTime.getDate() + 1))
          } else if (this.selectedAverage == "Hourly") {
            this.currentSimulationTime = new Date(this.currentSimulationTime.setTime(this.currentSimulationTime.getTime() + (60 * 60 * 1000)))
          }
        }
        this.simulationIsRunning = false;

      }
    }
  }

  /***
   * A new average is selected in the UI
   */
  updateOnAverage(): void {
    this.deselectAllSensors()
    this.simulationIsRunning = false;
  }

  /***
   * Can the simulation button be selected in the UI
   */
  simulationCanBeCheck(): boolean {
    return this.selectedSensors.length > 0;
  }


  /***
   * This function is used to deselect all sensors. And remove their data
   */
  deselectAllSensors(): void {
    //Deselect all selected sensors and remove their data
    this.allAvailableSensors.forEach((sensor) => { sensor.Selected = false; });
    this.calculateAverageAQI();
  }

  /***
   * Gets the data used for drawing in the UI.
   */
  filterSensorData(): void {
    this.selectedSensors.forEach(sensor => {
      sensor.numberOfCleanedMeasurements = 0;
      sensor.filteredMeasurements = sensor.allMeasurements.filter((x) => {
        //x[0] is the Date
        //We only want to return data before the simulationTime
        if (! sensor.isGenerated) {
          // add one if the measurement and it's processed value differ
          sensor.numberOfCleanedMeasurements += x[1] !== x[2] ? 1 : 0;
        }
        if (x[0] != null) {
          const time = new Date(x[0])
          if (time <= this.currentSimulationTime) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }

      });
      sensor.totalNumberOfMeasurements = sensor.filteredMeasurements.length;
    });


  }

  /***
   * Sets the date selected in the UI
   */
  setMonthAndYear(): void {
    if (this.range.controls['start'].value != null && !this.range.controls['start']?.hasError('matStartDateInvalid')) {
      if (this.range.controls['end'].value != null && !this.range.controls['end']?.hasError('matEndDateInvalid')) {
        //There is a new valid Date
        this.validDateSelected = true;
        //As there is a new valid date deselect all sensors, we want to draw new graphs for the selected interval
        this.deselectAllSensors();

        //Parsing of date from date picker. There no handy library capable of doing this in an easy way
        const startYear = 2021
        const startM = this.range.controls['start'].value.month() + 1
        const startD = this.range.controls['start'].value.date().toString()
        var startMonth: string = '';
        var startDay: string = '';
        if (startM < 10) {
          startMonth = '0' + startM.toString()
        } else {
          startMonth = startM.toString()
        }
        if (startD < 10) {
          startDay = '0' + startD.toString()
        } else {
          startDay = startD.toString()
        }
        this.selectedStartDate = startYear + '-' + startMonth + '-' + startDay
        this.currentSimulationTime = new Date(this.selectedStartDate)
        const endYear = 2021
        const endM = this.range.controls['end'].value.month() + 1
        const endD = this.range.controls['end'].value.date().toString()
        var endMonth: string = '';
        var endDay: string = '';
        if (endM < 10) {
          endMonth = '0' + endM.toString()
        } else {
          endMonth = endM.toString()
        }
        if (endD < 10) {
          endDay = '0' + endD.toString()
        } else {
          endDay = endD.toString()
        }
        this.selectedEndDate = endYear + '-' + endMonth + '-' + endDay

      }
    }
  }

  /***
   * Calculated the AQI for drawing
   * Note we can only calculate the AQI for the following components:
   * PM2.5 PM10 O3 SO2
   */
  calculateAQI(): void {
    var numberOfPollutantsForAQICalculation = 0
    this.selectedSensors.forEach((x) => {
        var i = this.AQIValues.findIndex(value => value.Name === x.Component)
        if (i === -1 || i === undefined) {
          //There is calculated yet for this sensor
          var total = 0;
          numberOfPollutantsForAQICalculation += 1
          x.allMeasurements.forEach((measurement) => {
            const idx = this.AQITable.Pollutants.findIndex(value => value === x.Component);
            const index = this.AQITable.Levels[idx].findIndex(function (value) {
              if (measurement[1]) {
                return (measurement[1] > value)
              }
              return
            })
            //Element is not found if value of measurement is bigger then the max threshold in the table
            if (index !== -1) {
              total += 25 * index
            } else {
              total += 100
            }

          })
          total = total / x.allMeasurements.length
          this.AQIValues.push(new AQIvalue(x.Component, total))

        }
      }
    )
    this.calculateAverageAQI()
  }

  /***
   * Calculate the average AQI for drawing
   */
  calculateAverageAQI(): void {
    this.AverageAQIValue = 0;
    this.AQIValues.forEach((x) => this.AverageAQIValue += x.Value)
    this.AverageAQIValue = this.AverageAQIValue / this.AQIValues.length
  }


}


