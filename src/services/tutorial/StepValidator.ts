import { ValidationResult, ValidationRule, GitState } from '@/types';
import { FileSystemService } from '../filesystem/FileSystemService';

export class StepValidator {
  private fs: FileSystemService;

  constructor(fileSystem: FileSystemService) {
    this.fs = fileSystem;
  }

  async validateStep(
    rules: ValidationRule[],
    gitState: GitState,
    workspaceDir: string
  ): Promise<ValidationResult> {
    for (const rule of rules) {
      const result = await this.validateRule(rule, gitState, workspaceDir);
      if (!result.passed) {
        return result;
      }
    }

    return {
      passed: true,
      message: 'Step completed successfully!',
    };
  }

  private async validateRule(
    rule: ValidationRule,
    gitState: GitState,
    workspaceDir: string
  ): Promise<ValidationResult> {
    switch (rule.type) {
      case 'file-exists':
        return await this.validateFileExists(rule.target!, workspaceDir);

      case 'file-staged':
        return this.validateFileStaged(rule.target!, gitState);

      case 'commit-made':
        return this.validateCommitMade(rule, gitState);

      case 'branch-created':
        return this.validateBranchCreated(rule.target!, gitState);

      case 'branch-switched':
        return this.validateBranchSwitched(rule.target!, gitState);

      case 'file-content':
        return await this.validateFileContent(
          rule.target!,
          rule.expectedValue as string,
          workspaceDir
        );

      case 'pushed':
        return this.validatePushed();

      default:
        return {
          passed: false,
          message: 'Unknown validation rule',
        };
    }
  }

  private async validateFileExists(
    filepath: string,
    workspaceDir: string
  ): Promise<ValidationResult> {
    const fullPath = `${workspaceDir}/${filepath}`;
    const exists = await this.fs.exists(fullPath);

    if (!exists) {
      return {
        passed: false,
        message: `File ${filepath} does not exist`,
        hint: 'Make sure the file has been created',
      };
    }

    return {
      passed: true,
      message: `File ${filepath} exists`,
    };
  }

  private validateFileStaged(filepath: string, gitState: GitState): ValidationResult {
    const isStaged = gitState.stagedFiles.some((f) => f.path === filepath);

    if (!isStaged) {
      return {
        passed: false,
        message: `File ${filepath} is not staged`,
        hint: 'Use git add to stage the file',
      };
    }

    return {
      passed: true,
      message: `File ${filepath} is staged`,
    };
  }

  private validateCommitMade(rule: ValidationRule, gitState: GitState): ValidationResult {
    const minCommits =
      typeof rule.expectedValue === 'number' && !Number.isNaN(rule.expectedValue)
        ? rule.expectedValue
        : 1;

    if (gitState.commits.length < minCommits) {
      return {
        passed: false,
        message: 'No new commits detected',
        hint: 'Use git commit to record your changes',
      };
    }

    return {
      passed: true,
      message: 'Commit created successfully',
    };
  }

  private validateBranchCreated(
    branchName: string,
    gitState: GitState
  ): ValidationResult {
    const branchExists = gitState.branches.includes(branchName);

    if (!branchExists) {
      return {
        passed: false,
        message: `Branch ${branchName} does not exist`,
        hint: `Use git branch ${branchName} or git checkout -b ${branchName}`,
      };
    }

    return {
      passed: true,
      message: `Branch ${branchName} created`,
    };
  }

  private validateBranchSwitched(
    branchName: string,
    gitState: GitState
  ): ValidationResult {
    if (gitState.currentBranch !== branchName) {
      return {
        passed: false,
        message: `Not on branch ${branchName}`,
        hint: `Use git checkout ${branchName} to switch to the branch`,
      };
    }

    return {
      passed: true,
      message: `Switched to branch ${branchName}`,
    };
  }

  private async validateFileContent(
    filepath: string,
    expectedContent: string,
    workspaceDir: string
  ): Promise<ValidationResult> {
    try {
      const fullPath = `${workspaceDir}/${filepath}`;
      const content = await this.fs.readFile(fullPath);

      if (!content.includes(expectedContent)) {
        return {
          passed: false,
          message: `File ${filepath} does not contain expected content`,
          hint: `Make sure the file contains: "${expectedContent}"`,
        };
      }

      return {
        passed: true,
        message: `File ${filepath} has correct content`,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Cannot read file ${filepath}`,
        hint: 'Make sure the file exists and is readable',
      };
    }
  }

  private validatePushed(): ValidationResult {
    // For simulation purposes, we assume push is always successful
    // In real scenario, we would check remote state
    return {
      passed: true,
      message: 'Changes pushed to remote',
    };
  }
}
