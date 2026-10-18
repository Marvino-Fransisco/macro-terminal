import type { FetchObservationsRequest } from "../dtos/requests/fetch-observations.request";
import type { ProviderSeriesMetadataResponse } from "../dtos/responses/provider-series-metadata.response";
import type { ReleaseEventInput } from "../../domain/entities/release-event.entity";
import type { Point } from "../../domain/value-objects/point.vo";

export interface MacroDataProvider {
  fetchObservations(request: FetchObservationsRequest): Promise<Point[]>;
  fetchSeriesMetadata(providerSeriesId: string): Promise<ProviderSeriesMetadataResponse>;
  fetchReleaseEvents?(from: string, to: string): Promise<ReleaseEventInput[]>;
}
