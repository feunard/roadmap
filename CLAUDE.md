# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack gamified project management application built with the **Alepha Framework** (https://alepha.dev). Users create projects, manage tasks with RPG-like mechanics (XP, levels, objectives), and collaborate with team members. Think of it as a roadmap tool with game mechanics to boost engagement.

## Technology Stack

- **Alepha Framework**: Type-safe full-stack framework that provides unified client/server development
- **React 19** with TypeScript for UI
- **PostgreSQL** with Alepha's type-safe ORM (based on Drizzle)
- **Vite** for bundling and development
- **Biome** for linting and formatting
- **Mantine UI** component library
- **TipTap** for rich text editing
- **Vercel** for deployment

## Common Commands

```bash
# Development
pnpm dev                 # Start Vite dev server (client + server)

# Quality checks
pnpm lint                # Run Biome linting/formatting (auto-fix)
pnpm check               # TypeScript type checking (no emit)
pnpm test                # Run Vitest tests
pnpm verify              # Run all checks + build (pre-commit workflow)

# Build and deploy
pnpm build               # Build for production (creates dist/)
pnpm start               # Run production build locally
pnpm deploy              # Deploy to Vercel from dist/

# Testing
vitest run               # Run all tests once
vitest                   # Run in watch mode
vitest run path/to/file  # Run single test file
```

## Architecture

### Alepha Framework Patterns

Alepha uses **descriptors** (special prefixed functions) to define the application structure:

- **`$action`**: Server-side API endpoints with type-safe schemas (defined in `src/api/*Api.ts`)
- **`$page`**: Route definitions with lazy-loaded components (defined in routers like `src/AppRouter.ts`)
- **`$module`**: Groups related services/APIs together (see `src/api/index.ts`, `src/services/index.ts`)
- **`$inject`**: Dependency injection for services
- **`$repository`**: Type-safe database repositories (defined in `src/providers/Db.ts`)
- **`$entity`**: Database table schemas with Alepha's ORM
- **`$client`**: Client-side typed API calls (auto-generated from server `$action` definitions)
- **`$hook`**: Event handlers (e.g., `client:onError`, `form:submit:error`)

### Project Structure

```
src/
├── index.server.ts          # Server entry point (with server plugins)
├── index.browser.ts         # Browser entry point (with client plugins)
├── AppRouter.ts             # Main routing configuration
├── api/                     # Server-side API endpoints ($action)
│   ├── index.ts            # RoadmapApi module definition
│   ├── TaskApi.ts          # Task management endpoints
│   ├── ProjectApi.ts       # Project CRUD endpoints
│   └── ...
├── components/              # React components organized by feature
│   ├── auth/               # Auth-related pages (Login, Profile, etc.)
│   ├── project/            # Project views and task management
│   ├── admin/              # Admin panel components
│   └── shared/             # Reusable UI components
├── providers/               # Core infrastructure services
│   ├── Db.ts               # Database entities and repositories
│   └── Security.ts         # Authorization checks
├── services/                # Client/server shared services
│   ├── index.ts            # RoadmapServices module definition
│   └── CharacterInfo.ts    # XP/leveling calculations
└── schemas/                 # Validation schemas (e.g., taskCreateSchema)
```

### Key Concepts

**Dual Entry Points**:
- `index.server.ts` initializes server-only plugins (Helmet, Security, Compress)
- `index.browser.ts` is minimal (client-only setup)
- Both share common modules (RoadmapServices, AppRouter)

**Type-Safe API Flow**:
1. Define `$action` in `src/api/SomeApi.ts` with schema
2. Use `$client<SomeApi>()` in components to get fully typed API calls
3. Schemas are validated at runtime and enforced at compile-time

**Database Layer**:
- All entities defined in `src/providers/Db.ts` using `$entity`
- Repositories auto-generated from entities with type-safe methods
- Use `this.db.tableName.method()` pattern (e.g., `this.db.tasks.findById()`)

**Routing**:
- Routes defined in `AppRouter.ts`, `MeRouter.ts`, `AdminRouter.ts`
- Each `$page` can have:
  - `resolve`: async data fetching before render
  - `lazy`: code-split component loading
  - `errorHandler`: custom error boundaries
  - `onLeave`: cleanup when navigating away

**State Management**:
- Alepha's global state: `alepha.state.set/get` (e.g., `current_project`, `user_projects`)
- Used to share data between routes and components

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `APP_SECRET`, `COOKIE_SECRET`: Session/auth secrets
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`: OAuth providers
- `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`: For deployments

## Database Management

Alepha uses a PostgreSQL ORM layer. Migrations are handled via Drizzle Kit (if configured). The database schema is defined through `$entity` descriptors in `src/providers/Db.ts`.

## Testing

Tests use Vitest. Currently minimal coverage with a placeholder test in `test/dummy.spec.ts`. When writing tests:
- Place test files adjacent to source files (`.test.ts`) or in `test/` directory
- Use Vitest's `describe`, `it`, `expect` API
- Run `pnpm test` to execute all tests

## Working with This Codebase

1. **Adding a new API endpoint**: Create a `$action` in the relevant `*Api.ts` file, add to the module in `src/api/index.ts`
2. **Adding a new page**: Define a `$page` in `AppRouter.ts` (or sub-router) with `lazy` import
3. **Database changes**: Modify entities in `src/providers/Db.ts`, then handle migrations
4. **UI components**: Use Mantine components from `@mantine/core`, follow existing patterns in `src/components/`
5. **Calling APIs from client**: Use `$client<ApiClass>()` to get typed methods

## Alepha-Specific Notes

- **File extensions**: Use `.js` extensions in imports even though files are `.ts` (Alepha/Vite transpiles)
- **Dependency injection**: Services are singletons, injected via `$inject(ClassName)`
- **Validation**: Use Alepha's `t` schema builder (similar to Zod) for runtime validation
- **Authentication**: Built-in via `AlephaReactAuth` plugin, user available in `$action` handlers and `$page` resolvers
