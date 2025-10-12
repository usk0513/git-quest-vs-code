import { GitCommand } from './git';

export type TutorialStage = 'terminal' | 'gui';

export interface StepConfig {
  id: number;
  stage: TutorialStage;
  title: string;
  description: string;
  detailedInstructions: string;
  allowedCommands: GitCommand[];
  allowedGuiActions?: GuiAction[];
  allowBranchCreation?: boolean;
  requiresValidationButton?: boolean;
  validationButtonLabel?: string;
  hints: string[];
  successMessage: string;
  validationRules: ValidationRule[];
  autoAdvance?: boolean;
}

export type GuiAction =
  | 'stage-file'
  | 'unstage-file'
  | 'commit'
  | 'push'
  | 'create-branch'
  | 'switch-branch'
  | 'edit-file';

export interface ValidationRule {
  type: 'file-exists' | 'file-staged' | 'commit-made' | 'branch-created' | 'branch-switched' | 'file-content' | 'pushed';
  target?: string;
  expectedValue?: string | boolean | number;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  hint?: string;
}

export interface CommandExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  hint?: string;
  stepCompleted?: boolean;
  validationResult?: ValidationResult;
}

export interface TutorialState {
  currentStep: number;
  currentStage: TutorialStage;
  isCompleted: boolean;
  terminalStageCompleted: boolean;
  guiStageCompleted: boolean;
}
