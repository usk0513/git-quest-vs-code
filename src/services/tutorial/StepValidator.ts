import type { ValidationResult, ValidationRule, GitState, TutorialStage } from '@/types';
import { GUI_BRANCH_BASE } from '@/constants/initialFiles';
import type { FileSystemService } from '../filesystem/FileSystemService';

export class StepValidator {
  private fs: FileSystemService;

  constructor(fileSystem: FileSystemService) {
    this.fs = fileSystem;
  }

  async validateStep(
    rules: ValidationRule[],
    gitState: GitState,
    workspaceDir: string,
    stage: TutorialStage = 'terminal'
  ): Promise<ValidationResult> {
    for (const rule of rules) {
      const result = await this.validateRule(rule, gitState, workspaceDir);
      if (!result.passed) {
        return stage === 'gui' ? this.guiFailure(rule, result, gitState) : result;
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
    // Rules that check a file or branch name need a target; a step defined
    // without one fails validation instead of comparing against undefined.
    const { target } = rule;

    switch (rule.type) {
      case 'file-exists':
        if (!target) return this.missingTarget(rule);
        return await this.validateFileExists(target, workspaceDir);

      case 'file-staged':
        if (!target) return this.missingTarget(rule);
        return this.validateFileStaged(target, gitState);

      case 'commit-made':
        return this.validateCommitMade(rule, gitState);

      case 'branch-created':
        if (!target) return this.missingTarget(rule);
        return this.validateBranchCreated(target, gitState);

      case 'branch-switched':
        if (!target) return this.missingTarget(rule);
        return this.validateBranchSwitched(target, gitState);

      case 'file-content':
        if (!target) return this.missingTarget(rule);
        return await this.validateFileContent(
          target,
          rule.expectedValue as string,
          workspaceDir
        );

      case 'pushed':
        return this.validatePushed(rule);

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
    } catch {
      return {
        passed: false,
        message: `Cannot read file ${filepath}`,
        hint: 'Make sure the file exists and is readable',
      };
    }
  }

  // In the GUI stage the terminal rejects the commands that change the
  // repository, so a failed rule must not suggest one. Say what is still
  // missing and which on-screen control does it, in the same words as the
  // step instructions. Rules defined without a target keep their message.
  private guiFailure(
    rule: ValidationRule,
    failed: ValidationResult,
    gitState: GitState
  ): ValidationResult {
    const { target } = rule;

    switch (rule.type) {
      case 'branch-created':
        if (!target) return failed;
        return {
          passed: false,
          message: `${target} ブランチはまだ作成されていません`,
          // The create item is disabled on any other branch (see App.tsx),
          // so ask for the switch first.
          hint:
            gitState.currentBranch === GUI_BRANCH_BASE
              ? `画面左下のブランチ名をクリックし、画面上部に表示されるメニューの「+ 新しいブランチの作成...」で ${target} を作成してください`
              : `「+ 新しいブランチの作成...」は ${GUI_BRANCH_BASE} ブランチにいるときだけ使えます。先に、画面左下のブランチ名をクリックし、画面上部に表示されるメニューから ${GUI_BRANCH_BASE} をクリックして切り替えてください`,
        };

      case 'branch-switched':
        if (!target) return failed;
        return {
          passed: false,
          message: `まだ ${target} ブランチに切り替わっていません`,
          hint: `画面左下のブランチ名をクリックし、画面上部に表示されるメニューから ${target} をクリックしてください`,
        };

      case 'file-content':
        if (!target) return failed;
        return {
          passed: false,
          message: `${target} に「${rule.expectedValue}」がまだ入力されていません`,
          hint: `エクスプローラーで ${target} をクリックして開き、中央のエディタに「${rule.expectedValue}」と入力してください`,
        };

      case 'file-staged':
        if (!target) return failed;
        return {
          passed: false,
          message: `${target} はまだステージされていません`,
          hint: `ソース管理ビューの「変更」で ${target} の行にマウスを乗せ、右端に表示される「+」ボタンをクリックしてください`,
        };

      case 'commit-made':
        return {
          passed: false,
          message: 'まだ新しいコミットがありません',
          hint: 'ソース管理ビューでコミットメッセージを入力し、「✓ コミット」ボタンをクリックしてください',
        };

      case 'pushed':
        return {
          passed: false,
          message: 'まだプッシュしていません',
          hint: 'ソース管理ビューの「✓ コミット」ボタンの右にある「↑ プッシュ」ボタンをクリックしてください',
        };

      default:
        return failed;
    }
  }

  private missingTarget(rule: ValidationRule): ValidationResult {
    return {
      passed: false,
      message: `Validation rule "${rule.type}" has no target`,
    };
  }

  private validatePushed(rule: ValidationRule): ValidationResult {
    if (rule.expectedValue !== true) {
      return {
        passed: false,
        message: 'Push not detected yet',
        hint: 'Use git push origin <branch> to push your commits',
      };
    }

    return {
      passed: true,
      message: 'Changes pushed to remote',
    };
  }
}
