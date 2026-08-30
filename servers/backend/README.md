# Backend Architecture

## Overview

This backend is a TypeScript modular monolith.

The main architectural goals are:

1. Keep business logic independent from Elysia.
2. Keep modules independent from infrastructure technologies.
3. Allow both the HTTP API and background workers to reuse the same application/domain logic.
4. Keep external systems such as PostgreSQL behind contracts.
5. Make dependencies point inward toward the business logic.

The backend uses:

- Bun
- TypeScript
- Elysia
- PostgreSQL (Supabase)
- Drizzle ORM
- Zod
- Argon2

---

# Directory Structure

```text
backend/
├── bootstrap/
│   ├── api.ts
│   └── worker.ts
│
├── configs/
│   └── env.ts
│
├── api/
│   └── http/
│
├── infrastructure/
│   ├── argon2-password-hasher.ts
│   └── database/
│       ├── connections/
│       ├── migrations/
│       ├── repositories/
│       │   ├── authentication/
│       │   └── user/
│       ├── schemas/
│       └── unit-of-work/
│
├── modules/
│   ├── authentication/
│   │   ├── domain/
│   │   ├── application/
│   │   └── index.ts
│   │
│   ├── user/
│   │   ├── domain/
│   │   ├── application/
│   │   └── index.ts
│   │
│   └── shared/
│       ├── domain/
│       ├── application/
│       ├── constants/
│       └── index.ts
│
└── workers/
```

---

# Architecture

The backend follows Clean Architecture principles at the application level and uses Ports & Adapters principles for module boundaries.

The most important rule is:

> Dependencies should point toward the business logic, not toward infrastructure or frameworks.

Conceptually:

```text
                    api/http
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

Elysia and PostgreSQL are implementation details.

The application should not depend directly on them.

---

# 1. modules/

`modules/` contains the actual business capabilities of the application.

Current modules:

```text
modules/
├── authentication/
├── user/
└── shared/
```

Each module represents a business/domain boundary.

A module contains:

```text
module/
├── domain/
├── application/
└── index.ts
```

`shared/` holds cross-module domain primitives (value objects, constants, unit-of-work port) reused by other modules.

Ports for a module live inside `module/application/ports/`, not in a separate top-level `ports/` folder.

---

# 2. domain/

`domain/` contains business concepts and rules.

Examples:

```text
domain/
├── entities/
├── value-objects/
├── errors/
└── types/
```

The domain must not know about:

* Elysia
* HTTP
* PostgreSQL
* Drizzle

Example:

```ts
export class UserIdentity {
  constructor(
    readonly id: string,
    readonly email: string,
  ) {}
}
```

Domain code should represent the actual business problem, not technical implementation details.

---

# 3. application/

`application/` contains application use cases, ports, and DTOs.

Examples:

```text
application/
├── use-cases/
│   └── authentication.use-case.ts
├── ports/
│   ├── authentication.port.ts
│   ├── password-hasher.port.ts
│   └── user-credential-repository.port.ts
├── dtos/
│   ├── requests/
│   └── responses/
└── errors/
```

The application layer coordinates domain logic and dependencies through ports.

Example:

```ts
export class AuthenticationUseCase {
  constructor(
    private readonly credentialRepository: UserCredentialRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async register(input: RegisterRequest) {
    // ...
  }
}
```

The application layer does not know that `PasswordHasherPort` is implemented with Argon2.

It only knows the contract.

---

# 4. ports (application/ports/)

Ports are contracts a module needs to communicate across its boundary. They live under each module's `application/ports/` directory.

Example:

```text
modules/authentication/application/ports/
├── authentication.port.ts
├── password-hasher.port.ts
└── user-credential-repository.port.ts
```

```ts
export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
```

The module says:

> "I need something capable of hashing passwords."

It does not say:

> "I need Argon2."

The concrete implementation belongs outside the module, in `infrastructure/`.

---

# 5. Infrastructure

`infrastructure/` contains implementations that interact with external technologies.

Current structure:

```text
infrastructure/
├── argon2-password-hasher.ts
└── database/
    ├── connections/
    │   └── supabase.connection.ts
    ├── migrations/
    ├── repositories/
    │   ├── authentication/
    │   │   ├── errors/
    │   │   ├── mappers/
    │   │   └── user-credential.drizzle.ts
    │   └── user/
    │       ├── errors/
    │       ├── mappers/
    │       └── user-repository.drizzle.ts
    ├── schemas/
    └── unit-of-work/
        └── unit-of-work.drizzle.ts
```

For example:

```ts
export class Argon2PasswordHasher implements PasswordHasherPort {
  async hash(plain: string) {
    // Call argon2
  }
}
```

The dependency relationship is:

```text
modules/authentication/application/ports/
        │
        │ defines contract
        ▼
PasswordHasherPort
        ▲
        │ implements
        │
infrastructure/argon2-password-hasher.ts
```

The module owns the contract.

Infrastructure owns the implementation.

Database access uses Drizzle ORM against a Supabase-hosted PostgreSQL instance, with repositories per module (`user-repository.drizzle.ts`, `user-credential.drizzle.ts`) and a shared unit-of-work implementation.

---

# 6. api/http/

`api/http/` contains the HTTP adapter.

This is where Elysia belongs.

The HTTP layer translates HTTP requests into application operations.

Example:

```ts
export const authRoutes = new Elysia({ prefix: "/auth" }).post(
  "/register",
  async ({ body }) => {
    return authenticationUseCase.register(body);
  },
);
```

The route handler knows about Elysia.

The application service does not.

Therefore:

```text
Elysia
   ↓
Route handler
   ↓
Application
   ↓
Domain
```

Elysia should never leak into the domain/application logic.

---

# 7. bootstrap/

`bootstrap/` is responsible for starting and composing the application.

It connects concrete implementations to abstractions.

```text
bootstrap/
├── api.ts
└── worker.ts
```

Conceptually:

```ts
const passwordHasher = new Argon2PasswordHasher();
const credentialRepository = new UserCredentialRepositoryDrizzle();

const authenticationUseCase = new AuthenticationUseCase(
  credentialRepository,
  passwordHasher,
);

const app = new Elysia().use(authRoutes);

app.listen(3000);
```

`bootstrap/` is where dependency wiring happens.

It is allowed to know about:

* Elysia
* PostgreSQL / Drizzle
* application services
* infrastructure implementations

This is intentionally one of the outermost layers.

---

# 8. workers/

The backend has two entry points:

```text
API
Worker
```

The worker handles background processing and should reuse the same application/domain logic used by the API.

The worker does not need Elysia.

---

# API Flow

When a client hits an authentication endpoint:

```text
Client
   │
   │ HTTP
   ▼
Elysia
   │
   ▼
Route handler
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
POST /auth/register
        ↓
authRoutes handler
        ↓
AuthenticationUseCase.register()
        ↓
UserCredentialRepositoryPort
        ↓
UserCredentialDrizzle
        ↓
PostgreSQL (Supabase)
```

---

# API and Worker Share the Same Core

The API and worker are different entry points into the same application.

```text
                  ┌───────────────┐
                  │     API       │
                  │   Elysia      │
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
                  └───────────────┘
```

This prevents duplicated business logic.

---

# Ports vs Internal Logic

Not every piece of code needs a port.

If something is entirely internal to the module (e.g. a value object rule), no port is needed. It is simply internal application/domain logic.

A port is needed when the module depends on something outside itself, such as:

```text
Password hashing (Argon2)
Credential persistence (PostgreSQL)
```

The module should not care which concrete technology fulfills the port.

---

# Dependency Rules

## Allowed

```text
api/http
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

```text
domain → Elysia
domain → PostgreSQL
domain → Drizzle
```

Also avoid:

```text
application → Elysia
application → PostgreSQL driver
```

Instead:

```text
application → Port
infrastructure → implements Port
```

---

# Example Complete Flow

The authentication module defines:

```text
modules/authentication/
├── domain/
│   └── entities/
│       ├── user-credential.entity.ts
│       └── user-identity.entity.ts
│
└── application/
    ├── use-cases/
    │   └── authentication.use-case.ts
    └── ports/
        ├── authentication.port.ts
        ├── password-hasher.port.ts
        └── user-credential-repository.port.ts
```

The infrastructure implements:

```text
infrastructure/
├── argon2-password-hasher.ts
└── database/
    └── repositories/
        └── authentication/
            └── user-credential.drizzle.ts
```

The API invokes:

```text
Elysia
   ↓
AuthenticationUseCase
   ↓
UserCredentialRepositoryPort
   ↓
UserCredentialDrizzle
   ↓
PostgreSQL
```

---

# Why Elysia Is Not Inside modules/

Elysia is an implementation detail of the HTTP interface.

Therefore:

```text
api/http/
```

knows Elysia.

But:

```text
modules/
```

does not.

This allows the same application logic to be used by:

```text
Elysia
Worker
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

PasswordHasherPort
        ↑
        │ contract
```

Implementation:

```text
Argon2
        ↓
Argon2PasswordHasher
        ↓
PasswordHasherPort
```

This keeps external technology replaceable. If Argon2 is replaced by another hashing library, the module should not need to know.

---

# Mental Model

Remember these questions:

### `domain/`

> What are the business rules?

### `application/`

> What does the application need to do?

### `application/ports/`

> What does this module need from the outside world?

### `infrastructure/`

> How do we technically provide those things?

### `api/http/`

> How does the outside world communicate with our application?

And:

### `bootstrap/`

> How do we assemble all of these pieces and start the application?

---

# Final Architecture

```text
backend/
├── bootstrap/
│   ├── api.ts
│   └── worker.ts
│
├── configs/
│   └── env.ts
│
├── api/
│   └── http/
│
├── modules/
│   ├── authentication/
│   │   ├── domain/
│   │   └── application/
│   │
│   ├── user/
│   │   ├── domain/
│   │   └── application/
│   │
│   └── shared/
│       ├── domain/
│       ├── application/
│       └── constants/
│
├── infrastructure/
│   ├── argon2-password-hasher.ts
│   └── database/
│       ├── connections/
│       ├── migrations/
│       ├── repositories/
│       ├── schemas/
│       └── unit-of-work/
│
└── workers/
```

## Core Rule

> **Modules contain business logic. Ports (inside each module's `application/ports/`) define module boundaries. Infrastructure implements those boundaries. `api/http` exposes the application via Elysia. Bootstrap wires everything together. Worker and API are entry points that reuse the same application logic.**
