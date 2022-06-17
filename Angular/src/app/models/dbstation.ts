export class DBStation {
  StationID: number;
  StationCode: string;
  CityID: number;
  Street: string;
  Latitude: number;
  Longitude: number;
  TypeOfLocation: string;
  StationType: string;


  constructor(StationID: number, StationCode: string, CityID: number, Street: string, Latitude: number, Longitude: number, TypeOfLocation: string, StationType: string) {
    this.StationID = StationID;
    this.StationCode = StationCode;
    this.CityID = CityID;
    this.Street = Street;
    this.Latitude = Latitude;
    this.Longitude = Longitude;
    this.TypeOfLocation = TypeOfLocation;
    this.StationType = StationType;
  }
}
