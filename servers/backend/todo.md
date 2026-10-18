# Macro Data Module — TODO

Goal: a `macro` module that ingests, stores, derives features from, and serves macroeconomic data. Start with the US, with a design where adding a country is a data change (catalog rows), not a code change.

Status legend: `[ ]` open, `[x]` done. Items marked **(unverified)** could not be confirmed against official documentation during planning. See section 12.

---

## 1. Scan findings

| Code | Finding | Consequence |
|---|---|---|
| F1 | No macro code exists. Modules: `authentication`, `user`, `shared`. `bootstrap/api.ts` and `bootstrap/worker.ts` are 0 bytes; `api/http/` and `workers/` contain only `.gitkeep`. | Worker, API and composition root all need to be created. |
| F2 | `README.md` names Elysia as the HTTP framework, but `package.json` has no `elysia`. No scheduler, queue or HTTP client dependency either. | Add `elysia` when the API phase starts. Use global `fetch` for providers; no SDKs. |
| F3 | Code uses factory functions (`createUserUseCase(repo)`, `createUserRepository(db)`), not the classes shown in the README examples. | Follow the code, not the README. |
| F4 | DB stack: Drizzle `1.0.0-rc` + `postgres` driver against Supabase (`DATABASE_URL`). Tables use `snakeCase.table(...)` and spread a shared `entity` (uuid id, createdAt, updatedAt, deletedAt). Transactions go through `getConnection(db)` (AsyncLocalStorage unit of work). | Repositories follow `infrastructure/database/repositories/<module>/` with `mappers/` and `errors/`. |
| F5 | `configs/env.ts` validates only `DATABASE_URL`. | Provider keys must be added to the zod schema and `.env.example`. |
| F6 | No country concept. `modules/shared/constants/currency.const.ts` supports 5 currencies only. | Add a `Country` value object in `shared`. Country is not currency: euro area, aggregates (World, OECD) need handling. |
| F7 | `infrastructures/docker/composes/database.yml` mounts `db_data:/var/lib/postresql` (typo). Local Postgres data is not persisted. | Fix before storing time series in the local container. |
| F8 | `clients/website` has only landing, pricing, login, signup pages. A pricing page implies a paid product. | Provider licensing matters (see R1). API shape in section 10 should serve a future dashboard. |

---

## 2. Decisions

| Code | Decision | Reason |
|---|---|---|
| D1 | Canonical model: `indicator` (country-agnostic, e.g. `CPI_HEADLINE`) × `country` (ISO 3166-1 alpha-3) → `series` (provider + provider series id + priority). | Same feature code runs for any country. New country = new `series` rows. |
| D2 | FRED is the US aggregator in phase 2. Primary-source adapters (BLS, BEA, Census, Treasury, EIA) are added only where FRED lacks the series or lags. | One key and one client cover most of the US catalog. |
| D3 | Compute features in the domain layer as pure functions, not through provider transforms. | Only FRED offers `units=` transforms. Own code behaves identically for every provider and country. |
| D4 | `observations` is append-only and keyed by `realtime_start` (the date a value was first seen). Insert a row only when the value differs from the latest stored one. | Gives revision history and point-in-time reads without bulk vintage downloads. |
| D5 | Ingestion runs only in the worker. The API reads the database only and never calls providers. | Keeps request latency and provider rate limits independent. |
| D6 | All six persisted macro entities extend shared `Entity` and store UUID/audit metadata. Natural/composite primary keys remain; UUIDs are additionally unique where the primary key is natural/composite. | Revised to follow the requested shared-entity convention without losing revision uniqueness or existing foreign keys. |
| D7 | Phase 1 scheduler is a loop in the worker that selects `series` rows where `next_poll_at <= now()`. No cron/queue dependency. | Smallest correct solution. Revisit if release-time polling needs precision. |
| D8 | All-country coverage is tiered. Tier 1: G20 + euro area, monthly/quarterly headline indicators from OECD, BIS, ECB/Eurostat, IMF and national sources. Tier 2: all other countries, annual data from World Bank and IMF WEO. | No single free source offers consistent monthly/quarterly headline data for ~200 countries. |

---

## 3. Data sources

Verified = checked against the provider's official documentation during planning.

| Code | Provider | Use | Endpoint | Auth | Limits | Verified |
|---|---|---|---|---|---|---|
| S1 | FRED v1 (St. Louis Fed) | US series, vintages, release dates | `GET https://api.stlouisfed.org/fred/series/observations`, `/fred/series`, `/fred/releases/dates` | `api_key` query param | `limit` max 100000 rows, page with `offset`. Rate limit not documented on the pages checked. | Yes |
| S2 | FRED v2 | Bulk by release | `GET https://api.stlouisfed.org/fred/v2/release/observations?release_id=` | API key in an HTTP header (header name **unverified**) | 500000 obs/request, cursor pagination (`has_more`, `next_cursor`) | Partly |
| S3 | BLS Public Data API v2 | Labor, CPI, PPI, productivity | `POST https://api.bls.gov/publicAPI/v2/timeseries/data/` (single series: `GET .../data/{seriesID}`) | `registrationkey` in body | 500 queries/day, 50 series/query, 20 years/query, 50 requests/10 s; 429 on breach | Yes |
| S4 | BEA | GDP (NIPA), trade (ITA), IIP, GDP by industry, regional | `GET https://apps.bea.gov/api/data?UserID=&method=GetData&datasetname=NIPA&TableName=&Frequency=&Year=&ResultFormat=JSON` | `UserID` (free signup) | Not verified | Partly |
| S5 | Treasury FiscalData | Debt to the Penny, avg interest rates, Monthly Treasury Statement | Base `https://api.fiscaldata.treasury.gov/services/api/fiscal_service`; `v2/accounting/od/debt_to_penny`, `v2/accounting/od/avg_interest_rates`, `v1/accounting/mts/mts_table_N` | None | None documented. Params: `fields`, `filter=field:op:value`, `sort`, `page[size]`, `page[number]`. | Yes |
| S6 | Census Economic Indicators | Retail sales, durable goods, housing starts/sales, trade, construction | `GET https://api.census.gov/data/timeseries/eits/{program}`; programs: `marts`, `advm3`, `m3`, `resconst`, `ressales`, `ftd`, `vip`, `mtis`, `mwts`, `hv`, `bfs` | `key` query param (required) | Not stated | Yes |
| S7 | EIA v2 | Oil, gas, power | `GET https://api.eia.gov/v2/{route}/data/` with `data[]`, `facets[x][]`, `frequency`, `start`, `end`, `offset`, `length` | `api_key` in URL (not header) | 5000 rows/request (JSON). Throttled per second and per hour; numbers not published; breach suspends the key. | Yes |
| S8 | NY Fed Markets API | SOFR, repo/RRP operations, SOMA | Not verified; prefer FRED `SOFR`, `RRPONTSYD`, `WALCL` | — | — | No |
| S9 | World Bank Indicators v2 | All-country annual indicators | `GET https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=&page=&date=&mrv=` | None | 60 indicators/query, 4000-char URL, default `per_page=50`, default format XML | Yes |
| S10 | IMF Data Portal (SDMX 3.0) | WEO forecasts, fiscal, external, thematic flows | Base `https://api.imf.org/external/sdmx/3.0` (from a third-party guide). Dataflow catalog: `.../structure/dataflow`. | Possibly registration | Not verified | Partly |
| S11 | OECD Data Explorer (SDMX) | OECD members: CLI, CPI, unemployment, national accounts | SDMX REST on `sdmx.oecd.org` (exact path **unverified**) | None | Conflicting published figures: 60 downloads/hour vs 20 queries/min + 20 downloads/hour. Assume the stricter. No VPN/anonymised traffic. Use `updatedAfter` and the content-constraint endpoint to avoid refetching. | Partly |
| S12 | BIS Statistics (SDMX RESTful 2.1.0) | Policy rates, credit, property prices, effective exchange rates | Docs `https://stats.bis.org/api-doc/v2/`; bulk `https://data.bis.org/bulkdownload`; dataflow `WS_CBPOL` (policy rates) | None | Not verified | Partly |
| S13 | ECB Data Portal | Euro area rates, HICP, money, FX | `GET https://data-api.ecb.europa.eu/service/data/{flowRef}/{key}?startPeriod=`; flow list `.../service/dataflow` | None | Not verified | Yes (URL shape) |
| S14 | Eurostat dissemination API | EU members, JSON-stat 2.0 | Base `https://ec.europa.eu/eurostat/api/dissemination` (data path and params **unverified**) | None | Not verified | Partly |
| S15 | DBnomics | Prototyping only: one JSON API over IMF/OECD/WB/ECB/Eurostat/national | `GET https://api.db.nomics.world/v22/series/{provider}/{dataset}/{series}?observations=1`; Swagger at `/v22/apidocs` | None | Meant for focused queries, not bulk | Yes |

Example requests (replace keys):

```text
https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=KEY&file_type=json&observation_start=2000-01-01
https://api.stlouisfed.org/fred/series/observations?series_id=GDPC1&api_key=KEY&file_type=json&output_type=4
https://api.stlouisfed.org/fred/releases/dates?api_key=KEY&file_type=json&include_release_dates_with_no_data=true
https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=20000&date=1990:2025
https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1
https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=KEY&frequency=daily&data[]=value
```

BLS multi-series body:

```json
{"seriesid":["LNS14000000","CES0000000001"],"startyear":"2006","endyear":"2025","registrationkey":"KEY"}
```

---

## 4. US indicators needed

IDs are from prior knowledge, not live-checked. Task A4 validates every ID against `/fred/series` before the catalog is seeded. Canonical codes are country-agnostic.

### Growth and activity

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `GDP_REAL` | `GDPC1` | BEA NIPA | Q |
| `GDP_NOMINAL` | `GDP` | BEA NIPA | Q |
| `GDP_POTENTIAL` | `GDPPOT` | CBO | Q |
| `GDP_NOWCAST` | `GDPNOW` | Atlanta Fed | irregular |
| `INDUSTRIAL_PRODUCTION` | `INDPRO` | Fed G.17 | M |
| `CAPACITY_UTILIZATION` | `TCU` | Fed G.17 | M |
| `RETAIL_SALES` | `RSAFS` | Census `marts` | M |
| `DURABLE_GOODS_ORDERS` | `DGORDER` | Census `advm3` | M |
| `PERSONAL_CONSUMPTION_REAL` | `PCEC96` | BEA | M |
| `MFG_SURVEY_PHILLY` | `GACDFSA066MSFRBPHI` | Philadelphia Fed | M |
| `MFG_SURVEY_EMPIRE` | `GACDISA066MSFRBNY` | NY Fed | M |

ISM PMI is licensed and not freely available; excluded.

### Labor

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `UNEMPLOYMENT_RATE` | `UNRATE` | BLS `LNS14000000` | M |
| `UNEMPLOYMENT_RATE_U6` | `U6RATE` | BLS | M |
| `NONFARM_PAYROLLS` | `PAYEMS` | BLS `CES0000000001` | M |
| `AVG_HOURLY_EARNINGS` | `CES0500000003` | BLS | M |
| `LABOR_FORCE_PARTICIPATION` | `CIVPART` | BLS `LNS11300000` | M |
| `PRIME_AGE_EMPLOYMENT_RATIO` | `LNS12300060` | BLS | M |
| `JOBLESS_CLAIMS_INITIAL` | `ICSA` | DOL | W |
| `JOBLESS_CLAIMS_CONTINUING` | `CCSA` | DOL | W |
| `JOB_OPENINGS` | `JTSJOL` | BLS JOLTS | M |
| `EMPLOYMENT_COST_INDEX` | `ECIALLCIV` | BLS | Q |
| `PRODUCTIVITY` | `OPHNFB` | BLS `PRS85006092` | Q |

### Inflation

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `CPI_HEADLINE` | `CPIAUCSL` | BLS `CUSR0000SA0` | M |
| `CPI_CORE` | `CPILFESL` | BLS | M |
| `CPI_MEDIAN` | `MEDCPIM158SFRBCLE` | Cleveland Fed | M |
| `PCE_PRICE` | `PCEPI` | BEA | M |
| `PCE_PRICE_CORE` | `PCEPILFE` | BEA | M |
| `PPI_FINAL_DEMAND` | `PPIFIS` | BLS | M |
| `BREAKEVEN_5Y` | `T5YIE` | Treasury/FRED | D |
| `BREAKEVEN_10Y` | `T10YIE` | Treasury/FRED | D |
| `BREAKEVEN_5Y5Y_FORWARD` | `T5YIFR` | FRED | D |
| `INFLATION_EXPECTATIONS_1Y_SURVEY` | `MICH` | U. Michigan (copyright check, R1) | M |

### Monetary policy and rates

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `POLICY_RATE` | `DFF` | Fed | D |
| `POLICY_RATE_TARGET_UPPER` | `DFEDTARU` | Fed | D |
| `POLICY_RATE_TARGET_LOWER` | `DFEDTARL` | Fed | D |
| `OVERNIGHT_SECURED_RATE` | `SOFR` | NY Fed | D |
| `YIELD_1M` / `3M` / `1Y` / `2Y` / `5Y` / `10Y` / `30Y` | `DGS1MO`, `DGS3MO`, `DGS1`, `DGS2`, `DGS5`, `DGS10`, `DGS30` | Treasury | D |
| `YIELD_REAL_10Y` | `DFII10` | Treasury | D |
| `CENTRAL_BANK_ASSETS` | `WALCL` | Fed H.4.1 | W |
| `BANK_RESERVES` | `WRESBAL` | Fed H.4.1 | W |
| `TREASURY_GENERAL_ACCOUNT` | `WTREGEN` | Fed H.4.1 | W |
| `REVERSE_REPO_OVERNIGHT` | `RRPONTSYD` | NY Fed | D |
| `MONEY_SUPPLY_M2` | `M2SL` | Fed H.6 | M |

### Financial conditions and credit

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `FINANCIAL_CONDITIONS` | `NFCI` | Chicago Fed | W |
| `FINANCIAL_STRESS` | `STLFSI4` | St. Louis Fed | W |
| `CREDIT_SPREAD_HY` | `BAMLH0A0HYM2` | ICE (history truncated, R2) | D |
| `CREDIT_SPREAD_IG` | `BAMLC0A0CM` | ICE (history truncated, R2) | D |
| `DOLLAR_INDEX_BROAD` | `DTWEXBGS` | Fed | D |
| `EQUITY_VOLATILITY` | `VIXCLS` | CBOE (copyright check, R1) | D |
| `MORTGAGE_RATE_30Y` | `MORTGAGE30US` | Freddie Mac (copyright check, R1) | W |
| `LENDING_STANDARDS_CI` | `DRTSCILM` | Fed SLOOS | Q |
| `CONSUMER_CREDIT` | `TOTALSL` | Fed G.19 | M |

### Housing

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `HOUSING_STARTS` | `HOUST` | Census `resconst` | M |
| `BUILDING_PERMITS` | `PERMIT` | Census `resconst` | M |
| `NEW_HOME_SALES` | `HSN1F` | Census `ressales` | M |
| `HOME_PRICE_INDEX` | `CSUSHPINSA` | S&P (copyright check, R1) | M |

### External and trade

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `TRADE_BALANCE_GOODS_SERVICES` | `BOPGSTB` | Census `ftd` | M |
| `CURRENT_ACCOUNT` | `IEABC` (official series page verified; API check pending A4) | BEA ITA | Q |

### Fiscal

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `GOV_DEBT_TOTAL` | `GFDEBTN` | Treasury FiscalData `debt_to_penny` | Q / D |
| `GOV_DEBT_TO_GDP` | `GFDEGDQ188S` | FRED derived | Q |
| `GOV_BALANCE_TO_GDP` | `FYFSGDA188S` | Treasury | A |

### Energy and cycle

| Canonical code | FRED | Primary source | Freq |
|---|---|---|---|
| `OIL_WTI` | `DCOILWTICO` | EIA | D |
| `OIL_BRENT` | `DCOILBRENTEU` | EIA | D |
| `NATURAL_GAS_HENRY_HUB` | `DHHNGSP` | EIA | D |
| `RECESSION_FLAG` | `USREC` | NBER | M |
| `RECESSION_PROBABILITY` | `RECPROUSM156N` | FRED | M |

---

## 5. All-country indicators

Tier 2 (every country, annual). World Bank codes are from prior knowledge; validate each with `GET https://api.worldbank.org/v2/indicator/{code}?format=json` (task C2).

| Canonical code | World Bank | IMF WEO subject (validate in new portal) |
|---|---|---|
| `GDP_REAL_GROWTH` | `NY.GDP.MKTP.KD.ZG` | `NGDP_RPCH` |
| `GDP_NOMINAL_USD` | `NY.GDP.MKTP.CD` | — |
| `GDP_PER_CAPITA_USD` | `NY.GDP.PCAP.CD` | — |
| `CPI_INFLATION_ANNUAL` | `FP.CPI.TOTL.ZG` | `PCPIPCH` |
| `UNEMPLOYMENT_RATE` | `SL.UEM.TOTL.ZS` | `LUR` |
| `CURRENT_ACCOUNT_TO_GDP` | `BN.CAB.XOKA.GD.ZS` | `BCA_NGDPD` |
| `GOV_DEBT_TO_GDP` | `GC.DOD.TOTL.GD.ZS` (patchy) | `GGXWDG_NGDP` |
| `GOV_BALANCE_TO_GDP` | — | `GGXCNL_NGDP` |
| `TRADE_TO_GDP` | `NE.TRD.GNFS.ZS` | — |
| `FX_RESERVES_USD` | `FI.RES.TOTL.CD` | — |
| `FX_RATE_OFFICIAL` | `PA.NUS.FCRF` | — |
| `LENDING_RATE` | `FR.INR.LEND` | — |
| `REAL_INTEREST_RATE` | `FR.INR.RINR` | — |
| `POPULATION` | `SP.POP.TOTL` | — |

Tier 1 (higher frequency):

| Need | Source | Note |
|---|---|---|
| Policy rates, many central banks | BIS `WS_CBPOL` | Key shape `M.{ISO2}` seen in a third-party client; confirm dimensions via the BIS structure endpoint. |
| Effective exchange rates, credit gap, total credit, property prices | BIS flows (`WS_EER`, `WS_CREDIT_GAP`, `WS_TC`, `WS_SPP` from prior knowledge, **unverified**) | List dataflows first; do not hard-code names. |
| Euro area rates, HICP, money, FX | ECB (`FM`, `ICP`, `BSI`, `EXR`, `YC` flows; confirm via `/service/dataflow`) | |
| EU member states | Eurostat | Geo codes are not strictly ISO (e.g. `EL` for Greece); needs a mapping table to ISO3. |
| OECD members: CPI, unemployment, quarterly GDP, composite leading indicator | OECD | Discover dataflow ids via the SDMX structure endpoint; do not guess ids. |
| Forecasts (growth, inflation, debt, current account) | IMF WEO via the new portal | Legacy API retired 2025-11-05; IFS was split into thematic flows and old codes do not resolve. |
| Large-economy national sources (BoE, BoJ, BoC, RBA, ...) | Per central bank / statistics office | One adapter each, added by priority. |

Country master data: seed `countries` from `GET https://api.worldbank.org/v2/country?format=json&per_page=400` (iso3 `id`, `iso2Code`, name, region). Aggregates appear in this list and must be flagged `is_aggregate` (validate how they are marked).

---

## 6. Data model

All tables use `snakeCase.table(...)` as in `infrastructure/database/schemas/`. Verify composite primary key and conflict-handling syntax against the Drizzle `1.0.0-rc` docs before writing schemas (A-phase tasks).

| Table | Columns | Keys / indexes |
|---|---|---|
| `countries` | `iso3 char(3)`, `iso2 char(2)`, `name`, `currency char(3) null`, `region`, `is_aggregate bool` | PK `iso3` |
| `indicators` | `code`, `name`, `category enum`, `unit`, `frequency enum`, `seasonal_adjustment enum`, `description` | PK `code` |
| `series` | `id uuid`, `indicator_code`, `country_iso3`, `provider enum`, `provider_series_id`, `priority int`, `frequency`, `unit`, `seasonal_adjustment`, `redistributable bool`, `is_active bool`, `last_polled_at`, `next_poll_at`, `provider_last_updated_at` | PK `id`; unique `(provider, provider_series_id)`; unique `(indicator_code, country_iso3, provider)`; index `(is_active, next_poll_at)` |
| `observations` | `series_id`, `period_date date`, `value double precision`, `realtime_start date` | PK `(series_id, period_date, realtime_start)`; index `(series_id, period_date desc, realtime_start desc)` |
| `release_events` | `id`, `provider`, `release_id`, `release_name`, `scheduled_date date`, `published_at timestamptz null` | unique `(provider, release_id, scheduled_date)` |
| `feature_observations` | `country_iso3`, `feature_code`, `period_date`, `value`, `computed_at` | PK `(country_iso3, feature_code, period_date)` |
| `ingestion_runs` | `id`, `series_id`, `started_at`, `finished_at`, `status enum`, `rows_fetched`, `rows_inserted`, `error text null` | index `(series_id, started_at desc)` |

Notes:

- `value` is `double precision`: macro values do not need exact decimals and feature math runs on JS numbers. FRED returns numeric strings and `"."` for missing; skip `"."`, never store NaN.
- Latest value read: `DISTINCT ON (series_id, period_date)` ordered by `realtime_start desc`.
- Volume is small. US catalog is hundreds of series; tier 2 is roughly 14 indicators × ~200 countries × ~60 years. Plain Postgres is enough; no partitioning or extension needed.

---

## 7. Module layout

Mirror `modules/user` and `infrastructure/database/repositories/user`.

```text
modules/shared/
  constants/country.const.ts
  domain/value-objects/country-code.vo.ts
  domain/errors/country.error.ts

modules/macro/
  constants/
  domain/
    entities/            country, indicator, series, observation
    value-objects/       indicator-code, frequency, seasonal-adjustment, provider
    errors/
    features/            growth.ts, rolling.ts, spread.ts, liquidity.ts, sahm.ts, taylor.ts, regime.ts, definitions.ts
  application/
    ports/               macro-data-provider.port.ts, series-repository.port.ts, observation-repository.port.ts, feature-repository.port.ts, macro.port.ts
    dtos/requests|responses
    errors/
    use-cases/           ingest-series, backfill-series, compute-features, get-series, get-overview, compare-countries
  index.ts

infrastructure/macro-providers/
  fred/ bls/ bea/ census/ treasury/ eia/ worldbank/ imf/ oecd/ bis/ ecb/ eurostat/
  provider-registry.ts

infrastructure/database/schemas/        country, indicator, series, observation, release-event, feature-observation, ingestion-run
infrastructure/database/repositories/macro/

workers/ingest.worker.ts, workers/feature.worker.ts
api/http/macro.routes.ts
bootstrap/worker.ts, bootstrap/api.ts
```

Provider port (single method set, one adapter per provider):

```ts
export interface MacroDataProvider {
  fetchObservations(request: FetchObservationsRequest): Promise<ProviderObservation[]>;
  fetchSeriesMetadata(providerSeriesId: string): Promise<ProviderSeriesMetadata>;
}
```

`provider-registry.ts` maps the `provider` enum to its adapter; `ingest-series` receives the registry, so a use case never imports a concrete provider.

---

## 8. Ingestion

Flow in `workers/ingest.worker.ts`:

1. Select due series: `is_active and next_poll_at <= now()`.
2. Resolve adapter by `series.provider`; fetch.
3. Normalize: parse numbers, drop missing markers, normalize units to the indicator's canonical unit (e.g. FRED `WALCL` and `RRPONTSYD` may differ between millions and billions; read units from series metadata).
4. Compare with the latest stored value per `period_date`. Insert a new row (`realtime_start = today`) only when new or changed.
5. Write an `ingestion_runs` row. On failure store the error and rethrow or log with context; never swallow.
6. Set `next_poll_at` from frequency (and from `release_events` once available).
7. If rows were inserted, enqueue feature recomputation for the series' country (section 9).

Fetch strategy per provider:

- FRED: full history for series up to monthly (small, captures revisions); `observation_start = last - 30 days` for daily. First-release history via `output_type=4`.
- BLS: batch up to 50 series per POST, 20-year windows; 500 queries/day shared by every environment using the same key.
- World Bank: one call per indicator with `country/all`, paginate with `per_page`/`page`, `date=range`.
- OECD: cache aggressively, use `updatedAfter`, hard client-side throttle at the stricter published limit.
- All providers: exponential backoff on 429/5xx; client-side throttle; set a `User-Agent`; per-request timeout.

---

## 9. Features

All pure functions in `modules/macro/domain/features/`. `p` = periods per year (M 12, Q 4, A 1). Daily series use as-of calendar lookups (value at or before `t - 365d`), not index lags. Composites across frequencies use the last known value at or before each date.

### 9.1 Per-series transforms (any country)

| Code | Formula |
|---|---|
| `mom` / `qoq` | `(x_t / x_{t-1} - 1) × 100` |
| `yoy` | `(x_t / x_{t-p} - 1) × 100` |
| `annualized_k` | `((x_t / x_{t-k})^(p/k) - 1) × 100` (`qoq_ann`: p=4,k=1; `ann_3m`: p=12,k=3; `ann_6m`: p=12,k=6) |
| `diff_k` | `x_t - x_{t-k}` (use for rates and ratios, in percentage points) |
| `ma_n` | mean of last n observations |
| `zscore_w` | `(x_t - mean_w) / stdev_w` over window w (sample stdev) |
| `percentile` | rank of `x_t` within the expanding history, 0–100 |
| `revision` | `latest_value - first_release_value` (from `realtime_start` history) |

### 9.2 US composites

| Code | Formula | Inputs |
|---|---|---|
| `SPREAD_10Y_2Y` | `YIELD_10Y - YIELD_2Y`; inversion flag when `< 0` | `DGS10`, `DGS2` (cross-check with `T10Y2Y`) |
| `SPREAD_10Y_3M` | `YIELD_10Y - YIELD_3M` | `DGS10`, `DGS3MO` (cross-check `T10Y3M`) |
| `REAL_POLICY_RATE` | `POLICY_RATE - yoy(PCE_PRICE_CORE)` (ex-post) | `DFF`, `PCEPILFE` |
| `REAL_WAGE_GROWTH` | `yoy(AVG_HOURLY_EARNINGS) - yoy(CPI_HEADLINE)` | `CES0500000003`, `CPIAUCSL` |
| `OUTPUT_GAP` | `100 × (GDP_REAL / GDP_POTENTIAL - 1)` | `GDPC1`, `GDPPOT` |
| `TAYLOR_RATE` | `2 + π + 0.5 × (π - 2) + 0.5 × OUTPUT_GAP`, with `π = yoy(PCE_PRICE_CORE)` (Taylor 1993 parameters) | above |
| `TAYLOR_GAP` | `POLICY_RATE - TAYLOR_RATE` | above |
| `NET_LIQUIDITY` | `CENTRAL_BANK_ASSETS - TREASURY_GENERAL_ACCOUNT - REVERSE_REPO_OVERNIGHT`, all in USD billions. Market convention, not an official statistic. | `WALCL`, `WTREGEN`, `RRPONTSYD` |
| `SAHM_RULE` | 3-month moving average of `UNEMPLOYMENT_RATE` minus the minimum of that 3-month average over the previous 12 months; signal when `≥ 0.50` | `UNRATE` (compare with `SAHMREALTIME`) |
| `PAYROLLS_CHANGE_3M_AVG` | mean of last 3 monthly changes of `NONFARM_PAYROLLS` | `PAYEMS` |
| `GROWTH_IMPULSE` | `yoy(INDUSTRIAL_PRODUCTION)_t - yoy(INDUSTRIAL_PRODUCTION)_{t-3}` | `INDPRO` |
| `INFLATION_IMPULSE` | `yoy(CPI_CORE)_t - yoy(CPI_CORE)_{t-3}` | `CPILFESL` |
| `REGIME` | quadrant from signs of `GROWTH_IMPULSE` and `INFLATION_IMPULSE` (rising/falling × rising/falling) | above |

### 9.3 Cross-country (phase 7)

| Code | Definition |
|---|---|
| `RANK_{indicator}` | rank of each country on the latest period common to the compared set |
| `ZSCORE_XS_{indicator}` | cross-sectional z-score at a period |
| `DIFF_VS_US_{indicator}` | `x_country - x_US` (policy rate, inflation, real rate differentials) |
| `REAL_POLICY_RATE` | same formula as 9.2, per country, requires `POLICY_RATE` and a CPI series from the same tier |

### 9.4 Rules

- Never mix providers inside one derived series unless the output records the providers used.
- Do not compute surprise vs consensus: no free consensus source. Offer `actual - previous` and `revision` only.
- Features read the latest vintage in phase 4. Point-in-time features (using `realtime_start`) are a later task.
- Golden test: compute `yoy(CPIAUCSL)` and compare with FRED `units=pc1`; same for `annualized` vs `units=pca`. Use recorded responses as fixtures.
- Recompute trigger: a series gained rows → recompute its own transforms, then every composite listing it as an input (dependency list lives in `definitions.ts`).

---

## 10. API (for the future dashboard)

Reads only from the database. Reuse the `authentication` module for access control once its routes exist.

| Route | Purpose |
|---|---|
| `GET /macro/countries` | Country list with coverage tier |
| `GET /macro/indicators?category=` | Indicator catalog |
| `GET /macro/series/:country/:indicator?from=&to=&feature=` | History, optionally a feature (`yoy`, `zscore_120`, ...) |
| `GET /macro/overview/:country` | Latest, previous, change, next release per key indicator |
| `GET /macro/compare?indicator=&countries=USA,DEU,JPN` | Aligned multi-country series |
| `GET /macro/calendar?from=&to=&country=` | Scheduled releases from `release_events` |

Responses must exclude series with `redistributable = false` (R1).

---

## 11. Work plan

### Phase 0 — Prerequisites

- [ ] P1 Decide licensing posture per provider (R1) before any paid feature exposes data.
- [ ] P2 Register keys: FRED, BLS, BEA (`UserID`), Census, EIA.
- [x] P3 Add `FRED_API_KEY`, `BLS_API_KEY`, `BEA_USER_ID`, `CENSUS_API_KEY`, `EIA_API_KEY` to `configs/env.ts` and `.env.example`.
- [x] P4 Fix volume path typo in `infrastructures/docker/composes/database.yml` (F7).
- [x] P5 Add a test runner command to `package.json` (`bun test`) for feature and mapper tests.

### Phase 1 — Foundation

- [x] B1 `Country` value object (`createCountryCode`, ISO3, uppercase, length 3) in `modules/shared`, following `currency.vo.ts`.
- [x] B2 `modules/macro` domain entities, value objects, errors.
- [x] B3 Drizzle schemas for section 6 (`countries`, `indicators`, `series`, `observations`, `release_events`, `feature_observations`, `ingestion_runs`) and migration via `bun run db:generate`.
- [x] B4 Repository ports and Drizzle implementations with mappers/errors; use `getConnection(db)`.
- [x] B5 Seed script for `countries` (World Bank list) and `indicators` (section 4 and 5 canonical codes).

### Phase 2 — US via FRED

- [x] A1 `infrastructure/macro-providers/fred`: client (`fetch`), pagination, `"."` handling, 429 backoff, throttle.
- [x] A2 `MacroDataProvider` port and `provider-registry.ts`.
- [x] A3 `ingest-series` and `backfill-series` use cases (section 8).
- [ ] A4 Script to validate every FRED id in section 4 via `/fred/series` (title, units, frequency, seasonal adjustment, `Copyright` in notes); output fills `series` seed and `redistributable`.
- [ ] A5 Seed US `series` rows (priority 1 = FRED).
- [x] A6 `bootstrap/worker.ts` composition root and `workers/ingest.worker.ts` loop (D7).
- [ ] A7 Backfill run; verify row counts against `count` from FRED.
- [x] A8 Release calendar: load `fred/releases/dates` into `release_events`; use to set `next_poll_at`.

### Phase 3 — US primary sources (only where needed)

- [ ] G1 BLS adapter (batched POST) for CPI, payrolls, unemployment, JOLTS if FRED lags.
- [ ] G2 BEA adapter (NIPA tables for GDP/PCE) for initial release timing.
- [ ] G3 Treasury FiscalData adapter: `debt_to_penny`, `avg_interest_rates`.
- [ ] G4 Census EITS adapter: retail sales, durable goods, housing.
- [ ] G5 EIA adapter: WTI, Brent, Henry Hub.
- [x] G6 Store same indicator from two providers as separate `series` rows with `priority`; reads pick the lowest priority number with data.

### Phase 4 — Features

- [x] E1 Pure transform functions (9.1) with unit tests.
- [x] E2 Frequency-aware lag and as-of alignment helpers.
- [x] E3 Composites (9.2) with a dependency list in `definitions.ts`.
- [x] E4 `compute-features` use case + `workers/feature.worker.ts`; write `feature_observations`.
- [ ] E5 Golden tests against FRED `units=pc1` / `pca` fixtures.
- [x] E6 Unit normalization table for composites (`NET_LIQUIDITY`).

### Phase 5 — API

- [x] H1 Add `elysia` (F2) and `bootstrap/api.ts`.
- [x] H2 Routes in section 10 under `api/http/`, thin handlers calling use cases.
- [ ] H3 Redis cache for `overview` and `compare` only if latency requires it (cache container already defined).

### Phase 6 — All countries, tier 2

- [x] C1 Seed all countries and aggregates; flag `is_aggregate`.
- [x] C2 Validate World Bank codes (section 5); World Bank adapter; seed `series` for all countries × indicators.
- [ ] C3 IMF WEO adapter on the new portal (resolve U3 first).
- [x] C4 Coverage report: per country, which indicators have data and latest period.

### Phase 7 — All countries, tier 1

- [ ] T1 BIS adapter for policy rates and effective exchange rates.
- [ ] T2 OECD adapter with throttle and `updatedAfter`.
- [ ] T3 ECB and Eurostat adapters; ISO2/Eurostat → ISO3 mapping table.
- [ ] T4 National adapters for the largest economies by priority.
- [x] T5 Cross-country features (9.3).

### Phase 8 — Operations

- [x] O1 Staleness check: flag series whose `period_date` is older than frequency allows.
- [x] O2 Alert on repeated `ingestion_runs` failures per provider.
- [x] O3 Required attributions displayed per provider (R1).

---

## 12. Risks and open items

| Code | Item |
|---|---|
| R1 | **Licensing.** FRED terms: third-party series flagged "Copyright" in their notes need the data owner's permission beyond personal use; apps must not replicate FRED/ALFRED's essential experience; a fixed notice ("This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.") is required; "FRED" cannot appear in the hostname. BIS terms: commercial use is allowed only if including the statistics adds no charge for subscribers, which conflicts with a paid tier. World Bank, IMF, OECD, BEA, BLS, Census, EIA terms not reviewed. Mitigation: `series.redistributable` flag and API filter; legal review before launch. |
| R2 | FRED ICE BofA credit-spread series reportedly limited to 3 years of history since April 2026 (a FRED notice for a related ICE series confirms this; the exact HY OAS id was not confirmed). Check history length in A4; find another source for long history. |
| R3 | IMF changed APIs: legacy portal retired 2025-11-05, IFS split into thematic flows without an official crosswalk. Old series codes will not work. |
| R4 | OECD published limits conflict; the stricter one must be assumed. |
| R5 | Cross-country comparability: definitions differ (unemployment, CPI baskets, fiscal coverage). Store provider and methodology with each series; flag mixed-provider comparisons. |
| R6 | Revision history grows with every restatement; monitor `observations` size. |
| R7 | BLS key limit (500 queries/day) is shared across dev and prod if the same key is used. Use separate keys. |
| R8 | Release times are in US Eastern; store `timestamptz` and convert on read using the user's `timeZone`. |

Unverified during planning:

- U1 BEA rate limits and full parameter list (the user-guide PDF could not be parsed locally; base URL and parameters seen in excerpts only).
- U2 FRED v2 authentication header name; FRED rate limits are not documented on the pages checked, so implement a client-side throttle and 429 backoff.
- U3 IMF new-portal endpoint paths, dataflow ids and whether registration is required.
- U4 OECD base URL, dataflow ids, current rate limit.
- U5 BIS data-query path, dataflow names other than `WS_CBPOL`, rate limits.
- U6 ECB `format` parameter values and limits.
- U7 Eurostat data endpoint path and filter parameters.
- U8 NY Fed Markets API (docs page did not render).
- U9 Treasury daily par yield curve and auction endpoints.
- U10 Section 5's 13 World Bank IDs are now live-validated. Section 4's FRED IDs still require A4.
- U11 Resolved: composite keys and insert conflict handling checked against official docs and exact Drizzle commit `ab785fc`; generated migrations applied to local PostgreSQL 18.

---

## 13. Implementation status

The core FRED/World Bank subsystem is implemented, but the entire roadmap is not complete. Checked items mean implemented and tested, not production deployment or commercial licensing approval. Runtime instructions and limitations are in [docs/macro.md](docs/macro.md).

| Code | State / evidence |
|---|---|
| V1 | Type checking and unit/HTTP/database integration tests pass. Three generated migrations apply successfully to a disposable PostgreSQL 18 database; repeat generation reports no schema changes. |
| V2 | Live World Bank validation confirmed all 13 indicator IDs. Local seeds created 296 countries/aggregates, 83 canonical indicators and 3,848 World Bank series. A USA real-GDP-growth backfill fetched and inserted 65 annual observations. No production database was migrated or seeded. |
| V3 | FRED HTTP behavior, metadata/release discovery, calendar persistence and release-aware polling are tested with mocked provider responses and real database transactions. Live FRED validation, US seeding/backfill and golden provider fixtures remain blocked by the missing `FRED_API_KEY` (A4, A5, A7, E5). Both validation and seeding commands are implemented. |
| V4 | All seeds use `redistributable=false`, including series without a Copyright flag. Public reads and composite provenance enforce this flag. P1/P2 remain owner actions; API attributions do not grant rights. O3 covers API responses for implemented providers, not a frontend or unimplemented adapters. |
| V5 | G1–G5 remain unimplemented conditional adapters: add only after establishing FRED coverage/timing gaps. H3 remains conditional: no Redis cache without demonstrated latency need. C3 and T1–T4 remain unimplemented; verified dataset discovery and national-source priorities are still required. |
| V6 | The repository uses structural domain/row compatibility rather than identity-only mapper wrappers. Every macro entity now has its own file extending shared `Entity`, with persisted UUID/audit metadata and preserved natural/composite keys. Constants moved to `modules/macro/constants/`; provider/seed/feature inputs remain metadata-free. Additional persisted fields are `series.methodology`, `series.provider_release_id`, and feature `source_series_ids`; `macro_feature_jobs` makes recomputation durable and rejects stale worker results. |
| V7 | Same-day conflicting revisions fail explicitly rather than overwrite a date-keyed vintage. Features retain transitive source IDs, use latest vintages and period-date as-of alignment, and are not historical release-time backtests. Country codes validate ISO3 shape, not membership; the country catalog supplies membership and aggregate flags. |
| V8 | `macro coverage` reports freshness and repeated provider failures. Worker alerts are deduplicated structured stderr events after three consecutive failures; external alert delivery is deployment work. Exact publication timestamps are never inferred from date-only calendars. |

