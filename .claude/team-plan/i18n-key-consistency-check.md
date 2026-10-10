# Team Plan: i18n Key Consistency Check

## Overview

Add a TypeScript script that recursively compares all translation keys between `messages/en/*.json` and `messages/zh/*.json`, reports mismatches, and integrates into the npm scripts for CI/dev use.

## Context Analysis

### Current State
- **8 namespaces**: common, nav, home, about, programs, contact, admin, metadata
- **2 locales**: en, zh (16 JSON files total)
- **Loading**: `src/i18n/request.ts` dynamically imports all 8 namespaces and merges via `Object.assign`
- **No validation**: `next-intl` silently falls back to showing the raw key path when a translation is missing
- **No existing test/check infrastructure** for i18n

### Problem
When a developer adds a key to `en/home.json` but forgets to add it to `zh/home.json`, the Chinese version silently shows the raw key string (e.g., `home.hero.newField`) instead of translated text. This is only caught by manual QA.

### Solution
A single Node.js/TypeScript script that:
1. Reads all JSON files from both locale directories
2. Recursively flattens nested keys into dot-notation paths
3. Compares key sets per namespace (en vs zh)
4. Reports missing keys in both directions (en-only, zh-only)
5. Exits with code 1 if any mismatch found (CI-friendly)
6. Registered as `npm run i18n:check`

## Analysis Summary

**Architecture:**
- Pure Node.js script using `fs` and `path` — zero external dependencies
- Recursive key extraction via `flattenKeys(obj, prefix)` utility
- Per-namespace comparison ensures clear, actionable error messages
- ANSI color output for terminal readability (green pass, red fail)
- Process exit code for CI integration

**Risk Assessment:**
- Minimal risk — read-only script, no code changes to production
- `tsx` already a devDependency (used by `prisma/seed.ts`)
- Script runs in <100ms for 16 files

## Sub-task List

### Task 1: Create check script
- **Type**: Tooling (Node.js script)
- **File Range**: `scripts/check-i18n.ts` (NEW)
- **Dependencies**: None
- **Implementation Steps**:
  1. Create `scripts/check-i18n.ts`
  2. Implement `flattenKeys(obj, prefix)`: recursively walk JSON object, produce `Set<string>` of dot-notation paths (e.g., `home.hero.title`)
  3. Read `messages/en/` and `messages/zh/` directories
  4. For each namespace file present in either locale:
     - Parse JSON from both locales (handle missing file as empty `{}`)
     - Flatten keys for both
     - Compute `enOnly = en - zh` and `zhOnly = zh - en`
     - Track results
  5. Print per-namespace report:
     - Namespace name + status (PASS / FAIL)
     - List missing keys with direction indicator (`en → zh missing`, `zh → en missing`)
  6. Print summary: total namespaces checked, total mismatches
  7. Exit code: 0 if all pass, 1 if any mismatch
- **Acceptance Criteria**:
  - Running the script on current codebase reports accurate results
  - Script exits with code 1 when a key is intentionally removed from one locale
  - Output is human-readable with clear namespace grouping

### Task 2: Register npm script
- **Type**: Config
- **File Range**: `package.json` (EDIT — scripts section only)
- **Dependencies**: Task 1
- **Implementation Steps**:
  1. Add `"i18n:check": "npx tsx scripts/check-i18n.ts"` to package.json scripts
- **Acceptance Criteria**:
  - `npm run i18n:check` executes the script successfully

### Task 3: Verification run
- **Type**: Validation
- **File Range**: None (read-only)
- **Dependencies**: Task 1, Task 2
- **Implementation Steps**:
  1. Run `npm run i18n:check` and verify output
  2. Temporarily remove a key from one locale file, re-run, verify detection
  3. Restore the key
- **Acceptance Criteria**:
  - Clean run on current codebase
  - Intentional mismatch is detected and reported

## File Conflict Check
- Task 1: `scripts/check-i18n.ts` — NEW file, no conflict
- Task 2: `package.json` — scripts section only, isolated from Task 1

## Parallel Grouping
- Layer 1: Task 1 (script creation)
- Layer 2 (depends on Layer 1): Task 2 + Task 3 (can run in parallel)
