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
