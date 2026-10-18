import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { resetTestFileSystem } from '../../setup/testFileSystem';
import type { TutorialService } from '@/services/tutorial/TutorialService';
import type { GitService } from '@/services/git/GitService';
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

const countLines = (lines: string[], text: string) => lines.filter((line) => line === text).length;

// Walks the tutorial to GUI step 31 (edit file) using only the public store
// API, then edits greeting.txt so the step's check can pass.
const walkToGuiEditStepWithEdit = async () => {
  resetTestFileSystem();
  await useAppStore.getState().initialize();
  const store = useAppStore.getState();

  await store.nextStep();
  await store.executeCommand('git clone /remote-repo');
  await store.nextStep();
  await store.executeCommand('git checkout -b feature/add-greeting');
  await store.nextStep();
  await store.editFile('greeting.txt', 'Hello, Git!');
  await store.validateCurrentStep();
  await store.nextStep();
  await store.executeCommand('git add greeting.txt');
  await store.nextStep();
  await store.executeCommand('git commit -m "Add greeting message"');
  await store.nextStep();
  await store.executeCommand('git push origin feature/add-greeting');
  await store.nextStep();
  await store.switchBranch('main');
  await store.nextStep();
  await store.createBranch('feature/gui-test');
  await store.nextStep();
  expect(useAppStore.getState().currentStep?.id).toBe(31);

  await store.editFile('greeting.txt', 'Hello, Git Quest!');
  useAppStore.setState({ terminalOutput: [] });
};

describe('useAppStore GUI actions', () => {
  let service: TutorialService;

  // Puts the store at GUI step 41 on feature/gui-test with greeting.txt edited.
  beforeEach(async () => {
    resetTestFileSystem();
    await useAppStore.getState().initialize();
    service = useAppStore.getState().tutorialService as TutorialService;

    goToStep(service, 1);
    await service.executeCommand('git clone /remote-repo', { skipValidation: true });
    goToStep(service, 2);
    await service.executeCommand('git checkout -b feature/gui-test', { skipValidation: true });
    await service.editFile('greeting.txt', 'Hello, Git Quest!');
    goToStep(service, 41);

    await useAppStore.getState().refreshGitState();
    useAppStore.setState({ terminalOutput: [] });
  });

  it('prints each completed step message once, without the next step failure', async () => {
    const store = useAppStore.getState();

    await store.stageFile('greeting.txt');
    let output = useAppStore.getState().terminalOutput;
    expect(output).toContain('[GUI] git add greeting.txt');
    expect(countLines(output, `✓ ${findStep(41).successMessage}`)).toBe(1);
    expect(output).not.toContain('No new commits detected');
    expect(useAppStore.getState().currentStep?.id).toBe(51);

    await store.commit('Add greeting with GUI');
    output = useAppStore.getState().terminalOutput;
    expect(countLines(output, `✓ ${findStep(51).successMessage}`)).toBe(1);
    expect(output).not.toContain('Push not detected yet');
    expect(useAppStore.getState().currentStep?.id).toBe(61);

    await store.push();
    output = useAppStore.getState().terminalOutput;
    expect(output.some((line) => line.includes('[new branch]'))).toBe(true);
    expect(countLines(output, `✓ ${findStep(61).successMessage}`)).toBe(1);
    // The final confirmation step must not report success on its own.
    expect(output).not.toContain(`✓ ${findStep(62).successMessage}`);
    expect(useAppStore.getState().currentStep?.id).toBe(62);
  });

  it('stops at the confirmation step when two edit checks run at the same time', async () => {
    await walkToGuiEditStepWithEdit();
    const store = useAppStore.getState();

    await Promise.all([store.validateCurrentStep(), store.validateCurrentStep()]);

    expect(useAppStore.getState().currentStep?.id).toBe(32);
    const output = useAppStore.getState().terminalOutput;
    expect(countLines(output, `✓ ${findStep(31).successMessage}`)).toBe(1);
  });

  it('prints the edit success once when a second check is requested while the first is still running', async () => {
    await walkToGuiEditStepWithEdit();
    const store = useAppStore.getState();
    const tutorialService = store.tutorialService as TutorialService;

    // Hold back the first check's git state read, and request the second
    // check while it is held. Checks run one at a time, so the second one
    // waits and must then be dropped because step 31 is already complete.
    // (TutorialServiceGuiActions.test.ts covers checks that overlap inside
    // the service itself.)
    const git = (tutorialService as unknown as { git: GitService }).git;
    const readGitState = git.getGitState.bind(git);
    let releaseFirstRead!: () => void;
    const firstReadGate = new Promise<void>((resolve) => {
      releaseFirstRead = resolve;
    });
    let reads = 0;
    git.getGitState = async (dir: string) => {
      const readNumber = ++reads;
      const state = await readGitState(dir);
      if (readNumber === 1) {
        await firstReadGate;
      }
      return state;
    };

    const firstCheck = store.validateCurrentStep();
    const secondCheck = store.validateCurrentStep();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useAppStore.getState().currentStep?.id).toBe(31);
    releaseFirstRead();
    await Promise.all([firstCheck, secondCheck]);

    expect(useAppStore.getState().currentStep?.id).toBe(32);
    const output = useAppStore.getState().terminalOutput;
    expect(countLines(output, `✓ ${findStep(31).successMessage}`)).toBe(1);
  });

  it('refuses a push before staging and stays on the staging step', async () => {
    await useAppStore.getState().push();

    const output = useAppStore.getState().terminalOutput;
    expect(output).toContain('Error: このステップでは「プッシュ」はできません。');
    expect(useAppStore.getState().currentStep?.id).toBe(41);
    expect(useAppStore.getState().gitState.remoteBranches).not.toContain('origin/feature/gui-test');
  });
});
