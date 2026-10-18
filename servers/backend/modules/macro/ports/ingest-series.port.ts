import type { Series } from "../domain/entities/series.entity";
import type { IngestSeriesRequest } from "./dtos/requests/ingest-series.request";
import type { IngestSeriesResponse } from "./dtos/responses/ingest-series.response";

export type IngestSeriesUseCase = (series: Series, range?: IngestSeriesRequest) => Promise<IngestSeriesResponse>;
