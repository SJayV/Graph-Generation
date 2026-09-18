# AGENTS.md

## Project Overview
An application to randomly create graphs parametrized in node count and sparsity and visualize graph algorithms.

### What
- random graph generation + edge selection
    - vertices and edges
    - gaussian kernels as priority
- visualize graph growth

### Tech Stack & Versions
- python for logic
- WebGL for rendering

### Architecture Map
- python core logic
    - graph primitive generation
    - data structure + field handling
    - algorithm for edge selection, based on the other two modules
- layers
    - logic layer
    - rendering / visual layer (view on model)
- repo map
    - logic (all py files)
    - rendering (all WebGL, js files)
- data flow: logic → rendering
    - logic layer exports a static JSON file (vertices, ordered edge-addition sequence)
    - rendering layer reads that JSON directly
    - one-directional: rendering never calls back into logic
- rendering layer interface
    - exposes a minimal programmatic entry point: a function
        - taking a vertex / edge-sequence
        - returning a queryable render state
    - behavior is assertable without visual inspection

## Workflow Phases
- primitives are features and user stories
    - explicitly decide on names for each, to be inserted in the commit-prefixes
    - for each feature, iterate over planning until convergence to a set of atomic user stories
    - for each (split) user story from planning, iterate over testing + implementation + documentation until done

### Planning
- on feature start: planner creates `PLAN.md` at repo root
- delegate to `planner` subagent
    - in case of un- or underspecified architectural plan: invoke architecture-planning skill
- on planning complete: commit `[feature]: planning complete`

### Testing
- delegate to `tester` subagent
- when tests written: commit `[feature - user story]: testing complete`

### Implementation
- delegate to `implementer` subagent
- on first draft passing and complete: commit `[feature - user story]: code passes tests`
- on refactors complete: commit `[feature - user story]: refactor complete`

### Documentation
- delegate to `documenter` subagent
- necessary files
    - if not yet existent → create according to skill
    - otherwise → adapt
- on documentation written: commit `[feature - user story]: documentation complete`

### Finalization
- let user review code
- on completion:
    - user story
        - extract section from `PLAN.md` → `userStories/[feature - user story].md`
        - commit `[feature - user story]: story complete, archived`
    - feature
        - once all user stories archived
            - delegate to `documenter` subagent
            - extract important formalizations to README.md
            - delete feature section from `PLAN.md`
        - commit `[feature]: complete`

## Rules

### Definition of Done

#### Acceptance Criterion
- tests pass
- lint clean

#### User Story
- tests pass
- lint clean
- user confirmed

### Rollback Rule
- if output turns out wrong during implementation or any other phase
    - stop and flag
    - revert if uncommitted
    - amend if not yet merged

### Code Quality
- naming
    - full names, no abbreviations
    - camelCase → functions and variables
    - ALL_CAPS → constants
- scope
    - differentiation of private vs. public functions → _-prefix for private
    - constants as close as possible to their shared use
- explicit typing
- short functions
    - early returns
    - exactly one task each → decomposition / modularization

### Patterns
- composition over inheritance
- design with patterns
    - complex object construction → factory function
    - interchangeable algorithms → strategy
    - event-handling → observer
    - additional functionality → decorator / adapter
- errors → throwing exceptions at higher layers

### Architectural Style
- layers as horizontal slices
    - clear interfaces / boundaries
    - one-directional dependency flow / dependency inversion
- modularity
    - low coupling
    - high cohesion
- responsibilities
    - functional core → logic
    - imperative shell → orchestration and I/O
    - request driven communication
- single source of truth

## Maps

### Documentation 
- README.md → adapt on major changes of functionality / central implementation
- MANUAL.md (if applicable) → adapt on changes to user interface

### Repository
- code
    - directories for each (horizontal slice) layer
- tests 
    - mirroring code-directory
- userStories → per-story sections extracted from `PLAN.md` on archival
- root
    - documentation
    - main files
    - config for lints / tests

## Security
- sensitive values
    - credentials
    - .env config-files in gitignore
- authentication pattern
- input validation at system boundary
- dependency installation only after vulnerability check

## Boundaries / Do-Not-Touch
- history
    - migration files
    - userStories archive
- general / non-authorized access to directories
    - tests (only tester-subagent)
    - documentation (only documenter-subagent)
    - AGENTS.md Architecture Map section (only architecture-planning skill)