import type { IngestSeriesResponse } from "./dtos/responses/ingest-series.response";

export type BackfillSeriesUseCase = (seriesId: string, from: string, to: string) => Promise<IngestSeriesResponse>;
