import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { resetTestFileSystem } from '../../setup/testFileSystem';
import type { TutorialService } from '@/services/tutorial/TutorialService';
import { TUTORIAL_STEPS, GUI_TUTORIAL_STEPS } from '@/constants/tutorialSteps';
import type { StepConfig } from '@/types';

const findStep = (id: number): StepConfig => {
  const step = [...TUTORIAL_STEPS, ...GUI_TUTORIAL_STEPS].find((s) => s.id === id);
  if (!step) {
    throw new Error(`Step ${id} not found`);
  }
  return step;
};

const goToStep = (service: TutorialService, id: number) => {
  const step = findStep(id);
  const internal = service as unknown as {
    state: { currentStep: number; currentStage: string };
    currentStepConfig: StepConfig;
  };
  internal.state.currentStep = step.id;
  internal.state.currentStage = step.stage;
  internal.currentStepConfig = step;
};

// Operations requested before the previous one finished (a learner typing
// quickly, or clicking a GUI button while a command runs) must run and print
// in the order they were requested.
describe('useAppStore operation order', () => {
  beforeEach(async () => {
    resetTestFileSystem();
    await useAppStore.getState().initialize();
  });

  it('prints each terminal command right before its own output', async () => {
    const store = useAppStore.getState();
    await store.nextStep();
    await store.executeCommand('git clone /remote-repo');
    expect(useAppStore.getState().currentStep?.id).toBe(2);
    useAppStore.setState({ terminalOutput: [] });

    // The second command is typed before the first one has finished.
    await Promise.all([store.executeCommand('git status'), store.executeCommand('git log')]);

    const output = useAppStore.getState().terminalOutput;
    const statusAt = output.indexOf('$ git status');
    const logAt = output.indexOf('$ git log');
    expect(statusAt).toBe(0);
    expect(output[statusAt + 1]).toMatch(/^On branch main/);
    expect(logAt).toBeGreaterThan(statusAt + 1);
    expect(output[logAt + 1]).toMatch(/^commit [0-9a-f]{40}/);
  });

  it('runs GUI operations in the order they were requested', async () => {
    const service = useAppStore.getState().tutorialService as TutorialService;
    goToStep(service, 1);
    await service.executeCommand('git clone /remote-repo', { skipValidation: true });
    goToStep(service, 2);
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    await service.editFile('greeting.txt', 'Hello, Git Quest!');
    goToStep(service, 41);
    await useAppStore.getState().refreshGitState();
    useAppStore.setState({ terminalOutput: [] });
    const store = useAppStore.getState();

    // Commit is clicked while staging is still running. It must run after
    // staging has completed step 41, not be refused at step 41.
    await Promise.all([store.stageFile('greeting.txt'), store.commit('Add greeting with GUI')]);

    const output = useAppStore.getState().terminalOutput;
    expect(output).not.toContain('Error: このステップでは「コミット」はできません。');
    expect(output.indexOf('[GUI] git add greeting.txt')).toBeLessThan(
      output.indexOf('[GUI] git commit -m "Add greeting with GUI"')
    );
    expect(output).toContain(`✓ ${findStep(41).successMessage}`);
    expect(output).toContain(`✓ ${findStep(51).successMessage}`);
    expect(useAppStore.getState().currentStep?.id).toBe(61);
  });

  it('drops a check requested for a step that an earlier operation already completed', async () => {
    const service = useAppStore.getState().tutorialService as TutorialService;
    goToStep(service, 1);
    await service.executeCommand('git clone /remote-repo', { skipValidation: true });
    goToStep(service, 2);
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    goToStep(service, 31);
    await useAppStore.getState().refreshGitState();
    useAppStore.setState({ terminalOutput: [] });
    const store = useAppStore.getState();

    // The edit check for step 31 is pressed twice. The first check completes
    // step 31; the second must not check step 32. Step 32 has no rules, so
    // that check would pass and print its success message before the learner
    // has looked at the change. (It does not advance on its own, so the step
    // number alone cannot catch this.)
    await store.editFile('greeting.txt', 'Hello, Git Quest!');
    await Promise.all([store.validateCurrentStep(), store.validateCurrentStep()]);

    const output = useAppStore.getState().terminalOutput;
    expect(output.filter((line) => line === `✓ ${findStep(31).successMessage}`)).toHaveLength(1);
    expect(output).not.toContain(`✓ ${findStep(32).successMessage}`);
    expect(useAppStore.getState().currentStep?.id).toBe(32);
  });

  it('drops operations queued before a reset instead of running them in the new tutorial', async () => {
    const store = useAppStore.getState();
    await store.nextStep();
    await store.executeCommand('git clone /remote-repo');
    expect(useAppStore.getState().currentStep?.id).toBe(2);

    // Hold `git status` while it runs, so the clone requested next waits in
    // the queue across the reset.
    const oldService = useAppStore.getState().tutorialService as TutorialService;
    const executeCommand = oldService.executeCommand.bind(oldService);
    let releaseStatus!: () => void;
    const statusGate = new Promise<void>((resolve) => {
      releaseStatus = resolve;
    });
    oldService.executeCommand = async (...args) => {
      await statusGate;
      return executeCommand(...args);
    };

    const status = store.executeCommand('git status');
    const queuedClone = store.executeCommand('git clone /remote-repo');

    await useAppStore.getState().reset();
    await useAppStore.getState().nextStep();
    const newService = useAppStore.getState().tutorialService as TutorialService;
    expect(newService).not.toBe(oldService);

    releaseStatus();
    await Promise.all([status, queuedClone]);

    // The new tutorial is still waiting for its own clone at step 1.
    expect(newService.getCurrentStep().id).toBe(1);
    expect(await newService.getFileList()).toEqual([]);
    expect(useAppStore.getState().terminalOutput).not.toContain('$ git clone /remote-repo');
  });
});
