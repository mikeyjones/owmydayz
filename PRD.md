# Product Requirements Document: Vitest Testing Infrastructure Setup

## Overview

Implement comprehensive testing infrastructure using Vitest, React Testing Library, and coverage reporting for the TanStack Start application.

---

## Requirements

### 1. Dependencies ✅

**Status:** COMPLETED

**Description:** Install all required testing dependencies using Bun package manager

#### Acceptance Criteria
- [x] vitest package installed in devDependencies
- [x] @vitest/ui package installed in devDependencies
- [x] @vitest/coverage-v8 package installed in devDependencies
- [x] @testing-library/react package installed in devDependencies
- [x] @testing-library/jest-dom package installed in devDependencies
- [x] @testing-library/user-event package installed in devDependencies
- [x] happy-dom package installed in devDependencies

#### Steps to Verify
- [x] Run 'bun vitest --version' and confirm version is displayed
- [x] Check package.json devDependencies contains all 7 packages
- [x] Verify node_modules contains vitest directory
- [x] Run 'bun test' and verify command is recognized

---

### 2. Configuration - vitest.config.ts

**Status:** COMPLETED

**Description:** Create vitest.config.ts that merges with existing vite.config to inherit plugins and maintain consistency

#### Acceptance Criteria
- [x] vitest.config.ts file exists in project root
- [x] Config merges with vite.config using mergeConfig
- [x] Test environment set to 'happy-dom'
- [x] Globals enabled for describe/it/expect
- [x] Setup file points to './vitest.setup.ts'
- [x] Include pattern set to 'src/**/*.{test,spec}.{ts,tsx}'
- [x] Exclude patterns include node_modules, dist, .output, convex
- [x] Coverage provider set to 'v8'
- [x] Coverage reporters include text, json, html, lcov
- [x] Coverage thresholds set to 70% for lines/functions/branches/statements
- [x] Pool set to 'threads' with parallelization enabled
- [x] Path aliases (~/) resolve correctly in tests

#### Steps to Verify
- [x] Verify vitest.config.ts file exists at /Users/mikej/Projects/typescript/owmydayz/vitest.config.ts
- [x] Import and check that config extends viteConfig
- [x] Run 'bun test' with a simple test and verify path aliases work
- [x] Check that TypeScript can resolve the config file without errors

---

### 3. Configuration - vitest.setup.ts

**Status:** COMPLETED

**Description:** Create vitest.setup.ts for global test setup and external dependency mocks

#### Acceptance Criteria
- [x] vitest.setup.ts file exists in project root
- [x] @testing-library/jest-dom/vitest imported
- [x] cleanup() called in afterEach hook
- [x] ~/lib/auth-client mocked with default useSession and getSession
- [x] convex/react mocked with useQuery, useMutation, useConvex
- [x] window.matchMedia mocked for theme detection
- [x] All mocks return appropriate default values

#### Steps to Verify
- [x] Verify vitest.setup.ts file exists at /Users/mikej/Projects/typescript/owmydayz/vitest.setup.ts
- [x] Run tests and verify auth-client mock is used
- [x] Run tests and verify Convex mock is used
- [x] Check that tests can access jest-dom matchers like toBeInTheDocument
- [x] Verify window.matchMedia calls don't throw errors in tests

---

### 4. Configuration - package.json Scripts

**Status:** COMPLETED

**Description:** Update package.json with test scripts for running tests in different modes

#### Acceptance Criteria
- [x] test script runs 'vitest run' (CI mode)
- [x] test:watch script runs 'vitest' (watch mode)
- [x] test:ui script runs 'vitest --ui' (visual UI)
- [x] test:coverage script runs 'vitest run --coverage'
- [x] test:coverage:watch script runs 'vitest --coverage' (watch with coverage)

#### Steps to Verify
- [x] Run 'bun test' and verify tests execute once then exit
- [x] Run 'bun test:watch' and verify watch mode starts
- [x] Run 'bun test:ui' and verify browser opens with UI
- [x] Run 'bun test:coverage' and verify coverage report generates
- [x] Check that all scripts are in package.json scripts section

---

### 5. Configuration - .gitignore

**Status:** COMPLETED

**Description:** Update .gitignore to exclude test coverage artifacts

#### Acceptance Criteria
- [x] coverage/ directory added to .gitignore
- [x] .vitest/ directory added to .gitignore
- [x] Git status does not show coverage files as untracked

#### Steps to Verify
- [x] Run 'bun test:coverage' to generate coverage
- [x] Run 'git status' and verify coverage/ is not listed
- [x] Verify .gitignore contains 'coverage/' entry
- [x] Verify .gitignore contains '.vitest/' entry

---

### 6. Example Tests - Date Utility

**Status:** COMPLETED

**Description:** Create date utility function tests demonstrating pure function testing patterns

#### Acceptance Criteria
- [x] src/utils/date.test.ts file exists
- [x] Tests for dateToLocalDateTime function (2 tests)
- [x] Tests for localDateTimeToISO function (1 test)
- [x] Tests for formatDateTime function (1 test)
- [x] Tests for formatTime function (1 test)
- [x] Tests for createDateWithTime function (2 tests)
- [x] All tests use describe/it/expect structure
- [x] Tests verify output formats with regex patterns
- [x] Tests check edge cases like single-digit padding

#### Steps to Verify
- [x] Verify src/utils/date.test.ts exists
- [x] Run 'bun test date.test.ts' and verify all tests pass
- [x] Count tests: should have 7 total tests (exceeds requirement)
- [x] Verify each test has descriptive names
- [x] Check that tests cover happy path and edge cases

---

### 7. Example Tests - Badge Component

**Status:** COMPLETED

**Description:** Create Badge component tests demonstrating React component testing patterns

#### Acceptance Criteria
- [x] src/components/ui/badge.test.tsx file exists
- [x] Tests for default variant rendering
- [x] Tests for secondary variant rendering
- [x] Tests for destructive variant rendering
- [x] Tests for outline variant rendering
- [x] Tests for custom className merging
- [x] Tests for passing additional props
- [x] All tests use render and screen from @testing-library/react
- [x] Tests use toBeInTheDocument and toHaveClass matchers

#### Steps to Verify
- [x] Verify src/components/ui/badge.test.tsx exists
- [x] Run 'bun test badge.test.tsx' and verify all tests pass
- [x] Count tests: should have 6 total tests
- [x] Verify tests check for correct CSS classes
- [x] Verify component renders without errors

---

### 8. Example Tests - useCurrentUser Hook

**Status:** COMPLETED

**Description:** Create useCurrentUser hook tests demonstrating custom hook testing patterns with mocks

#### Acceptance Criteria
- [x] src/hooks/useCurrentUser.test.ts file exists
- [x] Tests for useCurrentUser hook (3 tests minimum)
- [x] Tests for useRequireAuth hook (2 tests minimum)
- [x] Uses renderHook from @testing-library/react
- [x] Mocks authClient.useSession with vi.mock
- [x] Tests unauthenticated state
- [x] Tests authenticated state with mock user data
- [x] Tests loading state
- [x] Tests requireUserId throws error when not authenticated
- [x] Tests requireUserId returns userId when authenticated
- [x] Uses beforeEach to clear mocks

#### Steps to Verify
- [x] Verify src/hooks/useCurrentUser.test.ts exists
- [x] Run 'bun test useCurrentUser.test.ts' and verify all tests pass
- [x] Count tests: should have 5 total tests across 2 describe blocks
- [x] Verify mocks are properly cleared between tests
- [x] Verify all hook return values are tested

---

### 9. Example Tests - cn() Utility

**Status:** TODO

**Description:** Create cn() utility tests demonstrating className merging and Tailwind conflict resolution

#### Acceptance Criteria
- [ ] src/lib/utils.test.ts file exists
- [ ] Tests for basic className merging
- [ ] Tests for conditional className handling
- [ ] Tests for Tailwind class conflict resolution
- [ ] Tests for array of classNames
- [ ] Tests for undefined and null value handling
- [ ] Tests for class deduplication
- [ ] All tests verify output matches expected string format

#### Steps to Verify
- [ ] Verify src/lib/utils.test.ts exists
- [ ] Run 'bun test utils.test.ts' and verify all tests pass
- [ ] Count tests: should have 6 total tests
- [ ] Verify Tailwind conflicts (like p-4 vs p-6) resolve correctly
- [ ] Verify conditional classes work as expected

---

### 10. Integration Testing

**Status:** TODO

**Description:** Verify all tests run successfully and generate coverage reports

#### Acceptance Criteria
- [ ] Running 'bun test' executes all 4 test files
- [ ] All 23+ tests pass without errors
- [ ] Test execution completes in reasonable time (<5 seconds)
- [ ] No TypeScript errors in test files
- [ ] Coverage report generates successfully
- [ ] Coverage HTML report opens in browser
- [ ] Coverage includes src/**/*.{ts,tsx} files
- [ ] Coverage excludes test files, type definitions, and routes
- [ ] Coverage thresholds are enforced (70%)

#### Steps to Verify
- [ ] Run 'bun test' and verify output shows '4 passed (4)' test files
- [ ] Verify output shows '23 passed (23)' or more total tests
- [ ] Run 'bun test:coverage' and verify coverage/index.html is generated
- [ ] Open coverage/index.html and verify it displays coverage percentages
- [ ] Verify coverage report excludes node_modules and test files
- [ ] Run 'bun run build' and verify no TypeScript errors
- [ ] Verify test files have proper TypeScript types and autocomplete

---

### 11. Developer Experience

**Status:** TODO

**Description:** Verify watch mode and UI mode provide good developer experience

#### Acceptance Criteria
- [ ] Watch mode starts without errors
- [ ] File changes trigger automatic test re-run
- [ ] Watch mode shows clear pass/fail indicators
- [ ] UI mode opens in browser at localhost:51204/__vitest__/
- [ ] UI displays all test files in tree structure
- [ ] UI allows filtering tests by name or status
- [ ] UI shows test duration and pass/fail status
- [ ] UI provides detailed error messages on failure

#### Steps to Verify
- [ ] Run 'bun test:watch' and verify watch mode starts
- [ ] Modify a test file and verify tests re-run automatically
- [ ] Press 'a' in watch mode to run all tests
- [ ] Press 'q' to quit watch mode
- [ ] Run 'bun test:ui' and verify browser opens
- [ ] Click through test files in UI to view results
- [ ] Use filter box in UI to search for specific tests
- [ ] Verify UI updates when test files change

---

### 12. CI/CD Ready

**Status:** TODO

**Description:** Verify testing setup works in CI environment

#### Acceptance Criteria
- [ ] Tests run in CI mode without interactive prompts
- [ ] Process exits with code 0 on success
- [ ] Process exits with code 1 on failure
- [ ] LCOV coverage file generated for CI tools
- [ ] Coverage can be uploaded to codecov or similar
- [ ] Tests complete in reasonable time for CI
- [ ] No dependency on local environment variables

#### Steps to Verify
- [ ] Run 'CI=true bun test' and verify tests run without watch mode
- [ ] Run 'bun test' with a failing test and verify exit code is 1
- [ ] Run 'bun test:coverage' and verify coverage/lcov.info exists
- [ ] Check that test execution doesn't hang or wait for input
- [ ] Verify all mocked dependencies work in CI environment

---

## Definition of Done

- [x] All 7 testing dependencies installed via Bun
- [x] vitest.config.ts created and merges with vite.config
- [x] vitest.setup.ts created with global mocks
- [x] package.json updated with 5 test scripts
- [x] .gitignore updated to exclude coverage artifacts
- [ ] 4 example test files created (date, badge, useCurrentUser, utils)
- [ ] Running 'bun test' executes all tests successfully
- [ ] Running 'bun test:coverage' generates HTML coverage report
- [ ] Running 'bun test:watch' starts watch mode
- [ ] Running 'bun test:ui' opens visual test UI in browser
- [ ] All tests pass (23+ passing tests across 4 files)
- [ ] Coverage thresholds set to 70% and enforced
- [ ] Path aliases (~/) work correctly in test files
- [ ] No TypeScript errors in any test files
- [ ] Build process (bun run build) completes successfully with tests present
- [ ] Documentation in plan file explains testing patterns and organization
