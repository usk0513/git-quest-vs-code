import { create } from 'zustand';
import { TutorialService } from '@/services/tutorial/TutorialService';
import { GitService } from '@/services/git/GitService';
import { GitValidator } from '@/services/git/GitValidator';
import { RemoteSimulator } from '@/services/git/RemoteSimulator';
import { CommandParser } from '@/services/terminal/CommandParser';
import { StepValidator } from '@/services/tutorial/StepValidator';
import {
  getFileSystemService,
  resetFileSystem,
} from '@/services/filesystem/FileSystemService';
import type { GitState, GuiAction, StepConfig, TutorialState, CommandExecutionResult } from '@/types';

const GUI_BRANCH = 'feature/gui-test';
const GUI_BRANCH_HINT = `Hint: GUIステージでは ${GUI_BRANCH} ブランチで操作してください。`;

// Terminal lines for one command result. The success message comes from the
// step that was active before the command ran, so it is printed exactly once.
const formatCommandResult = (
  result: CommandExecutionResult,
  stepBeforeCommand: StepConfig
): string[] => {
  const lines: string[] = [];
  if (result.output) {
    lines.push(result.output);
  }
  if (result.error) {
    lines.push(`Error: ${result.error}`);
    if (result.hint) {
      lines.push(`Hint: ${result.hint}`);
    }
  }
  if (
    result.validationResult &&
    !result.validationResult.passed &&
    !result.validationResult.superseded
  ) {
    lines.push(result.validationResult.message);
    if (result.validationResult.hint) {
      lines.push(`Hint: ${result.validationResult.hint}`);
    }
  }
  if (result.success && result.stepCompleted && stepBeforeCommand.successMessage) {
    lines.push(`✓ ${stepBeforeCommand.successMessage}`);
  }
  lines.push('');
  return lines;
};

interface AppState {
  // Services
  tutorialService: TutorialService | null;

  // State
  gitState: GitState;
  currentStep: StepConfig | null;
  tutorialState: TutorialState | null;
  terminalOutput: string[];
  currentFile: string | null;
  fileContent: string;
  files: string[];
  isInitialized: boolean;
  sidebarView: 'source-control' | 'explorer';

  // Actions
  initialize: () => Promise<void>;
  executeCommand: (command: string) => Promise<void>;
  editFile: (filepath: string, content: string) => Promise<void>;
  selectFile: (filepath: string) => Promise<void>;
  nextStep: () => Promise<void>;
  reset: () => Promise<void>;
  refreshGitState: () => Promise<void>;
  setSidebarView: (view: 'source-control' | 'explorer') => void;
  stageFile: (filepath: string) => Promise<void>;
  unstageFile: (filepath: string) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  validateCurrentStep: () => Promise<void>;
  switchBranch: (branch: string) => Promise<void>;
  createBranch: (branch: string) => Promise<boolean>;
  runGuiAction: (action: GuiAction, command: string) => Promise<CommandExecutionResult | null>;
  requireGuiBranch: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  tutorialService: null,
  gitState: {
    isRepository: false,
    currentBranch: '',
    branches: [],
    remoteBranches: [],
    stagedFiles: [],
    unstagedFiles: [],
    commits: [],
    hasRemote: false,
    aheadCount: 0,
    behindCount: 0,
  },
  currentStep: null,
  tutorialState: null,
  terminalOutput: ['Welcome to Git Quest!', 'Type commands to get started...', ''],
  currentFile: null,
  fileContent: '',
  files: [],
  isInitialized: false,
  sidebarView: 'source-control',

  // Initialize tutorial
  initialize: async () => {
    try {
      const fs = getFileSystemService();
      const git = new GitService(fs);
      const validator = new GitValidator();
      const stepValidator = new StepValidator(fs);
      const remoteSimulator = new RemoteSimulator(fs, git);
      const parser = new CommandParser();

      const tutorialService = new TutorialService(
        fs,
        git,
        validator,
        stepValidator,
        remoteSimulator,
        parser
      );

      await tutorialService.initialize();

      const currentStep = tutorialService.getCurrentStep();
      const tutorialState = tutorialService.getState();

      set({
        tutorialService,
        currentStep,
        tutorialState,
        isInitialized: true,
      });

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      set({
        terminalOutput: [
          ...get().terminalOutput,
          'Error: Failed to initialize tutorial',
        ],
      });
    }
  },

  // Execute command
  executeCommand: async (command: string) => {
    const { tutorialService, terminalOutput } = get();

    if (!tutorialService) {
      return;
    }

    const previousStep = tutorialService.getCurrentStep();

    // Add command to output
    set({
      terminalOutput: [...terminalOutput, `$ ${command}`],
    });

    try {
      const result: CommandExecutionResult = await tutorialService.executeCommand(command);

      set({
        terminalOutput: [...get().terminalOutput, ...formatCommandResult(result, previousStep)],
      });

      // Refresh state
      await get().refreshGitState();

      const currentStep = tutorialService.getCurrentStep();
      const tutorialState = tutorialService.getState();

      set({ currentStep, tutorialState });

    } catch (error: any) {
      set({
        terminalOutput: [
          ...get().terminalOutput,
          `Error: ${error.message}`,
          '',
        ],
      });
    }
  },

  // Edit file
  editFile: async (filepath: string, content: string) => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    try {
      await tutorialService.editFile(filepath, content);
      set({ fileContent: content });
      await get().refreshGitState();
    } catch (error) {
      console.error('Error editing file:', error);
    }
  },

  // Select file
  selectFile: async (filepath: string) => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const content = await tutorialService.readFile(filepath);
      set({
        currentFile: filepath,
        fileContent: content,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      set({
        currentFile: filepath,
        fileContent: '',
      });
    }
  },

  // Next step (manual advancement from step 0)
  nextStep: async () => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    await tutorialService.nextStep();

    const currentStep = tutorialService.getCurrentStep();
    const tutorialState = tutorialService.getState();

    set({ currentStep, tutorialState });
  },

  // Reset tutorial
  reset: async () => {
    try {
      // Reset file system
      resetFileSystem();

      // Reinitialize
      await get().initialize();

      // Clear terminal output
      set({
        terminalOutput: ['Tutorial reset!', 'Welcome to Git Quest!', ''],
        currentFile: null,
        fileContent: '',
        files: [],
      });
    } catch (error) {
      console.error('Error resetting tutorial:', error);
    }
  },

  // Refresh git state
  refreshGitState: async () => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const gitState = await tutorialService.getGitState();
      const files = await tutorialService.getFileList();

      set({ gitState, files });
    } catch (error) {
      console.error('Error refreshing git state:', error);
    }
  },

  // Set sidebar view
  setSidebarView: (view: 'source-control' | 'explorer') => {
    set({ sidebarView: view });
  },

  // Stage file (GUI action)
  stageFile: async (filepath: string) => {
    if (!get().requireGuiBranch()) {
      return;
    }
    await get().runGuiAction('stage-file', `git add ${filepath}`);
  },

  // Unstage file (GUI action)
  unstageFile: async (filepath: string) => {
    const { tutorialService } = get();

    if (!tutorialService || !get().requireGuiBranch()) {
      return;
    }

    // There is no git command for unstaging in the tutorial, so check the
    // step here instead of going through runGuiAction.
    const denied = tutorialService.checkGuiAction('unstage-file');
    if (denied) {
      set({
        terminalOutput: [
          ...get().terminalOutput,
          `[GUI] git restore --staged ${filepath}`,
          ...formatCommandResult(denied, tutorialService.getCurrentStep()),
        ],
      });
      return;
    }

    try {
      await tutorialService.unstageFile(filepath);
      await get().refreshGitState();
    } catch (error) {
      console.error('Error unstaging file:', error);
    }
  },

  // Commit (GUI action)
  commit: async (message: string) => {
    if (!get().requireGuiBranch()) {
      return;
    }
    await get().runGuiAction('commit', `git commit -m "${message}"`);
  },

  // Push (GUI action)
  push: async () => {
    if (!get().requireGuiBranch()) {
      return;
    }
    await get().runGuiAction('push', `git push origin ${get().gitState.currentBranch}`);
  },

  // Runs a GUI operation as its git command and prints the result once.
  // The step is checked inside performGuiAction, so no second validation here.
  runGuiAction: async (action: GuiAction, command: string) => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return null;
    }

    const stepBeforeCommand = tutorialService.getCurrentStep();

    try {
      const result = await tutorialService.performGuiAction(action, command);

      set({
        terminalOutput: [
          ...get().terminalOutput,
          `[GUI] ${command}`,
          ...formatCommandResult(result, stepBeforeCommand),
        ],
      });

      await get().refreshGitState();

      set({
        currentStep: tutorialService.getCurrentStep(),
        tutorialState: tutorialService.getState(),
      });
      return result;
    } catch (error) {
      console.error(`Error running GUI action ${action}:`, error);
      return null;
    }
  },

  // Staging, committing and pushing in the GUI stage must happen on the GUI
  // branch. Prints a hint and returns false otherwise.
  requireGuiBranch: () => {
    const { tutorialService, gitState } = get();

    if (
      tutorialService?.getState().currentStage === 'gui' &&
      gitState.currentBranch !== GUI_BRANCH
    ) {
      set({ terminalOutput: [...get().terminalOutput, GUI_BRANCH_HINT, ''] });
      return false;
    }
    return true;
  },

  validateCurrentStep: async () => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    const previousStep = tutorialService.getCurrentStep();

    const validation = await tutorialService.validateCurrentStep();

    // A superseded check was already reported by the check that completed
    // the step, so print nothing for it.
    if (!validation.superseded) {
      const newOutput = [...get().terminalOutput];
      if (validation.passed) {
        if (previousStep.successMessage) {
          newOutput.push(`✓ ${previousStep.successMessage}`);
        }
      } else {
        newOutput.push(validation.message);
        if (validation.hint) {
          newOutput.push(`Hint: ${validation.hint}`);
        }
      }
      newOutput.push('');
      set({ terminalOutput: newOutput });
    }

    await get().refreshGitState();

    const currentStep = tutorialService.getCurrentStep();
    const tutorialState = tutorialService.getState();

    set({ currentStep, tutorialState });
  },

  switchBranch: async (branch: string) => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    const result = await get().runGuiAction('switch-branch', `git checkout ${branch}`);
    const { currentFile } = get();

    if (result?.success && currentFile) {
      try {
        const content = await tutorialService.readFile(currentFile);
        set({ fileContent: content });
      } catch (error) {
        console.error('Error reading file after branch switch:', error);
        set({ fileContent: '' });
      }
    }
  },

  createBranch: async (branch: string) => {
    const trimmed = branch.trim();

    if (!get().tutorialService || trimmed !== GUI_BRANCH) {
      return false;
    }

    const result = await get().runGuiAction('create-branch', `git checkout -b ${trimmed}`);
    return result?.success ?? false;
  },
}));
