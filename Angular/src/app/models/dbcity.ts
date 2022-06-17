export class DBCity {
  constructor(cityid: number, n: string, countryid: number) {
    this.CityID = cityid;
    this.Name = n;
    this.CountryID = countryid;
  }

  CityID: number;
  Name: string;
  CountryID: number;
}
