import { CommandExecutionResult, TutorialState, StepConfig, ValidationResult } from '@/types';
import { FileSystemService } from '../filesystem/FileSystemService';
import { GitService } from '../git/GitService';
import { GitValidator } from '../git/GitValidator';
import { RemoteSimulator } from '../git/RemoteSimulator';
import { CommandParser } from '../terminal/CommandParser';
import { StepValidator } from './StepValidator';
import { TUTORIAL_STEPS, GUI_TUTORIAL_STEPS } from '@/constants/tutorialSteps';
import { WORKSPACE_DIR } from '@/constants/initialFiles';

export class TutorialService {
  private fs: FileSystemService;
  private git: GitService;
  private validator: GitValidator;
  private stepValidator: StepValidator;
  private remoteSimulator: RemoteSimulator;
  private parser: CommandParser;
  private state: TutorialState;
  private currentStepConfig: StepConfig;
  private pushedBranches: Set<string> = new Set();

  private isAutoAdvance(step: StepConfig): boolean {
    return step.autoAdvance !== false;
  }

  constructor(
    fileSystem: FileSystemService,
    gitService: GitService,
    validator: GitValidator,
    stepValidator: StepValidator,
    remoteSimulator: RemoteSimulator,
    parser: CommandParser
  ) {
    this.fs = fileSystem;
    this.git = gitService;
    this.validator = validator;
    this.stepValidator = stepValidator;
    this.remoteSimulator = remoteSimulator;
    this.parser = parser;
    this.state = {
      currentStep: 0,
      currentStage: 'terminal',
      isCompleted: false,
      terminalStageCompleted: false,
      guiStageCompleted: false,
    };
    this.currentStepConfig = TUTORIAL_STEPS[0];
  }

  async initialize(): Promise<void> {
    try {
      // Create remote repository
      await this.remoteSimulator.createRemoteRepository();
      console.log('Tutorial initialized');
    } catch (error) {
      console.error('Error initializing tutorial:', error);
      throw error;
    }
  }

  async executeCommand(commandString: string): Promise<CommandExecutionResult> {
    try {
      // Step 0 doesn't allow commands
      if (this.state.currentStep === 0) {
        return {
          success: false,
          output: '',
          error: 'Please proceed to Step 1 first',
          hint: 'Click the "Next" button to continue',
        };
      }

      // Validate command
      const validation = this.validator.validateCommand(
        commandString,
        this.currentStepConfig.allowedCommands,
        {
          allowBranchCreation: this.currentStepConfig.allowBranchCreation,
        }
      );

      if (!validation.passed) {
        return {
          success: false,
          output: '',
          error: validation.message,
          hint: validation.hint,
        };
      }

      // Parse command
      const parsed = this.parser.parse(commandString);

      // Execute command
      const result = await this.executeGitCommand(parsed);

      let validationResult: ValidationResult | null = null;
      if (result.success) {
        // Check if step is completed
        validationResult = await this.checkStepCompletion();
      }

      return {
        ...result,
        stepCompleted: validationResult?.passed ?? false,
        validationResult: validationResult ?? undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Command execution failed',
      };
    }
  }

  private async executeGitCommand(parsed: any): Promise<CommandExecutionResult> {
    try {
      switch (parsed.command) {
        case 'clone':
          return await this.handleClone();

        case 'checkout':
          return await this.handleCheckout(parsed);

        case 'branch':
          return await this.handleBranch(parsed);

        case 'add':
          return await this.handleAdd(parsed);

        case 'commit':
          return await this.handleCommit(parsed);

        case 'push':
          return await this.handlePush(parsed);

        case 'status':
          return await this.handleStatus();

        case 'log':
          return await this.handleLog();

        case 'diff':
          return await this.handleDiff(parsed);

        default:
          return {
            success: false,
            output: '',
            error: `Command ${parsed.command} is not yet implemented`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Command execution failed',
      };
    }
  }

  private async handleClone(): Promise<CommandExecutionResult> {
    try {
      await this.remoteSimulator.cloneToWorkspace(WORKSPACE_DIR);

      // After cloning, we need to stage and commit the files
      const files = await this.fs.readdir(WORKSPACE_DIR);
      for (const file of files) {
        if (file !== '.git') {
          await this.git.add(WORKSPACE_DIR, file);
        }
      }
      await this.git.commit(WORKSPACE_DIR, 'Initial commit');

      return {
        success: true,
        output: `Cloning into '${WORKSPACE_DIR}'...\nDone.`,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleCheckout(parsed: any): Promise<CommandExecutionResult> {
    try {
      const branchName = parsed.branchName!;

      if (parsed.flags.includes('-b')) {
        // Create and checkout new branch
        await this.git.branch(WORKSPACE_DIR, branchName, true);
        return {
          success: true,
          output: `Switched to a new branch '${branchName}'`,
        };
      } else {
        // Checkout existing branch
        await this.git.checkout(WORKSPACE_DIR, branchName);
        return {
          success: true,
          output: `Switched to branch '${branchName}'`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleBranch(parsed: any): Promise<CommandExecutionResult> {
    try {
      if (parsed.args.length === 0) {
        // List branches
        const branches = await this.git.listBranches(WORKSPACE_DIR);
        const currentBranch = await this.git.currentBranch(WORKSPACE_DIR);
        const output = branches
          .map((b) => (b === currentBranch ? `* ${b}` : `  ${b}`))
          .join('\n');
        return {
          success: true,
          output,
        };
      } else {
        // Create branch
        const branchName = parsed.args[0];
        await this.git.branch(WORKSPACE_DIR, branchName);
        return {
          success: true,
          output: `Branch '${branchName}' created`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleAdd(parsed: any): Promise<CommandExecutionResult> {
    try {
      const filepath = parsed.args[0];

      if (filepath === '.') {
        // Add all files
        const gitState = await this.git.getGitState(WORKSPACE_DIR);
        for (const file of gitState.unstagedFiles) {
          await this.git.add(WORKSPACE_DIR, file.path);
        }
        return {
          success: true,
          output: 'Changes staged for commit',
        };
      } else {
        // Add specific file
        await this.git.add(WORKSPACE_DIR, filepath);
        return {
          success: true,
          output: `Added '${filepath}' to staging area`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleCommit(parsed: any): Promise<CommandExecutionResult> {
    try {
      const message = parsed.message!;
      const sha = await this.git.commit(WORKSPACE_DIR, message);
      return {
        success: true,
        output: `[${await this.git.currentBranch(WORKSPACE_DIR)} ${sha.substring(0, 7)}] ${message}`,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handlePush(parsed: any): Promise<CommandExecutionResult> {
    try {
      const remote = parsed.args[0]; // e.g., 'origin'
      const branch = parsed.args[1]; // e.g., 'main'

      const success = await this.remoteSimulator.simulatePush(WORKSPACE_DIR, branch);

      if (success) {
        this.pushedBranches.add(branch);
        return {
          success: true,
          output: `To ${remote}\n * [new branch]      ${branch} -> ${branch}`,
        };
      } else {
        return {
          success: false,
          output: '',
          error: 'Push failed',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleStatus(): Promise<CommandExecutionResult> {
    try {
      const gitState = await this.git.getGitState(WORKSPACE_DIR);
      let output = `On branch ${gitState.currentBranch}\n\n`;

      if (gitState.stagedFiles.length > 0) {
        output += 'Changes to be committed:\n';
        gitState.stagedFiles.forEach((file) => {
          output += `  ${file.status}: ${file.path}\n`;
        });
        output += '\n';
      }

      if (gitState.unstagedFiles.length > 0) {
        output += 'Changes not staged for commit:\n';
        gitState.unstagedFiles.forEach((file) => {
          output += `  ${file.status}: ${file.path}\n`;
        });
      }

      if (gitState.stagedFiles.length === 0 && gitState.unstagedFiles.length === 0) {
        output += 'nothing to commit, working tree clean';
      }

      return {
        success: true,
        output,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleLog(): Promise<CommandExecutionResult> {
    try {
      const commits = await this.git.log(WORKSPACE_DIR, 10);
      const output = commits
        .map(
          (commit) =>
            `commit ${commit.oid}\nAuthor: ${commit.author.name} <${commit.author.email}>\n\n    ${commit.message}\n`
        )
        .join('\n');

      return {
        success: true,
        output: output || 'No commits yet',
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
      };
    }
  }

  private async handleDiff(parsed: any): Promise<CommandExecutionResult> {
    try {
      const filepath = parsed.args[0];
      const diffOutput = await this.git.diff(WORKSPACE_DIR, filepath);
      return {
        success: true,
        output: diffOutput,
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Failed to generate diff',
      };
    }
  }

  private async checkStepCompletion(): Promise<ValidationResult> {
    const gitState = await this.git.getGitState(WORKSPACE_DIR);

    // For push validation, check if branch was pushed
    const rules = this.currentStepConfig.validationRules.map((rule) => {
      if (rule.type === 'pushed') {
        const currentBranch = gitState.currentBranch;
        if (this.pushedBranches.has(currentBranch)) {
          return rule;
        } else {
          return { ...rule, type: 'pushed' as const };
        }
      }
      return rule;
    });

    const validation = await this.stepValidator.validateStep(
      rules,
      gitState,
      WORKSPACE_DIR
    );

    if (!validation.passed) {
      return validation;
    }

    if (this.isAutoAdvance(this.currentStepConfig)) {
      this.advanceStep();
    }

    return {
      passed: true,
      message: this.currentStepConfig.successMessage || validation.message,
    };
  }

  async validateCurrentStep(): Promise<ValidationResult> {
    return await this.checkStepCompletion();
  }

  private advanceStep(): void {
    if (this.state.currentStage === 'terminal') {
      const currentIndex = TUTORIAL_STEPS.findIndex(
        (step) => step.id === this.state.currentStep
      );
      const nextStep = currentIndex >= 0 ? TUTORIAL_STEPS[currentIndex + 1] : undefined;

      if (nextStep) {
        this.state.currentStep = nextStep.id;
        this.currentStepConfig = nextStep;
        return;
      }

      this.state.terminalStageCompleted = true;
      this.state.currentStage = 'gui';

      const firstGuiStep = GUI_TUTORIAL_STEPS[0];
      if (firstGuiStep) {
        this.state.currentStep = firstGuiStep.id;
        this.currentStepConfig = firstGuiStep;
      } else {
        this.state.isCompleted = true;
      }
    } else {
      const currentIndex = GUI_TUTORIAL_STEPS.findIndex(
        (step) => step.id === this.state.currentStep
      );
      const nextStep =
        currentIndex >= 0 ? GUI_TUTORIAL_STEPS[currentIndex + 1] : undefined;

      if (nextStep) {
        this.state.currentStep = nextStep.id;
        this.currentStepConfig = nextStep;
      } else {
        this.state.guiStageCompleted = true;
        this.state.isCompleted = true;
      }
    }
  }

  async nextStep(): Promise<void> {
    if (!this.isAutoAdvance(this.currentStepConfig)) {
      this.advanceStep();
    }
  }

  getCurrentStep(): StepConfig {
    return this.currentStepConfig;
  }

  getState(): TutorialState {
    return this.state;
  }

  async reset(): Promise<void> {
    // Reset state
    this.state = {
      currentStep: 0,
      currentStage: 'terminal',
      isCompleted: false,
      terminalStageCompleted: false,
      guiStageCompleted: false,
    };
    this.currentStepConfig = TUTORIAL_STEPS[0];
    this.pushedBranches.clear();

    // Reinitialize remote repository
    await this.initialize();
  }

  async getGitState() {
    return await this.git.getGitState(WORKSPACE_DIR);
  }

  async editFile(filepath: string, content: string): Promise<void> {
    const fullPath = `${WORKSPACE_DIR}/${filepath}`;
    await this.fs.writeFile(fullPath, content);
  }

  async readFile(filepath: string): Promise<string> {
    const fullPath = `${WORKSPACE_DIR}/${filepath}`;
    return await this.fs.readFile(fullPath);
  }

  async getFileList(): Promise<string[]> {
    try {
      const exists = await this.fs.exists(WORKSPACE_DIR);
      if (!exists) {
        return [];
      }
      return await this.fs.readdir(WORKSPACE_DIR);
    } catch {
      return [];
    }
  }
}
