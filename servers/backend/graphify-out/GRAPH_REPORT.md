# Graph Report - backend  (2026-10-18)

## Corpus Check
- 186 files · ~63,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 5, .example 1, .lock 1)

## Summary
- 570 nodes · 1479 edges · 25 communities (22 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- FRED Provider
- Ports, DTOs & Worker Wiring
- Provider HTTP Client
- Auth Use Case & Hasher
- Feature Computation & Errors
- Project Config & Dependencies
- TypeScript Config
- Macro Repository & Schema
- Macro Entities & Currency
- Macro Routes & Code Errors
- DB Tables & Unit of Work
- User Request DTOs
- User Mapper & Shared VOs
- Identity Mapper & Entity Schema
- DB Connection & User Errors
- User Credential Repo
- Time Zone
- Email
- API Bootstrap & Env
- Locale
- Display Name
- Username
- User Repository Port
- User Identity Error
- Bun Types

## God Nodes (most connected - your core abstractions)
1. `MacroRepository` - 29 edges
2. `createPeriodDate()` - 24 edges
3. `compilerOptions` - 24 edges
4. `Point` - 20 edges
5. `createIngestSeries()` - 14 edges
6. `transform()` - 14 edges
7. `Frequency` - 14 edges
8. `createGetMacro()` - 13 edges
9. `createPoint()` - 13 edges
10. `main()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `fetchObservations()` --calls--> `createPeriodDate()`  [EXTRACTED]
  tests/macro.integration.test.ts → modules/macro/domain/value-objects/period-date.vo.ts
- `main()` --calls--> `createGetMacro()`  [EXTRACTED]
  bootstrap/api.ts → modules/macro/application/use-cases/get-macro.ts
- `main()` --calls--> `createSupabaseConnection()`  [EXTRACTED]
  bootstrap/worker.ts → infrastructure/database/connections/supabase.connection.ts
- `main()` --calls--> `createMacroRepository()`  [EXTRACTED]
  bootstrap/worker.ts → infrastructure/database/repositories/macro/macro-repository.drizzle.ts
- `main()` --calls--> `createFredProvider()`  [EXTRACTED]
  bootstrap/worker.ts → infrastructure/macro-providers/fred/fred.provider.ts

## Import Cycles
- None detected.

## Communities (25 total, 3 thin omitted)

### Community 0 - "FRED Provider"
Cohesion: 0.05
Nodes (40): frequencies, metadataSchema, pageSchema, releasesSchema, seriesReleaseSchema, ProviderRegistry, FetchObservationsRequest, ProviderSeriesMetadataResponse (+32 more)

### Community 1 - "Ports, DTOs & Worker Wiring"
Cohesion: 0.08
Nodes (25): main(), createProviderRegistry(), HistoryRequest, CoverageRowResponse, SeriesHistoryResponse, MacroRepository, createComputeFeatures(), createIngestSeries() (+17 more)

### Community 2 - "Provider HTTP Client"
Cohesion: 0.08
Nodes (35): createFredProvider(), createProviderHttpClient(), HttpClientOptions, parseProviderNumber(), ProviderHttpClient, countrySchema, createWorldBankProvider(), envelopeSchema (+27 more)

### Community 3 - "Auth Use Case & Hasher"
Cohesion: 0.07
Nodes (26): argon2PasswordHasher, RegisterRequest, RegisterResponse, ConfirmPasswordMismatchError, AuthenticationUseCase, PasswordHasher, UserCredentialRepository, createAuthenticationUseCase() (+18 more)

### Community 4 - "Feature Computation & Errors"
Cohesion: 0.17
Nodes (28): computeCountryFeatures(), InvalidPointError, asOf(), lagDate(), lagged(), periodKey(), sortedPoints(), combine() (+20 more)

### Community 5 - "Project Config & Dependencies"
Cohesion: 0.06
Nodes (33): dependencies, argon2, dotenv, drizzle-orm, elysia, pg, postgres, zod (+25 more)

### Community 6 - "TypeScript Config"
Cohesion: 0.07
Nodes (27): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, incremental, isolatedModules, lib, module (+19 more)

### Community 7 - "Macro Repository & Schema"
Cohesion: 0.11
Nodes (19): featureJobsTable, featureObservationsTable, ingestionRunsTable, ingestionStatus, macroAdjustment, macroCategory, macroFrequency, macroProvider (+11 more)

### Community 8 - "Macro Entities & Currency"
Cohesion: 0.16
Nodes (11): CountryInput, CURRENCY_LENGTH, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, NAME_MAX_LENGTH, InvalidCurrencyLengthError, UnsupportedCurrencyError, InvalidNameError (+3 more)

### Community 9 - "Macro Routes & Code Errors"
Cohesion: 0.13
Nodes (10): range, MacroUseCases, InvalidIndicatorCodeError, InvalidPeriodDateError, COUNTRY_ISO2_LENGTH, COUNTRY_ISO3_LENGTH, InvalidCountryIso2Error, InvalidCountryIso3Error (+2 more)

### Community 10 - "DB Tables & Unit of Work"
Cohesion: 0.14
Nodes (15): countriesTable, indicatorsTable, seriesTable, createDrizzleUnitOfWork(), url(), modules_macro_index_createfeaturecode, modules_macro_index_createindicatorcode, modules_macro_index_createperioddate (+7 more)

### Community 11 - "User Request DTOs"
Cohesion: 0.20
Nodes (8): modules_shared_index_default_currency, CreateNewUserRequest, CreateNewUserResponse, EmailAlreadyTakenError, UsernameAlreadyTakenError, UserUseCase, createUserUseCase(), createUser()

### Community 12 - "User Mapper & Shared VOs"
Cohesion: 0.14
Nodes (14): SelectUsersTable, Locale, TimeZone, modules_shared_index_createcurrency, modules_shared_index_createlocale, modules_shared_index_createtimezone, modules_shared_index_currency, modules_shared_index_locale (+6 more)

### Community 13 - "Identity Mapper & Entity Schema"
Cohesion: 0.26
Nodes (8): entity, authProviderEnum, SelectUserIdentitiesTable, userIdentitiesTable, usersTable, UserIdentity, modules_authentication_index_useridentity, drizzle-orm

### Community 14 - "DB Connection & User Errors"
Cohesion: 0.23
Nodes (8): Database, DatabaseContext, Transaction, FailedToCreateUserError, als, modules_shared_index_unitofwork, modules_user_index_userrepository, ref_async_hooks

### Community 15 - "User Credential Repo"
Cohesion: 0.23
Nodes (8): FailedToCreateUserCredentialError, toUserCredentialEntity(), createUserCredentialRepository(), SelectUserCredentialsTable, userCredentialsTable, getConnection(), modules_authentication_index_usercredential, modules_authentication_index_usercredentialrepository

### Community 16 - "Time Zone"
Cohesion: 0.31
Nodes (6): toUserEntity(), createUserRepository(), MAX_TIME_ZONE_LENGTH, InvalidTimeZoneError, TimeZoneTooLongError, createTimeZone()

### Community 17 - "Email"
Cohesion: 0.31
Nodes (5): MAX_EMAIL_LENGTH, EmailTooLongError, InvalidEmailError, createEmail(), Email

### Community 18 - "API Bootstrap & Env"
Cohesion: 0.33
Nodes (7): createMacroRoutes(), main(), ENV, envSchema, createSupabaseConnection(), createMacroRepository(), zod

### Community 19 - "Locale"
Cohesion: 0.42
Nodes (4): MAX_LOCALE_LENGTH, InvalidLocaleError, LocaleTooLongError, createLocale()

### Community 20 - "Display Name"
Cohesion: 0.42
Nodes (5): MAX_DISPLAY_NAME_LENGTH, MIN_DISPLAY_NAME_LENGTH, InvalidDisplayNameError, createDisplayName(), DisplayName

### Community 21 - "Username"
Cohesion: 0.42
Nodes (5): MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH, InvalidUsernameError, createUsername(), Username

## Knowledge Gaps
- **81 isolated node(s):** `range`, `envSchema`, `argon2PasswordHasher`, `macroFrequency`, `macroProvider` (+76 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Entity` connect `FRED Provider` to `Ports, DTOs & Worker Wiring`, `Auth Use Case & Hasher`, `Macro Entities & Currency`, `DB Tables & Unit of Work`, `User Mapper & Shared VOs`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `Identity Mapper & Entity Schema` to `DB Tables & Unit of Work`, `Project Config & Dependencies`, `DB Connection & User Errors`, `Macro Repository & Schema`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `MacroRepository` connect `Ports, DTOs & Worker Wiring` to `FRED Provider`, `Provider HTTP Client`, `DB Tables & Unit of Work`, `Macro Repository & Schema`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `createIngestSeries()` (e.g. with `.completeRun()` and `.failRun()`) actually correct?**
  _`createIngestSeries()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `range`, `envSchema`, `argon2PasswordHasher` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FRED Provider` be split into smaller, more focused modules?**
  _Cohesion score 0.05290490100616683 - nodes in this community are weakly interconnected._
- **Should `Ports, DTOs & Worker Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.07597895967270601 - nodes in this community are weakly interconnected._