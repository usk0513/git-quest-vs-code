import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialService } from '@/services/tutorial/TutorialService';
import { GitService } from '@/services/git/GitService';
import { GitValidator } from '@/services/git/GitValidator';
import { RemoteSimulator } from '@/services/git/RemoteSimulator';
import { CommandParser } from '@/services/terminal/CommandParser';
import { StepValidator } from '@/services/tutorial/StepValidator';
import { getFileSystemService, resetFileSystem } from '@/services/filesystem/FileSystemService';
import { WORKSPACE_DIR } from '@/constants/initialFiles';
import { TUTORIAL_STEPS } from '@/constants/tutorialSteps';

describe('TutorialService git state tracking', () => {
  let service: TutorialService;

  beforeEach(async () => {
    resetFileSystem();
    const fs = getFileSystemService();
    const git = new GitService(fs);
    const validator = new GitValidator();
    const stepValidator = new StepValidator(fs);
    const remoteSimulator = new RemoteSimulator(fs, git);
    const parser = new CommandParser();

    service = new TutorialService(fs, git, validator, stepValidator, remoteSimulator, parser);
    await service.initialize();
  });

  it('increments ahead count after committing and resets after push', async () => {
    const internal = service as any;
    internal.state.currentStep = 1;
    internal.state.currentStage = 'terminal';
    internal.currentStepConfig = TUTORIAL_STEPS[1];

    await service.executeCommand('git clone origin main', { skipValidation: true });
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    await service.editFile('greeting.txt', 'Hello from test');
    await service.executeCommand('git add greeting.txt', { skipValidation: true });
    await service.executeCommand('git commit -m "Test commit"', { skipValidation: true });

    const stateAfterCommit = await service.getGitState();
    expect(stateAfterCommit.aheadCount).toBe(1);

    await service.executeCommand('git push origin feature/gui-test', { skipValidation: true });
    const stateAfterPush = await service.getGitState();

    expect(stateAfterPush.aheadCount).toBe(0);
    expect(stateAfterPush.remoteBranches).toContain('origin/feature/gui-test');
  });

  it('maintains ahead count per branch', async () => {
    const internal = service as any;
    internal.state.currentStep = 1;
    internal.state.currentStage = 'terminal';
    internal.currentStepConfig = TUTORIAL_STEPS[1];

    await service.executeCommand('git clone origin main', { skipValidation: true });
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    await service.editFile('greeting.txt', 'Hello from feature branch');
    await service.executeCommand('git add greeting.txt', { skipValidation: true });
    await service.executeCommand('git commit -m "First commit"', { skipValidation: true });

    const featureState = await service.getGitState();
    expect(featureState.aheadCount).toBe(1);

    await service.executeCommand('git checkout main', { skipValidation: true });
    const mainState = await service.getGitState();
    expect(mainState.aheadCount).toBe(0);
  });
});
