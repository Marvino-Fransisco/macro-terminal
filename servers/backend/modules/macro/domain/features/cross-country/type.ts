export interface CrossCountryValue {
  country: string;
  value: number;
  rank: number;
  zscore: number | null;
  differenceVsUs: number | null;
}

export interface CrossCountryResult {
  periodDate: string;
  countries: CrossCountryValue[];
}
