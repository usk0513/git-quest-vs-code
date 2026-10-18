import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialService } from '@/services/tutorial/TutorialService';
import { GitService } from '@/services/git/GitService';
import { GitValidator } from '@/services/git/GitValidator';
import { RemoteSimulator } from '@/services/git/RemoteSimulator';
import { CommandParser } from '@/services/terminal/CommandParser';
import { StepValidator } from '@/services/tutorial/StepValidator';
import { getFileSystemService } from '@/services/filesystem/FileSystemService';
import { resetTestFileSystem } from '../../../setup/testFileSystem';
import { TUTORIAL_STEPS, GUI_TUTORIAL_STEPS } from '@/constants/tutorialSteps';
import type { StepConfig } from '@/types';

const findStep = (id: number): StepConfig => {
  const step = [...TUTORIAL_STEPS, ...GUI_TUTORIAL_STEPS].find((s) => s.id === id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }
  return step;
};

describe('TutorialService GUI actions and push validation', () => {
  let service: TutorialService;

  const goToStep = (id: number) => {
    const step = findStep(id);
    const internal = service as unknown as {
      state: { currentStep: number; currentStage: string };
      currentStepConfig: StepConfig;
    };
    internal.state.currentStep = step.id;
    internal.state.currentStage = step.stage;
    internal.currentStepConfig = step;
  };

  // Clone, create the GUI branch and edit greeting.txt, using a confirmation
  // step (no validation rules, no auto-advance) so that setup never advances.
  const prepareGuiBranchWithEdit = async (content: string) => {
    goToStep(1);
    await service.executeCommand('git clone /remote-repo', { skipValidation: true });
    goToStep(2);
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    await service.editFile('greeting.txt', content);
  };

  beforeEach(async () => {
    resetTestFileSystem();
    const fs = getFileSystemService();
    const git = new GitService(fs);
    service = new TutorialService(
      fs,
      git,
      new GitValidator(),
      new StepValidator(fs),
      new RemoteSimulator(fs, git),
      new CommandParser()
    );
    await service.initialize();
  });

  it('does not pass the push step when push is pressed before staging', async () => {
    await prepareGuiBranchWithEdit('Hello, Git Quest!');
    goToStep(41);

    const earlyPush = await service.performGuiAction('push', 'git push origin feature/gui-test');
    expect(earlyPush.success).toBe(false);
    expect(earlyPush.error).toContain('プッシュ');
    expect(service.getState().currentStep).toBe(41);
    expect((await service.getGitState()).remoteBranches).not.toContain('origin/feature/gui-test');

    const stage = await service.performGuiAction('stage-file', 'git add greeting.txt');
    expect(stage.stepCompleted).toBe(true);
    expect(service.getState().currentStep).toBe(51);

    const commit = await service.performGuiAction('commit', 'git commit -m "Add greeting with GUI"');
    expect(commit.stepCompleted).toBe(true);
    // Stops at the push step instead of skipping to the final step.
    expect(service.getState().currentStep).toBe(61);

    const push = await service.performGuiAction('push', 'git push origin feature/gui-test');
    expect(push.stepCompleted).toBe(true);
    expect(service.getState().currentStep).toBe(62);
  });

  it('requires the current HEAD, not an earlier push, to complete the push step', async () => {
    await prepareGuiBranchWithEdit('Commit A');
    await service.executeCommand('git add greeting.txt', { skipValidation: true });
    await service.executeCommand('git commit -m "Commit A"', { skipValidation: true });
    await service.executeCommand('git push origin feature/gui-test', { skipValidation: true });

    await service.editFile('greeting.txt', 'Commit B');
    await service.executeCommand('git add greeting.txt', { skipValidation: true });
    await service.executeCommand('git commit -m "Commit B"', { skipValidation: true });

    goToStep(61);
    const beforePushingB = await service.validateCurrentStep();
    expect(beforePushingB.passed).toBe(false);
    expect(service.getState().currentStep).toBe(61);

    const pushB = await service.executeCommand('git push origin feature/gui-test', {
      skipValidation: true,
    });
    expect(pushB.stepCompleted).toBe(true);
    expect(service.getState().currentStep).toBe(62);
  });

  it('does not count a push of another branch for the current branch', async () => {
    await prepareGuiBranchWithEdit('Feature change');
    await service.executeCommand('git add greeting.txt', { skipValidation: true });
    await service.executeCommand('git commit -m "Feature change"', { skipValidation: true });
    await service.executeCommand('git push origin main', { skipValidation: true });

    goToStep(61);
    const validation = await service.validateCurrentStep();
    expect(validation.passed).toBe(false);
    expect(service.getState().currentStep).toBe(61);
  });

  it('returns the success message of the step that was completed', async () => {
    await prepareGuiBranchWithEdit('Hello, Git Quest!');
    goToStep(41);

    const stage = await service.performGuiAction('stage-file', 'git add greeting.txt');

    expect(stage.validationResult?.passed).toBe(true);
    expect(stage.validationResult?.message).toBe(findStep(41).successMessage);
  });

  it('discards an overlapping check instead of advancing the next step', async () => {
    await prepareGuiBranchWithEdit('Hello, Git Quest!');
    goToStep(31);

    const results = await Promise.all([
      service.validateCurrentStep(),
      service.validateCurrentStep(),
    ]);

    // One check completes step 31; the other is discarded, so the tutorial
    // stops at confirmation step 32 instead of moving on to 41.
    expect(service.getState().currentStep).toBe(32);
    expect(results.filter((r) => r.passed)).toHaveLength(1);
    expect(results.filter((r) => r.superseded)).toHaveLength(1);
  });

  // The GUI stage blocks the git commands that change the repository, so a
  // failed check there must point to the on-screen control instead.
  it.each([
    {
      id: 20,
      setUp: () => prepareGuiBranchWithEdit('Hello, Git Quest!'),
      message: 'まだ main ブランチに切り替わっていません',
      hint: '画面左下のブランチ名をクリックし、画面上部に表示されるメニューから main をクリックしてください',
    },
    {
      id: 22,
      setUp: async () => {
        goToStep(1);
        await service.executeCommand('git clone /remote-repo', { skipValidation: true });
      },
      message: 'feature/gui-test ブランチはまだ作成されていません',
      hint: '画面左下のブランチ名をクリックし、画面上部に表示されるメニューの「+ 新しいブランチの作成...」で feature/gui-test を作成してください',
    },
    {
      id: 31,
      setUp: () => prepareGuiBranchWithEdit('Hello'),
      message: 'greeting.txt に「Hello, Git Quest!」がまだ入力されていません',
      hint: 'エクスプローラーで greeting.txt をクリックして開き、中央のエディタに「Hello, Git Quest!」と入力してください',
    },
    {
      id: 41,
      setUp: () => prepareGuiBranchWithEdit('Hello, Git Quest!'),
      message: 'greeting.txt はまだステージされていません',
      hint: 'ソース管理ビューの「変更」で greeting.txt の行にマウスを乗せ、右端に表示される「+」ボタンをクリックしてください',
    },
    {
      id: 51,
      setUp: () => prepareGuiBranchWithEdit('Hello, Git Quest!'),
      message: 'まだ新しいコミットがありません',
      hint: 'ソース管理ビューでコミットメッセージを入力し、「✓ コミット」ボタンをクリックしてください',
    },
    {
      id: 61,
      setUp: () => prepareGuiBranchWithEdit('Hello, Git Quest!'),
      message: 'まだプッシュしていません',
      hint: 'ソース管理ビューの「✓ コミット」ボタンの右にある「↑ プッシュ」ボタンをクリックしてください',
    },
  ])('names the on-screen control when the check of GUI step $id fails', async ({
    id,
    setUp,
    message,
    hint,
  }) => {
    await setUp();
    goToStep(id);

    const result = await service.validateCurrentStep();

    expect(result).toEqual({ passed: false, message, hint });
    expect(result.hint).not.toMatch(/\bgit\b/);
    expect(service.getState().currentStep).toBe(id);
  });

  it('reports the same GUI wording after a command on a GUI step', async () => {
    await prepareGuiBranchWithEdit('Hello, Git Quest!');
    goToStep(41);

    const result = await service.executeCommand('git status');

    expect(result.success).toBe(true);
    expect(result.validationResult?.message).toBe('greeting.txt はまだステージされていません');
    expect(result.validationResult?.hint).toContain('「+」ボタン');
  });

  it('keeps the git command hints in the terminal stage', async () => {
    goToStep(1);
    await service.executeCommand('git clone /remote-repo', { skipValidation: true });
    await service.editFile('greeting.txt', 'Hello, Git!');
    goToStep(7);

    const result = await service.validateCurrentStep();

    expect(result).toEqual({
      passed: false,
      message: 'File greeting.txt is not staged',
      hint: 'Use git add to stage the file',
    });
  });

  it('rejects changing actions on confirmation steps without running them', async () => {
    await prepareGuiBranchWithEdit('Hello, Git Quest!');
    goToStep(62);

    expect(service.isGuiActionAllowed('switch-branch')).toBe(false);
    const result = await service.performGuiAction('switch-branch', 'git checkout main');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ブランチの切り替え');
    expect((await service.getGitState()).currentBranch).toBe('feature/gui-test');
    expect(service.getState().currentStep).toBe(62);
  });
});
