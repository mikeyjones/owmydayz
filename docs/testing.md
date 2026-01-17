# Testing Guide

This document explains the testing infrastructure and patterns used in this TanStack Start application. The testing setup uses Vitest, React Testing Library, and provides comprehensive coverage reporting.

## Testing Stack

- **Vitest** - Fast, modern test runner with native ESM support
- **React Testing Library** - Component testing utilities focused on user behavior
- **happy-dom** - Lightweight browser environment simulation
- **@testing-library/jest-dom** - Custom DOM element matchers

## Running Tests

```bash
# Run tests once (CI mode)
bun test

# Run tests in watch mode (re-runs on file changes)
bun test:watch

# Run tests with visual UI in browser
bun test:ui

# Run tests with coverage report
bun test:coverage

# Run tests with coverage in watch mode
bun test:coverage:watch
```

## Test File Organization

Test files are co-located with their source files using the `.test.ts` or `.test.tsx` extension:

```
src/
├── components/
│   └── ui/
│       ├── badge.tsx
│       └── badge.test.tsx      # Component tests
├── hooks/
│   ├── useCurrentUser.ts
│   └── useCurrentUser.test.ts  # Hook tests
├── lib/
│   ├── utils.ts
│   └── utils.test.ts           # Utility tests
└── utils/
    ├── date.ts
    └── date.test.ts            # Utility tests
```

## Testing Patterns

### 1. Pure Function Tests

For utility functions without side effects, test inputs and outputs directly.

**Example**: `src/utils/date.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { dateToLocalDateTime, formatDateTime } from "./date";

describe("dateToLocalDateTime", () => {
  it("should convert Date to local datetime string format", () => {
    const date = new Date("2024-06-15T14:30:00");
    const result = dateToLocalDateTime(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("should pad single-digit months and days with zeros", () => {
    const date = new Date("2024-01-05T09:05:00");
    const result = dateToLocalDateTime(date);
    expect(result).toBe("2024-01-05T09:05");
  });
});
```

### 2. React Component Tests

Use React Testing Library to test components based on user behavior, not implementation details.

**Example**: `src/components/ui/badge.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText("Secondary");
    expect(badge).toHaveClass("bg-secondary");
  });

  it("merges custom className with default classes", () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge).toHaveClass("custom-class");
    expect(badge).toHaveClass("bg-primary");
  });
});
```

### 3. Custom Hook Tests

Use `renderHook` from React Testing Library to test hooks in isolation.

**Example**: `src/hooks/useCurrentUser.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCurrentUser, useRequireAuth } from "./useCurrentUser";
import { authClient } from "~/lib/auth-client";

// Mock is defined in vitest.setup.ts, override for specific tests
describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null user when not authenticated", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("returns user data when authenticated", () => {
    const mockUser = { id: "user-123", name: "Test User" };
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: mockUser },
      isPending: false,
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 4. className Utility Tests

Test the `cn()` utility for Tailwind class merging and conflict resolution.

**Example**: `src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    const result = cn("class1", "class2", "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base", isActive && "active", isDisabled && "disabled");
    expect(result).toBe("base active");
  });

  it("resolves Tailwind class conflicts", () => {
    // Later classes override earlier conflicting classes
    const result = cn("p-4", "p-6");
    expect(result).toBe("p-6");
  });
});
```

## Global Test Setup

The `vitest.setup.ts` file configures global test behavior:

### Automatic Cleanup

React Testing Library's `cleanup()` runs after each test to unmount components.

### External Dependency Mocks

The following dependencies are mocked globally:

**Authentication (`~/lib/auth-client`)**:
```typescript
vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    getSession: vi.fn(() => Promise.resolve(null)),
  },
}));
```

**Convex (`convex/react`)**:
```typescript
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(() => ({})),
}));
```

**Browser APIs**:
```typescript
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    // ... other MediaQueryList properties
  })),
});
```

## Coverage Configuration

Coverage is configured with the following thresholds:

| Metric     | Threshold |
|------------|-----------|
| Lines      | 70%       |
| Functions  | 70%       |
| Branches   | 70%       |
| Statements | 70%       |

Coverage reports are generated in multiple formats:
- **text** - Console output
- **html** - Browse at `coverage/index.html`
- **lcov** - For CI tools like Codecov
- **json** - Machine-readable format

### Coverage Exclusions

The following are excluded from coverage:
- Test files (`*.test.ts`, `*.test.tsx`)
- Type definitions (`*.d.ts`)
- Route files (`src/routes/**`)
- Configuration files
- Node modules

## CI/CD Integration

The test setup is CI-ready:

```bash
# Run in CI mode (no watch, exits with proper code)
CI=true bun test

# Generate coverage for CI tools
bun test:coverage
```

- Exit code `0` on success
- Exit code `1` on failure
- LCOV coverage file at `coverage/lcov.info` for upload to Codecov or similar

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see and do
2. **Use descriptive test names** - Tests should read like documentation
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Use the global mocks or override per-test
5. **Co-locate tests with source** - Place `*.test.ts` files next to their source files
6. **Use the right query** - Prefer `getByRole` and `getByLabelText` over `getByTestId`

## Troubleshooting

### Path aliases not resolving
The `vite-tsconfig-paths` plugin is included via the merged Vite config. Ensure imports use the `~/` prefix.

### Mocks not working
Check that mocks are defined before the module under test is imported. Use `vi.mock()` at the top of the file.

### Tests timing out
Increase the timeout in `vitest.config.ts` or use `it.concurrent()` for independent tests.
