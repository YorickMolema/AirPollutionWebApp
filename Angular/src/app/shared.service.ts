import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {DBCity} from "./models/dbcity";
import {DBStation} from "./models/dbstation";
import {DBSensor} from "./models/dbsensor";
import {DbMeasurement} from "./models/db-measurement";


@Injectable({
  providedIn: 'root'
})
export class SharedService {
readonly APIUrl = "http://127.0.0.1:5000"
  constructor(private http: HttpClient) { }

  /**
   * Get all the cities from the backend
   */
  getCities(): Observable<Array<DBCity>>{
    return this.http.get<Array<DBCity>>(this.APIUrl + '/cities')
  }

  /***
   * Get all the stations from the backend
   */
  getStations():Observable<Array<DBStation>>{
    return this.http.get<Array<DBStation>>(this.APIUrl + '/stations')
  }

  /***
   * Get all the sensors for the specified stationID
   * @param stationID
   */
  getSensors(stationID: number | undefined):Observable<Array<DBSensor>>{
    return this.http.get<Array<DBSensor>>(this.APIUrl + '/sensors?stationID=' + stationID)
  }

  /***
   * Get all the measurements in the given interval for the given component of the station
   * Average is specified as well
   * @param startTime
   * @param endTime
   * @param component
   * @param average
   * @param station
   */
  getMeasurementDataDailyAverage(startTime: string, endTime: string, component: string, average: string, station: DBStation):Observable<Array<DbMeasurement>>{
    return this.http.get<Array<DbMeasurement>>(this.APIUrl + '/measurements?' + 'station=' + station.StationID +  '&component=' + component +  '&startTime=' + startTime + '&endTime=' + endTime + '&average=' + average)
  }
}
