# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a TanStack Start full-stack React application with the following key architectural patterns:

### Tech Stack

- **Package Manager**: Bun (always use `bun` instead of `npm` or `yarn`)
- **Framework**: TanStack Start (full-stack React framework)
- **Database**: Convex for real-time data + PostgreSQL with Drizzle ORM for legacy data
- **Authentication**: Better Auth with Convex adapter (runs on Convex HTTP)
- **Styling**: Tailwind CSS with Radix UI components
- **File Storage**: AWS S3/R2 with presigned URL uploads
- **Payments**: Stripe integration for subscriptions
- **TypeScript**: Full type safety throughout

**IMPORTANT**: This project uses **bun** as its package manager. Never use `npm` or `yarn` commands. Always use `bun` equivalents (e.g., `bun install`, `bun run`, `bun add`).

**IMPORTANT**: This project uses **jujutsu (jj)** for version control, not git. Always use `jj` commands (e.g., `jj describe`, `jj git fetch`, `jj git push`, `jj status`). See AGENTS.md for the complete workflow.

**IMPORTANT**: This project uses **beads (bd)** for issue tracking. Issues live in `.beads/issues.jsonl` and are tracked in the repository. Use `bd ready` to find work, `bd create` to create issues, and `bd close` to complete them. Always run `bd sync` at session end. See AGENTS.md for the complete workflow.

### Project Structure

- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - Reusable React components with `ui/` subfolder for base components
- `src/db/` - Database configuration and schema definitions
- `src/data-access/` - Data access layer functions
- `src/fn/` - Business logic functions and middleware
- `src/hooks/` - Custom React hooks for data fetching and state management
- `src/queries/` - TanStack Query definitions for server state
- `src/utils/` - Utility functions and helpers
- `src/use-cases/` - Application use cases and business logic

### Database Schema

Core entities: `user`, `song`, `playlist`, `heart` (likes), with subscription and authentication tables. Users can upload songs, create playlists, and have subscription plans (free/basic/pro).

### Key Patterns

- **Data Fetching**: Uses TanStack Query with custom hooks pattern
- **Authentication**: Better Auth with session management
- **File Uploads**: Presigned URLs for direct S3/R2 uploads
- **Subscriptions**: Stripe-based with plan limits enforcement
- **Type Safety**: Full TypeScript with Drizzle ORM schema inference

## Common Development Commands

```bash
# Development
bun run dev                 # Start development server on port 3000
bun run build              # Build for production (includes type checking)
bun run start              # Start production server

# Linting & Formatting (REQUIRED - see Linting section below)
bun run lint                # Check for linting errors
bun run lint:fix            # Fix linting errors automatically
bun run format              # Format code with Biome

# Testing (REQUIRED - see Testing section below)
bun run test                # Run all tests once
bun run test:watch          # Run tests in watch mode
bun run test:ui             # Run tests with UI
bun run test:coverage       # Run tests with coverage report

# Database
bun run db:up              # Start PostgreSQL Docker container
bun run db:down            # Stop PostgreSQL Docker container
bun run db:migrate         # Run database migrations
bun run db:generate        # Generate new migration files
bun run db:studio          # Open Drizzle Studio for database management

# Payments (if needed)
bun run stripe:listen      # Listen for Stripe webhooks in development

# Installing dependencies
bun install                # Install all dependencies
bun add <package>          # Add a new dependency
bun add -d <package>       # Add a dev dependency
```

## Environment Setup

1. Copy `.env.example` to `.env` and configure:
   - Database connection (PostgreSQL)
   - Better Auth secrets
   - Stripe keys (for payments)
   - AWS S3/R2 credentials (for file storage)

2. Start database and run migrations:
   ```bash
   bun run db:up
   bun run db:migrate
   ```

## Linting & Code Quality

**CRITICAL**: This project uses **Biome** for linting and formatting. You MUST run lint checks and fix all errors.

### Linting Requirements

1. **Run lint before committing** - Always run `bun run lint` before committing code
2. **Fix ALL errors** - NEVER commit code with linting errors
3. **Use auto-fix** - Run `bun run lint:fix` to automatically fix issues
4. **Format code** - Run `bun run format` to format code consistently

### Linting Workflow

```bash
# After making code changes:
1. Run: bun run lint        # Check for errors
2. Run: bun run lint:fix    # Auto-fix what can be fixed
3. Manually fix remaining errors
4. Run: bun run lint        # Verify all errors are fixed
5. Commit your changes
```

### What Biome Checks

- **Code style**: Consistent formatting and indentation
- **Best practices**: Common mistakes and anti-patterns
- **Import organization**: Sorted and organized imports
- **Suspicious code**: Potential bugs and issues

**Remember**: Linting errors = broken build. Fix them immediately.

## Testing & TDD

**CRITICAL**: This project follows **Test-Driven Development (TDD)** principles. You MUST write tests for all new code.

### Testing Requirements

1. **Write tests FIRST** - Before implementing features, write failing tests
2. **Run tests OFTEN** - Use `bun run test` after every significant change
3. **All tests must pass** - NEVER commit code with failing tests
4. **Maintain coverage** - Use `bun run test:coverage` to check coverage

### Testing Workflow

```bash
# TDD Red-Green-Refactor cycle:
1. Write a failing test for the new functionality
2. Run: bun run test (test should fail - RED)
3. Write minimal code to make the test pass
4. Run: bun run test (test should pass - GREEN)
5. Refactor code while keeping tests passing
6. Run: bun run test (tests should still pass)
```

### When to Write Tests

- **New features**: Write tests before implementation
- **Bug fixes**: Write a test that reproduces the bug, then fix it
- **Refactoring**: Ensure existing tests pass, add tests for edge cases
- **API changes**: Update tests to match new API contracts

### Test Files Location

- Unit tests: Place `*.test.ts` or `*.test.tsx` files next to the code they test
- Integration tests: Use `src/__tests__/` directory
- E2E tests: Use Playwright in `tests/` directory

### Testing Tools

- **Vitest**: Unit and integration testing framework
- **@testing-library/react**: React component testing
- **happy-dom**: DOM implementation for tests
- **Playwright**: E2E testing (when needed)

**Remember**: If you write code, you MUST write tests. If tests fail, you MUST fix them before committing.

## Development Notes

- Uses TanStack Start's file-based routing system
- Database schema uses UUIDs for primary keys
- File uploads go directly to cloud storage via presigned URLs
- Subscription plans control feature access (playlists, upload limits)
- Build process includes TypeScript type checking

## Additional Information

- **Authentication** - please see `docs/authentication.md` for information about how authentication is setup on this project.
- **architecture** - please see `docs/architecture.md` for information about how the code is setup in a layered architecture on this project.
- **subscriptions** - please see `docs/subscriptions.md` for learn about how user plans and subscriptions are setup.
- **tanstack** - please see `docs/tanstack.md` for techincal implenetation detail on how to create tanstack start routes or server functions.
- **ux** - please see `docs/ux.md` for user experience guidelines to make sure this app feels consistent.
- **file-uploads** - please see `docs/file-uploads.md` for more information about how file uploads work in our code base
