export type FetchObservationsRequest = {
  providerSeriesId: string;
  from?: string;
  to?: string;
  firstRelease?: boolean;
}
