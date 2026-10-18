export type GetSeriesRequest = {
  country: string;
  indicator: string;
  from?: string;
  to?: string;
  asOf?: string;
  feature?: string;
}
