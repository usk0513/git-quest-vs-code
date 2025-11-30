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
import { GitState, StepConfig, TutorialState, CommandExecutionResult } from '@/types';

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

      const newOutput = [...get().terminalOutput];
      if (result.output) {
        newOutput.push(result.output);
      }
      if (result.error) {
        newOutput.push(`Error: ${result.error}`);
        if (result.hint) {
          newOutput.push(`Hint: ${result.hint}`);
        }
      }

      if (result.validationResult && !result.validationResult.passed) {
        newOutput.push(result.validationResult.message);
        if (result.validationResult.hint) {
          newOutput.push(`Hint: ${result.validationResult.hint}`);
        }
      }

      if (result.success && result.stepCompleted && previousStep.successMessage) {
        newOutput.push(`✓ ${previousStep.successMessage}`);
      }

      newOutput.push('');

      set({ terminalOutput: newOutput });

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
    const { tutorialService, gitState } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const state = tutorialService.getState();
      if (state.currentStage === 'gui' && gitState.currentBranch !== 'feature/gui-test') {
        set({
          terminalOutput: [
            ...get().terminalOutput,
            'Hint: GUIステージでは feature/gui-test ブランチで操作してください。',
            '',
          ],
        });
        return;
      }
      // Execute git add command internally
      await tutorialService.executeCommand(`git add ${filepath}`, { skipValidation: true });
      await get().refreshGitState();
      if (tutorialService.getState().currentStage === 'gui') {
        await get().validateCurrentStep();
      }
    } catch (error) {
      console.error('Error staging file:', error);
    }
  },

  // Unstage file (GUI action)
  unstageFile: async (filepath: string) => {
    const { tutorialService, gitState } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const state = tutorialService.getState();
      if (state.currentStage === 'gui' && gitState.currentBranch !== 'feature/gui-test') {
        set({
          terminalOutput: [
            ...get().terminalOutput,
            'Hint: GUIステージでは feature/gui-test ブランチで操作してください。',
            '',
          ],
        });
        return;
      }
      await tutorialService.unstageFile(filepath);
      await get().refreshGitState();
      if (tutorialService.getState().currentStage === 'gui') {
        await get().validateCurrentStep();
      }
    } catch (error) {
      console.error('Error unstaging file:', error);
    }
  },

  // Commit (GUI action)
  commit: async (message: string) => {
    const { tutorialService, gitState } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const state = tutorialService.getState();
      if (state.currentStage === 'gui' && gitState.currentBranch !== 'feature/gui-test') {
        set({
          terminalOutput: [
            ...get().terminalOutput,
            'Hint: GUIステージでは feature/gui-test ブランチで操作してください。',
            '',
          ],
        });
        return;
      }
      await tutorialService.executeCommand(`git commit -m "${message}"`, { skipValidation: true });
      await get().refreshGitState();
      if (tutorialService.getState().currentStage === 'gui') {
        await get().validateCurrentStep();
      }
    } catch (error) {
      console.error('Error committing:', error);
    }
  },

  // Push (GUI action)
  push: async () => {
    const { tutorialService, gitState } = get();

    if (!tutorialService) {
      return;
    }

    try {
      const state = tutorialService.getState();
      if (state.currentStage === 'gui' && gitState.currentBranch !== 'feature/gui-test') {
        set({
          terminalOutput: [
            ...get().terminalOutput,
            'Hint: GUIステージでは feature/gui-test ブランチで操作してください。',
            '',
          ],
        });
        return;
      }
      const branch = gitState.currentBranch;
      await tutorialService.executeCommand(`git push origin ${branch}`, { skipValidation: true });
      await get().refreshGitState();
      if (tutorialService.getState().currentStage === 'gui') {
        await get().validateCurrentStep();
      }
    } catch (error) {
      console.error('Error pushing:', error);
    }
  },

  validateCurrentStep: async () => {
    const { tutorialService } = get();

    if (!tutorialService) {
      return;
    }

    const previousStep = tutorialService.getCurrentStep();

    const validation = await tutorialService.validateCurrentStep();

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

    await get().refreshGitState();

    const currentStep = tutorialService.getCurrentStep();
    const tutorialState = tutorialService.getState();

    set({ currentStep, tutorialState });
  },

  switchBranch: async (branch: string) => {
    const { tutorialService, currentFile } = get();

    if (!tutorialService) {
      return;
    }

    try {
      await tutorialService.executeCommand(`git checkout ${branch}`, { skipValidation: true });
      await get().refreshGitState();

      if (currentFile) {
        try {
          const content = await tutorialService.readFile(currentFile);
          set({ fileContent: content });
        } catch (error) {
          console.error('Error reading file after branch switch:', error);
          set({ fileContent: '' });
        }
      }

      const currentStep = tutorialService.getCurrentStep();
      const tutorialState = tutorialService.getState();
      set({ currentStep, tutorialState });
    } catch (error) {
      console.error('Error switching branch:', error);
    }
  },

  createBranch: async (branch: string) => {
    const { tutorialService } = get();

    if (!tutorialService || !branch.trim()) {
      return false;
    }

    const trimmed = branch.trim();
    if (trimmed !== 'feature/gui-test') {
      return false;
    }

    try {
      await tutorialService.executeCommand(`git checkout -b ${trimmed}`, { skipValidation: true });
      await get().refreshGitState();

      const currentStep = tutorialService.getCurrentStep();
      const tutorialState = tutorialService.getState();
      set({ currentStep, tutorialState });
      return true;
    } catch (error) {
      console.error('Error creating branch:', error);
      return false;
    }
  },
}));
