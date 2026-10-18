export class InvalidCountryIso3Error extends Error {
  constructor(value: string) {
    super(`Invalid ISO3 country or aggregate code: ${value}`);
    this.name = "InvalidCountryIso3Error";
  }
}

export class InvalidCountryIso2Error extends Error {
  constructor(value: string) {
    super(`Invalid ISO2 country or aggregate code: ${value}`);
    this.name = "InvalidCountryIso2Error";
  }
}
