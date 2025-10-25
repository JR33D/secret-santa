# Release Workflow Diagram

## Complete Release Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Workflow                           │
└─────────────────────────────────────────────────────────────────┘

  Developer                    GitHub                    Automation
     │                           │                            │
     │  1. Create Feature        │                            │
     ├──────────────────────────>│                            │
     │   git checkout -b         │                            │
     │   feat/new-feature        │                            │
     │                           │                            │
     │  2. Commit Changes        │                            │
     ├──────────────────────────>│                            │
     │   git commit -m           │                            │
     │   "feat: add feature"     │                            │
     │                           │                            │
     │  3. Push Branch           │                            │
     ├──────────────────────────>│                            │
     │   git push origin         │                            │
     │                           │                            │
     │  4. Create Pull Request   │                            │
     ├──────────────────────────>│                            │
     │                           │                            │
     │                           │  5. Run PR Tests           │
     │                           ├──────────────────────────> │
     │                           │    - Lint                  │
     │                           │    - Unit Tests            │
     │                           │    - Build Check           │
     │                           │ <──────────────────────────┤
     │                           │    ✅ All Tests Pass       │
     │                           │                            │
     │  6. Review & Approve      │                            │
     ├──────────────────────────>│                            │
     │                           │                            │
     │  7. Squash & Merge        │                            │
     │     (with conventional    │                            │
     │      commit format)       │                            │
     ├──────────────────────────>│                            │
     │                           │                            │
     │                           │  8. Merge to main          │
     │                           │                            │
     │                           │  9. Trigger Release Please │
     │                           ├──────────────────────────> │
     │                           │                            │
     │                           │                            │
┌────────────────────────────────────────────────────────────────────┐
│                    Release Please Workflow                         │
└────────────────────────────────────────────────────────────────────┘
                                │                            │
                                │                            │
                                │  10. Analyze Commits       │
                                │<───────────────────────────┤
                                │     - Parse types          │
                                │     - Calculate version    │
                                │     - Generate changelog   │
                                │                            │
                                │  11. Create/Update         │
                                │      Release PR            │
                                │<───────────────────────────┤
                                │     "chore: release 1.1.0" │
                                │     - Update package.json  │
                                │     - Update CHANGELOG.md  │
                                │                            │
     │  12. Review Release PR   │                            │
     ├─────────────────────────>│                            │
     │      (Check version &    │                            │
     │       changelog)         │                            │
     │                          │                            │
     │  13. Merge Release PR    │                            │
     ├─────────────────────────>│                            │
     │                          │                            │
     │                          │  14. Create GitHub Release │
     │                          │<───────────────────────────┤
     │                          │      - Tag: v1.1.0         │
     │                          │      - Release Notes       │
     │                          │                            │
     │                          │  15. Trigger Docker Build  │
     │                          ├──────────────────────────> │
     │                          │                            │
┌────────────────────────────────────────────────────────────────────┐
│                    Docker Build Workflow                           │
└────────────────────────────────────────────────────────────────────┘
                                │                            │
                                │  16. Multi-arch Build      │
                                │<───────────────────────────┤
                                │      - linux/amd64         │
                                │      - linux/arm64         │
                                │                            │
                                │  17. Push to Registry      │
                                │<───────────────────────────┤
                                │      Tags:                 │
                                │      - latest              │
                                │      - stable              │
                                │      - v1.1.0              │
                                │      - v1.1                │
                                │      - v1                  │
                                │      - 1.1.0-20240125      │
                                │                            │
                                │  18. Generate Attestation  │
                                │<───────────────────────────┤
                                │                            │
                                │  19. Update Release        │
                                │<───────────────────────────┤
                                │      Add Docker info       │
                                │                            │
                                │      ✅ COMPLETE          |
                                │                            │

```

## Version Bump Decision Tree

```
                    Commit Message Analysis
                             │
                ┌────────────┴────────────┐
                │                         │
         Contains "!"            Contains "feat:"
         or BREAKING CHANGE?              │
                │                         │
                ├── YES ──> MAJOR         ├── YES ──> MINOR
                │          (1.0.0 → 2.0.0)         (1.0.0 → 1.1.0)
                │                         │
                ├── NO                    ├── NO
                │                         │
         Contains "fix:"           Contains "perf:"
                │                         │
                ├── YES ──> PATCH        ├── YES ──> PATCH
                │           (1.0.0 → 1.0.1)         (1.0.0 → 1.0.1)
                │                         │
                └── NO                    └── NO
                     │                         │
                     └─────────┬───────────────┘
                               │
                        No Version Bump
                        (docs, chore, etc.)
```

## Docker Tag Strategy

```
                    GitHub Release Created
                         v1.2.3
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    Semantic Tags      Fixed Tags         Date Tags
        │                   │                   │
    ┌───┴───┐          ┌────┴────┐         ┌───┴───┐
    │       │          │         │         │       │
  v1.2.3  v1.2      latest   stable   1.2.3-DATE
    │       │          │         │         │
    │     v1           │         │         │
    │                  │         │         │
    └──────────────────┴─────────┴─────────┘
              │
         All point to the
         same Docker image
         (different references)
```

## Pre-release Flow

```
                Development Branch
                    (develop)
                        │
                        │  Push commits
                        ▼
                ┌──────────────┐
                │ Edge Release │
                │  Workflow    │
                └──────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │  Docker Build  │
              │  (pre-release) │
              └────────┬───────┘
                       │
                       ▼
                  Docker Tags:
                  - edge
                  - edge-YYYYMMDD
                  - edge-{commit-sha}
                       │
                       ▼
              Testing & Validation
                       │
                       ▼
              Merge to main when ready
                       │
                       ▼
              Regular Release Flow
```

## Conventional Commit Impact

```
Commit Type         Version Impact        Changelog Section
───────────────────────────────────────────────────────────
feat:              ─────> MINOR           ✅ Features
feat!:             ─────> MAJOR           ✅ Features + Breaking
fix:               ─────> PATCH           ✅ Bug Fixes
perf:              ─────> PATCH           ✅ Performance
docs:              ─────> NONE            ✅ Documentation
refactor:          ─────> NONE            ✅ Code Refactoring
test:              ─────> NONE            ✅ Tests
build:             ─────> NONE            ✅ Build System
ci:                ─────> NONE            ✅ CI
chore:             ─────> NONE            ✅ Miscellaneous
style:             ─────> NONE            ❌ Hidden
```

## Release PR Lifecycle

```
State 1: No Uncommitted Changes
  main: v1.0.0
  No release PR exists

State 2: Feature Merged
  main: v1.0.0 + new commits
  Release PR created automatically:
    - Title: "chore: release 1.1.0"
    - Updates package.json
    - Updates CHANGELOG.md

State 3: More Features Merged
  main: v1.0.0 + more commits
  Release PR updated automatically:
    - Title: "chore: release 1.2.0"
    - Changelog grows
    - Version recalculated

State 4: Release PR Merged
  main: v1.2.0 (tagged)
  GitHub Release created
  Docker images published
  Release PR closed

State 5: Back to State 1
  Cycle repeats for next release
```

## Multi-Architecture Build

```
                  Source Code
                      │
                      ▼
              Docker Buildx Setup
                      │
        ┌─────────────┴─────────────┐
        │                           │
  Build for amd64            Build for arm64
        │                           │
        │                           │
   ┌────┴────┐                 ┌────┴────┐
   │ x86_64  │                 │ aarch64 │
   │ servers │                 │  RPi 4  │
   │ desktop │                 │  Apple  │
   └────┬────┘                 │ Silicon │
        │                      └────┬────┘
        │                           │
        └─────────────┬─────────────┘
                      │
              Create Manifest List
                      │
                      ▼
          Push to Container Registry
                (ghcr.io)
                      │
                      ▼
          Docker automatically pulls
          correct architecture
```

## Rollback Strategy

```
                Production Issue Detected
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    Quick Fix        Investigate       Rollback
         │                │                │
         │                │                ▼
         │                │         ┌──────────────┐
         │                │         │ Update       │
         │                │         │ docker-      │
         │                │         │ compose.yml  │
         │                │         │              │
         │                │         │ image: :v1.0.9│
         │                │         └──────┬───────┘
         │                │                │
         │                │                ▼
         │                │         docker-compose
         │                │         up -d
         │                │                │
         ▼                ▼                ▼
    Emergency         Analysis       Reverted
    Hotfix PR         Complete      to Stable
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
                  Problem Resolved
                          │
                          ▼
                 Plan Proper Fix
                          │
                          ▼
                 New Release Cycle
```

This visual guide helps understand the complete flow from development to deployment!
