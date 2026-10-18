export class InvalidSeasonalAdjustmentError extends Error {
  constructor(value: string) {
    super(`Invalid seasonal adjustment: ${value}`);
    this.name = "InvalidSeasonalAdjustmentError";
  }
}
