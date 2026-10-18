# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Quest is an interactive web application for learning Git operations in the browser. It uses isomorphic-git and LightningFS to simulate a complete Git environment entirely client-side, with no server required.

## Essential Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173

# Lint and type check
npm run lint         # Biome (fails on any error or warning)
npm run typecheck    # tsc -b: app, Vite/Vitest config files, and tests

# Testing
npm run test         # Run tests in watch mode (Vitest)
npm run test:coverage # Run tests with coverage

# Build
npm run build        # Type check (tsc -b), then build for production with Vite
npm run preview      # Preview production build
```

## Architecture

### Core Service Layer Pattern

The application follows a service-oriented architecture where all Git operations, file system access, and tutorial logic are abstracted into service classes. **This is critical**: UI components NEVER directly interact with isomorphic-git or LightningFS.

#### Service Initialization Flow

Services are initialized in a specific order in `useAppStore.ts`:

```typescript
FileSystemService → GitService → GitValidator, RemoteSimulator, CommandParser, StepValidator → TutorialService
```

**Key Point**: `TutorialService` is the orchestrator that coordinates all other services. UI components interact ONLY with the Zustand store, which delegates to `TutorialService`.

### Virtual Git Environment

The app simulates a complete Git workflow using two virtual directories:

- `/remote-repo` - Simulated remote repository (created by `RemoteSimulator`)
- `/workspace` - User's workspace (cloned from remote)

**Important**: When users type `git clone /remote-repo`, the app copies files from `/remote-repo` to `/workspace` entirely within LightningFS (browser storage). This is NOT a real HTTP clone.

### Tutorial State Machine

Tutorial progression is managed by `TutorialService`:

1. **Step Validation**: Each step has `allowedCommands` and `validationRules`
2. **Command Execution**: `GitValidator` checks if command is allowed → `CommandParser` parses it → `TutorialService` executes it via `GitService`
3. **Auto-Advancement**: `StepValidator` checks if validation rules are met → Auto-advances to next step on success
4. **Two Stages**:
   - Terminal Stage (Steps 0-6): Learn via CLI commands
   - GUI Stage (Steps 21-61): Learn via VS Code-like UI

The step IDs jump from 6 to 21 intentionally - this allows future insertion of intermediate steps without breaking the state machine.

### State Management (Zustand)

All application state lives in `useAppStore.ts`. **Critical pattern**: GUI actions (like clicking "stage file" button) go through `runGuiCommand()`. It calls `TutorialService.performGuiAction()`, which runs the equivalent Git command through `executeCommand()`, but only if the current step lists the action in `allowedGuiActions`. Otherwise it returns an error with a hint. Both terminal and GUI paths therefore share the same execution and step-completion pipeline. Each step completion prints its success message exactly once; do not call `validateCurrentStep()` again after a GUI action.

**Operation order**: terminal commands, GUI actions and the edit check (`validateCurrentStep`) run one at a time through `runInOrder()`, in the order they were requested.
- Each operation prints its output when it runs, so a command line always sits right above its own output.
- A check is dropped if an earlier operation already completed the step it was requested for. Otherwise it would check the following step and print that step's success message before the learner did anything there.
- `initialize()` (also run by `reset()`) starts a new session with an empty queue. Operations queued for the previous tutorial service are dropped, not run against the new one.
- Code that runs inside `runInOrder()` must call the unqueued helpers (such as `runGuiCommand()`), never another queued action: that would wait for itself.
- `editFile` is not queued, so typing in the editor stays immediate.

Example:
```typescript
// GUI button click
stageFile: (filepath: string) =>
  runInOrder(async () => {
    if (!get().requireGuiBranch()) return;
    await runGuiCommand('stage-file', `git add ${filepath}`);
  }),
```

Steps that require a push pass only while the current branch HEAD matches the commit recorded at its last push (`TutorialService.pushedHeads`), not merely because the branch was pushed before.

### Step Definition Structure

Steps are defined in `src/constants/tutorialSteps.ts`:

- `allowedCommands`: Which Git commands are permitted at this step
- `validationRules`: Conditions to auto-advance (e.g., "file must be staged")
- `hints`: Displayed when user makes mistakes
- `detailedInstructions`: Markdown content shown in right pane

When adding new steps, ensure the validation rules match what the command actually does (e.g., if step requires "git add", validation must check `file-staged`).

## Key Technical Decisions

### Why Singleton FileSystemService?

LightningFS creates an IndexedDB database per instance. Multiple instances = data inconsistency. The singleton pattern (`getFileSystemService()`) ensures all services share the same virtual filesystem.

### Why No Direct Git State in Components?

Components receive `gitState` from Zustand store, which is refreshed after every Git operation. This keeps Git state synchronized between the virtual filesystem and UI without components needing to understand isomorphic-git's status matrix format.

### Reset Functionality

Reset wipes the entire LightningFS instance (`wipe: true`) and reinitializes all services. This is why page reload also resets - IndexedDB persistence is intentionally disabled.

## Common Development Scenarios

### Adding a New Tutorial Step

1. Add step config to `TUTORIAL_STEPS` or `GUI_TUTORIAL_STEPS` in `src/constants/tutorialSteps.ts`
2. Add Git command to allowed list if needed
3. Define validation rules in `StepValidator.ts` if new rule type required
4. Update step advancement logic in `TutorialService.advanceStep()` if step IDs are non-sequential

### Adding a New Git Command

1. Add command type to `GitCommand` union in `src/types/git.ts`
2. Implement parsing in `CommandParser.parse()`
3. Add validation logic in `GitValidator.validateSpecificCommand()`
4. Implement execution in `TutorialService.executeGitCommand()`
5. Add corresponding method to `GitService` if it's a new operation

### Debugging Tutorial Flow Issues

Check in order:
1. Are `allowedCommands` correct for the step?
2. Does `GitValidator` accept the command format?
3. Does the Git operation actually succeed? (check browser console)
4. Do `validationRules` match the actual Git state after operation?
5. Is `refreshGitState()` being called after the operation?

## Testing Notes

- Tests use Vitest with jsdom environment
- Service tests should mock `FileSystemService` and `GitService`
- Component tests use React Testing Library
- Test command validation separately from command execution
- Tests are type-checked too. `tsconfig.json` only references three projects, and `tsc -b` checks all of them:
  - `tsconfig.app.json`: `src`, browser types only (`types: []`, so Node globals are errors)
  - `tsconfig.node.json`: `vite.config.ts` and `vitest.config.ts`, with Node types
  - `tsconfig.test.json`: `src` and `tests`, with Node types. The jest-dom matcher types come from `@testing-library/jest-dom/vitest`, imported in `tests/setup/vitest.setup.ts`.

## Styling

Uses Tailwind CSS 4, loaded through the `@tailwindcss/vite` plugin; there is no `tailwind.config.js` or `postcss.config.js`. The custom theme matching VS Code Light Modern is defined with `@theme` in `src/styles/index.css`. Color variables are prefixed with `vscode-` (e.g., `bg-vscode-sidebar`).

Put global styles inside `@layer base` in `src/styles/index.css`. Tailwind 4 emits utilities into a native cascade layer, and unlayered rules beat every layered rule, so a global rule outside a layer would override utilities such as `p-4`. The same file keeps a few Tailwind 3 preflight defaults (border color, placeholder color, pointer cursor on buttons) so the UI looks as it did before the upgrade.

Tailwind 4 applies `hover:` and `group-hover:` only inside `@media (hover: hover)`. A control that is hidden until hover (for example `opacity-0 group-hover:opacity-100`) must also get `hover-none:opacity-100` (a custom variant defined in `src/styles/index.css`), or touch devices never show it. It also needs `focus-visible:opacity-100`, so keyboard users can see it while it has focus, and an `aria-label` when its text is only a symbol. `tests/unit/styles/tailwind.test.ts` compiles the stylesheet to check these variants, since jsdom cannot evaluate media queries.

## Critical Files to Understand

- `src/services/tutorial/TutorialService.ts` - Tutorial orchestration
- `src/store/useAppStore.ts` - State management and service coordination
- `src/constants/tutorialSteps.ts` - Step definitions
- `src/services/git/GitService.ts` - isomorphic-git wrapper
