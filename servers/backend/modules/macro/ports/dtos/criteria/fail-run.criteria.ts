export type FailRunCriteria = {
  runId: string;
  seriesId: string;
  error: string;
  nextPollAt: Date;
}
