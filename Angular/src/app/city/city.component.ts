import {Component, OnInit} from '@angular/core';
import {SharedService} from "../shared.service";
import {ActivatedRoute} from "@angular/router";
import {ChartType, Row} from "angular-google-charts";
import {map} from "rxjs";
import {DBCity} from "../models/dbcity";
import {DBStation} from "../models/dbstation";
import {DBSensor} from "../models/dbsensor";
import {SelectedSensor} from "../models/selected-sensor";
import {DbMeasurement} from "../models/db-measurement";
import {ComponentMeasurements} from "../models/component-measurements";
import {FormControl, FormGroup} from "@angular/forms";
import {Average} from "../models/average";
import {AQI} from "../models/aqi";
import {AQIvalue} from "../models/aqivalue";
import {MatCheckboxChange} from "@angular/material/checkbox";

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.css'],
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
  allAvailableSensors: Array<SelectedSensor> = new Array<SelectedSensor>();
  //A list containing all selected sensors in the UI
  selectedSensors: Array<ComponentMeasurements> = new Array<ComponentMeasurements>();
  //A list containing all type of averages
  averages: Array<string> = new Array<string>();
  //The selected average of the list
  selectedAverage: string | undefined;
  //Are all sensors in the UI selected
  allSensorsSelected: boolean = false;
  //Is there a valid date selected
  validDateSelected: boolean = false;
  //Start and end date selected in the UI
  startDate: string = '';
  endDate: string = '';
  //Date where date picker starts
  openingDate: Date = new Date(2020, 12, 1);
  //Is the simulation running
  simulationIsRunning: boolean = false;
  //Is the simulation button selected
  isSimulationSelected: boolean = false;
  //The live simulation time
  simulationTime: Date = new Date(2020, 12, 1);
  //The values for AQI calculation
  AQITable: AQI = new AQI()
  //The AQI values per component
  AQIValues: Array<AQIvalue> = new Array<AQIvalue>()
  //The average overall AQI value
  AverageAQIValue: number = 0;


  ngOnInit(): void {
    this.averages.push("Hourly")
    this.averages.push("Daily")
    //Retrieve the cities for the dropdown menu
    this.refreshCitiesList();
  }

  refreshCitiesList() {
    //Fill the citieslist with all the information about all the cities for the dropdown menu
    this.service.getCities().subscribe(data => {
      this.citiesList = data;
    })
  }

  selectedOneCity(): void {
    //A city is selected in the dropdown menu, now get the sensors for the dropdown menu of stations
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
    this.allAvailableSensors = new Array<SelectedSensor>()
    this.simulationIsRunning = false;
  }

  refreshSensorList(): void {
    //Fill the sensorList with all the sensors of the selected station
    this.service.getSensors(this.selectedStation?.StationID).subscribe(data => {
      this.sensorList = data;
      this.sensorList.forEach((x) => {
        this.allAvailableSensors.push(new SelectedSensor(x.Component, false))
      })
    })
  }

  /**
   *
   * @param sensor the sensor for which the measurements have to be retrieved
   */
  addMeasurementData(sensor: SelectedSensor): void {
    //Retrieve all the measurements of the selected sensors
    if (this.selectedCity !== undefined && this.validDateSelected && this.selectedAverage && this.selectedStation) {
      //Get data from the backend
      this.service.getMeasurementDataDailyAverage(
         this.startDate + ' 00:00:00', this.endDate + ' 00:00:00', sensor.Name, this.selectedAverage, this.selectedStation).subscribe(
        (data: DbMeasurement[]) => {
          const componentMeasurement = new ComponentMeasurements(data[0].Name);
          if (data.length > 0) {
            data.forEach(item => {
              const newRow = [item.Date, item.Value];
              componentMeasurement.measurements.push(newRow);
              const newRowProcessed = [item.Date, item.Processed_Value]
              componentMeasurement.measurementsProcessed.push(newRowProcessed);
              const newRowAll = [item.Date, item.Value, item.Processed_Value]
              componentMeasurement.allFilteredMeasurements.push(newRowAll)
            });
            componentMeasurement.filteredMeasurements = componentMeasurement.measurements;
            componentMeasurement.filteredMeasurementsProcessed = componentMeasurement.measurementsProcessed;
          }
          this.selectedSensors.push(componentMeasurement);
          this.calculateAQI();
        }
      )
    }


  }

  /***
   * Called when the user clicked on a sensor in the UI
   * @param sensor the clicked sensor
   */
  updateAllSensorsSelected(sensor: SelectedSensor): void {
    if (sensor.Selected) {
      //Sensor is selected so draw the graph and update all sensors selected
      //Get the data
      this.addMeasurementData(sensor);
      //Update the selected sensors
      this.allSensorsSelected = this.allAvailableSensors.filter(x => x.Selected).length == this.allAvailableSensors.length;
      //Start simulation This is done here cause we can only start a simulation if a sensor is selected
      if (this.simulationIsRunning) {
        this.startSimulation().then(r => console.log(r))
      }
    } else {
      //Remove sensor from selected sensors
      var idx = this.selectedSensors.findIndex(x => x.name === sensor.Name);
      if (idx !== -1) {
        this.selectedSensors.splice(idx, 1);
        // in order to trigger change detection: re-assign array
        this.selectedSensors = [...this.selectedSensors];
      }
      //Remove the AQI value of the sensor for the list
      idx = this.AQIValues.findIndex((value) => value.Name === sensor.Name)
      if (idx !== -1) {
        this.AQIValues.splice(idx, 1);
        this.AQIValues = [...this.AQIValues];
        this.calculateAverageAQI()

      }

    }
    return;
  }

  waitOneSecond(): Promise<unknown> {
    return new Promise(f => setTimeout(f, 1000));
  }

  /***
   * This function is called when the simulation has to start
   */
  async startSimulation(): Promise<void> {
    if(this.selectedSensors.length > 0) {
      if (this.endDate != null) {
        const end = new Date(this.endDate);
        //We want to simulate until the selected end time is reached
        while (this.simulationTime <= end && this.simulationIsRunning) {
          //Every second we want to go one day or one hour forward
          await this.waitOneSecond();
          this.getData()
          if (this.selectedAverage == "Daily") {
            this.simulationTime = new Date(this.simulationTime.setDate(this.simulationTime.getDate() + 1))
          } else if (this.selectedAverage == "Hourly") {
            this.simulationTime = new Date(this.simulationTime.setTime(this.simulationTime.getTime() + (60 * 60 * 1000)))
          }
        }
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
  simulationCanBeCheck(): boolean{
    return this.selectedSensors.length > 0;
  }

  checkSimulationStart(event: MatCheckboxChange): void{
    this.simulationIsRunning = this.selectedSensors.length > 0 && event.checked && this.isSimulationSelected
    if(this.simulationIsRunning){
      this.startSimulation()
    }else{
      this.isSimulationSelected = false;
    }
  }

  /***
   * This function is used to deselect all sensors. And remove their data
   */
  deselectAllSensors(): void {
    //Deselect all selected sensors and remove their data
    this.allAvailableSensors.forEach((sensor) => {
      if (sensor.Selected) {
        const idx = this.selectedSensors.findIndex(x => x.name === sensor.Name);
        console.log(idx);
        if (idx !== -1) {
          this.selectedSensors.splice(idx, 1);
          // in order to trigger change detection: re-assign array
          this.selectedSensors = [...this.selectedSensors];
        }
        sensor.Selected = false;
      }

    });

  }

  /***
   * Gets the data used for drawing in the UI.
   */
  getData(): void {
    this.selectedSensors.forEach(entry => {
      entry.filteredMeasurements = entry.measurements.filter((x) => {
        //x[0] is the Date
        //We only want to return data before the simulationTime
        if (x[0] != null) {
          const time = new Date(x[0])
          if (time <= this.simulationTime) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
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
        const startYear = this.range.controls['start'].value.getFullYear()
        const startM = this.range.controls['start'].value.getMonth() + 1
        const startD = this.range.controls['start'].value.getDate().toString()
        var startMonth: string = ''
        var startDay: string = ''
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
        this.startDate = startYear + '-' + startMonth + '-' + startDay
        this.simulationTime = new Date(this.startDate)
        const endYear = this.range.controls['end'].value.getFullYear()
        const endM = this.range.controls['end'].value.getMonth() + 1
        const endD = this.range.controls['end'].value.getDate().toString()
        var endMonth: string = ''
        var endDay: string = ''
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
        this.endDate = endYear + '-' + endMonth + '-' + endDay

      }
    }
  }

  /***
   * Calculated the AQI for drawing
   * Note we can only calculate the AQI for the following components:
   * PM2.5 PM10 NO2 O3 SO2
   */
  calculateAQI(): void {
    var numberOfPollutantsForAQICalculation = 0
    this.selectedSensors.forEach((x) => {
        var i = this.AQIValues.findIndex(value => value.Name === x.name)
        if (i === -1 || i === undefined) {
          var total = 0;
          if (x.name === "PM2.5" || x.name === "PM10" || x.name === "NO2" || x.name === "O3" || x.name === "SO2") {
            numberOfPollutantsForAQICalculation += 1
            x.measurements.forEach((measurement) => {
              const idx = this.AQITable.Pollutants.findIndex(value => value === x.name);
              const index = this.AQITable.Levels[idx].findIndex(function (value) {
                if (measurement[1]) {
                  return (measurement[1] > value)
                }
                return
              })
              //Element is not found if value of measurement is bigger then the max threshold in the table
              if (index !== -1) {
                total += 20 * index
              } else {
                total += 100
              }

            })
            total = total / x.measurements.length
            this.AQIValues.push(new AQIvalue(x.name, total))
          }

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


