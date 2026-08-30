# Backend Architecture

## Overview

This backend is a TypeScript modular monolith.

The main architectural goals are:

1. Keep business logic independent from Fastify.
2. Keep modules independent from infrastructure technologies.
3. Allow both the HTTP API and background workers to reuse the same application/domain logic.
4. Keep external systems such as PostgreSQL, Redis, FRED, and news providers behind contracts.
5. Make dependencies point inward toward the business logic.

The backend uses:

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Redis
- BullMQ
- Docker
- External macroeconomic/news providers

---

# Directory Structure

```text
server/
└── backend/
    ├── bootstrap/
    │   ├── api.ts
    │   └── worker.ts
    │
    ├── config/
    │   └── ...
    │
    ├── api/
    │   └── http/
    │       ├── controllers/
    │       ├── routes/
    │       ├── schemas/
    │       └── plugins/
    │
    ├── infrastructure/
    │   ├── database/
    │   ├── providers/
    │   │   ├── fred/
    │   │   └── news/
    │   ├── redis/
    │   └── queue/
    │
    ├── modules/
    │   ├── macro/
    │   │   ├── domain/
    │   │   ├── application/
    │   │   └── ports/
    │   │
    │   └── news/
    │       ├── domain/
    │       ├── application/
    │       └── ports/
    │
    └── worker/
        ├── jobs/
        └── processors/
```

---

# Architecture

The backend follows Clean Architecture principles at the application level and uses Ports & Adapters principles for module boundaries.

The most important rule is:

> Dependencies should point toward the business logic, not toward infrastructure or frameworks.

Conceptually:

```text
                    interfaces/http
                         │
                         ▼
                  ┌──────────────┐
                  │  application │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    domain    │
                  └──────────────┘
                         ▲
                         │
                       ports
                         ▲
                         │
                  infrastructure
```

Fastify, PostgreSQL, Redis, FRED, and external news APIs are implementation details.

The application should not depend directly on them.

---

# 1. modules/

`modules/` contains the actual business capabilities of the application.

For example:

```text
modules/
├── macro/
└── news/
```

Each module represents a business/domain boundary.

A module should contain:

```text
module/
├── domain/
├── application/
└── ports/
```

---

# 2. domain/

`domain/` contains business concepts and rules.

Examples:

```text
domain/
├── entities/
├── value-objects/
└── rules/
```

The domain must not know about:

* Fastify
* HTTP
* PostgreSQL
* Redis
* BullMQ
* FRED
* external APIs

Example:

```ts
export class EconomicSeries {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly frequency: string,
  ) {}
}
```

Domain code should represent the actual business problem, not technical implementation details.

---

# 3. application/

`application/` contains application use cases and services.

Examples:

```text
application/
├── get-economic-series.ts
├── sync-economic-series.ts
└── calculate-growth-rate.ts
```

The application layer coordinates domain logic and dependencies.

Example:

```ts
export class GetEconomicSeries {
  constructor(
    private readonly provider: EconomicDataProvider,
  ) {}

  async execute(seriesId: string) {
    return this.provider.getSeries(seriesId);
  }
}
```

The application layer does not know that `EconomicDataProvider` is implemented by FRED.

It only knows the contract.

---

# 4. ports/

`ports/` contains contracts required by the module to communicate across its boundary.

Example:

```text
modules/macro/ports/
└── economic-data-provider.ts
```

```ts
export interface EconomicDataProvider {
  getSeries(seriesId: string): Promise<EconomicSeries>;
}
```

The module says:

> "I need something capable of providing economic data."

It does not say:

> "I need FRED."

That distinction is important.

The concrete implementation belongs outside the module.

---

# 5. Infrastructure

`infrastructure/` contains implementations that interact with external technologies.

Examples:

```text
infrastructure/
├── database/
├── providers/
│   ├── fred/
│   └── news/
├── redis/
└── queue/
```

For example:

```text
infrastructure/providers/fred/
└── fred-economic-data-provider.ts
```

```ts
export class FredEconomicDataProvider
  implements EconomicDataProvider
{
  async getSeries(seriesId: string) {
    // Call FRED API
  }
}
```

The dependency relationship is:

```text
modules/macro/ports/
        │
        │ defines contract
        ▼
EconomicDataProvider
        ▲
        │ implements
        │
infrastructure/providers/fred/
```

The module owns the contract.

Infrastructure owns the implementation.

---

# 6. interfaces/http/

`interfaces/http/` contains the HTTP adapter.

This is where Fastify belongs.

```text
interfaces/http/
├── controllers/
├── routes/
├── schemas/
└── plugins/
```

The HTTP layer translates HTTP requests into application operations.

Example:

```ts
export async function getEconomicSeries(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await getEconomicSeries.execute(
    request.params.seriesId,
  );

  return reply.send(result);
}
```

The controller knows about Fastify.

The application service does not.

Therefore:

```text
Fastify
   ↓
Controller
   ↓
Application
   ↓
Domain
```

Fastify should never leak into the domain/application logic.

---

# 7. bootstrap/

`bootstrap/` is responsible for starting and composing the application.

It connects concrete implementations to abstractions.

Example:

```text
bootstrap/
├── api.ts
└── worker.ts
```

Conceptually:

```ts
const provider = new FredEconomicDataProvider();

const getEconomicSeries = new GetEconomicSeries(
  provider,
);

const app = createHttpApplication({
  getEconomicSeries,
});

await app.listen();
```

`bootstrap/` is where dependency wiring happens.

It is allowed to know about:

* Fastify
* PostgreSQL
* Redis
* FRED implementations
* application services
* infrastructure implementations

This is intentionally one of the outermost layers.

---

# 8. worker/

The backend has two major entry points:

```text
API
Worker
```

The worker handles background processing.

For example:

```text
worker/
├── jobs/
└── processors/
```

A job might be:

```text
fetch-macro-data
```

The worker should reuse the same application/domain logic used by the API.

Example:

```text
BullMQ Job
    ↓
Worker processor
    ↓
Application use case
    ↓
Domain
    ↓
Port
    ↓
Infrastructure implementation
```

The worker does not need Fastify.

---

# API Flow

When a user requests macroeconomic data:

```text
Browser
   │
   │ HTTP
   ▼
Fastify
   │
   ▼
HTTP Controller
   │
   ▼
Application Use Case
   │
   ▼
Port
   │
   ▼
Infrastructure
   │
   ▼
PostgreSQL
```

For example:

```text
GET /api/macro/GDP
        ↓
getEconomicSeriesController
        ↓
GetEconomicSeries.execute()
        ↓
EconomicDataRepository
        ↓
PostgresEconomicDataRepository
        ↓
PostgreSQL
```

---

# Worker Flow

Background ingestion works differently.

```text
Scheduler
    ↓
BullMQ
    ↓
Worker
    ↓
Application Use Case
    ↓
Port
    ↓
Provider
    ↓
FRED / News API
    ↓
PostgreSQL
```

Example:

```text
Scheduled job
    ↓
fetch-economic-series
    ↓
Worker processor
    ↓
SyncEconomicSeries
    ↓
EconomicDataProvider
    ↓
FredEconomicDataProvider
    ↓
FRED
    ↓
EconomicSeriesRepository
    ↓
PostgreSQL
```

The important point is that the worker does not contain the business logic itself.

It invokes application logic.

---

# API and Worker Share the Same Core

The API and worker are different entry points into the same application.

```text
                  ┌───────────────┐
                  │     API       │
                  │   Fastify     │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Application   │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    Domain     │
                  └───────────────┘
                          ▲
                          │
                  ┌───────┴───────┐
                  │    Worker     │
                  │   BullMQ      │
                  └───────────────┘
```

This prevents duplicated business logic.

---

# Ports vs Internal Logic

Not every piece of code needs a port.

If something is entirely internal to the module:

```ts
export class CalculateGrowthRate {
  execute(previous: number, current: number) {
    return ((current - previous) / previous) * 100;
  }
}
```

No port is needed.

It is simply internal application/domain logic.

A port is needed when the module depends on something outside itself.

For example:

```ts
export interface EconomicDataProvider {
  getSeries(seriesId: string): Promise<EconomicSeries>;
}
```

Because the actual provider could be:

```text
FRED
Another provider
Mock
Cached provider
Database
```

The module should not care which one.

---

# Dependency Rules

## Allowed

```text
interfaces
    ↓
application
    ↓
domain
```

```text
infrastructure
    ↓
ports
```

```text
worker
    ↓
application
```

```text
bootstrap
    ↓
everything required to compose the application
```

## Forbidden

The following should not happen:

```text
domain → Fastify
domain → PostgreSQL
domain → Redis
domain → FRED
domain → BullMQ
```

Also avoid:

```text
application → Fastify
application → PostgreSQL
application → FRED SDK
```

Instead:

```text
application → Port
infrastructure → implements Port
```

---

# Example Complete Flow

Suppose the application needs to synchronize GDP data.

The module defines:

```text
modules/macro/
├── domain/
│   └── economic-series.ts
│
├── application/
│   └── sync-economic-series.ts
│
└── ports/
    ├── economic-data-provider.ts
    └── economic-series-repository.ts
```

The infrastructure implements:

```text
infrastructure/
├── providers/
│   └── fred/
│       └── fred-economic-data-provider.ts
│
└── database/
    └── postgres/
        └── economic-series-repository.ts
```

The worker invokes:

```text
worker
   ↓
SyncEconomicSeries
   ↓
EconomicDataProvider
   ↓
FredEconomicDataProvider
   ↓
FRED
   ↓
EconomicSeriesRepository
   ↓
PostgreSQL
```

The API can later invoke:

```text
Fastify
   ↓
GetEconomicSeries
   ↓
EconomicSeriesRepository
   ↓
PostgreSQL
```

Both use the same module.

---

# Why Fastify Is Not Inside modules/

Fastify is an implementation detail of the HTTP interface.

Therefore:

```text
interfaces/http/
```

knows Fastify.

But:

```text
modules/
```

does not.

This allows the same application logic to be used by:

```text
Fastify
Worker
CLI
Tests
Future transport
```

without changing the business logic.

---

# Why Infrastructure Is Outside modules/

The module defines what it needs.

Infrastructure decides how to provide it.

For example:

```text
Module:

EconomicDataProvider
        ↑
        │ contract
```

Implementation:

```text
FRED
        ↓
FredEconomicDataProvider
        ↓
EconomicDataProvider
```

This keeps external technology replaceable.

If FRED is replaced by another provider, the module should not need to know.

---

# Mental Model

Remember these five questions:

### `domain/`

> What are the business rules?

### `application/`

> What does the application need to do?

### `ports/`

> What does this module need from the outside world?

### `infrastructure/`

> How do we technically provide those things?

### `interfaces/`

> How does the outside world communicate with our application?

And:

### `bootstrap/`

> How do we assemble all of these pieces and start the application?

---

# Final Architecture

```text
server/
└── backend/
    │
    ├── bootstrap/
    │   ├── api.ts
    │   └── worker.ts
    │
    ├── config/
    │
    ├── interfaces/
    │   └── http/
    │       ├── controllers/
    │       ├── routes/
    │       ├── schemas/
    │       └── plugins/
    │
    ├── modules/
    │   ├── macro/
    │   │   ├── domain/
    │   │   ├── application/
    │   │   └── ports/
    │   │
    │   └── news/
    │       ├── domain/
    │       ├── application/
    │       └── ports/
    │
    ├── infrastructure/
    │   ├── database/
    │   ├── providers/
    │   │   ├── fred/
    │   │   └── news/
    │   ├── redis/
    │   └── queue/
    │
    └── worker/
        ├── jobs/
        └── processors/
```

## Core Rule

> **Modules contain business logic. Ports define module boundaries. Infrastructure implements those boundaries. Interfaces expose the application. Bootstrap wires everything together. Worker and API are entry points that reuse the same application logic.**

```
