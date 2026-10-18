export class SameDayRevisionError extends Error {
  constructor(seriesId: string, period: string) {
    super(`Conflicting same-day revision for ${seriesId} at ${period}; date-keyed history cannot retain intraday revisions`);
    this.name = "SameDayRevisionError";
  }
}
