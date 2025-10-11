# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Quest is an interactive web application for learning Git operations in the browser. It uses isomorphic-git and LightningFS to simulate a complete Git environment entirely client-side, with no server required.

## Essential Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173

# Testing
npm run test         # Run tests in watch mode (Vitest)
npm run test:coverage # Run tests with coverage

# Build
npm run build        # Build for production (TypeScript + Vite)
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

All application state lives in `useAppStore.ts`. **Critical pattern**: GUI actions (like clicking "stage file" button) internally call `executeCommand()` with the equivalent Git command. This ensures both terminal and GUI paths go through the same validation and execution pipeline.

Example:
```typescript
// GUI button click
stageFile: async (filepath: string) => {
  await tutorialService.executeCommand(`git add ${filepath}`);
}
```

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

## Styling

Uses Tailwind CSS with custom theme in `tailwind.config.js` matching VS Code Light Modern. Color variables are prefixed with `vscode-` (e.g., `bg-vscode-sidebar`).

## Critical Files to Understand

- `src/services/tutorial/TutorialService.ts` - Tutorial orchestration
- `src/store/useAppStore.ts` - State management and service coordination
- `src/constants/tutorialSteps.ts` - Step definitions
- `src/services/git/GitService.ts` - isomorphic-git wrapper
