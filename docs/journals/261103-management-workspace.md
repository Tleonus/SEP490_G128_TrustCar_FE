# Management Workspace Consolidation

**Date**: 2026-11-03 23:27
**Severity**: Medium
**Component**: Management workspace
**Status**: Ongoing

## What Happened

Extracted shared `AdminLayout` from intake; unified `ADMIN`+`SALES_STAFF` guards. Canonical English routes `overview`/`inventory`/`vehicle-intake` retain Vietnamese aliases preserving search/hash. Overview uses real metadata totals; inventory search synchronizes with URLs; account uses the auth store.

Removed the background from `src/assets/logo.jpg` into `src/assets/logo-transparent.png`: RGBA 400x375, sidebar 154px desktop/44px mobile.

## The Brutal Truth

Frontend checks cannot establish backend persistence. Real persistence remains unverified; intake-to-inventory integration remains unchanged and unverified. No emotional account was supplied.

## Technical Details

Reported evidence: normal lint passed after generated browser artifacts were removed; build passed with a 720kB main-JS warning; 44 existing comparison unit tests passed. Isolated Chrome fixture smoke validated aliases/navigation/auth/mobile/loading/error states and invalid intake making no API call.

## What We Tried

Touching the new module invalidated Vite's cache; rerun succeeded. Additional browser pagination/login/valid-save checks stopped because CDP was unavailable; source review only.

## Root Cause Analysis

Vite cached an empty module during an agent write. CDP unavailability blocked additional browser verification.

## Lessons Learned

Decision: share layout/guards and preserve API contracts and alias compatibility. Breaking route/API changes were outside scope. Retry after completed writes; distinguish fixture evidence from live persistence.

## Next Steps

Proposed owners: frontend restores CDP and checks pagination/login/valid saves; frontend/backend verify persistence and intake-to-inventory integration before release. No tests rerun for this journal.
