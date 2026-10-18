import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { resetFileSystem } from '@/services/filesystem/FileSystemService';
import { TutorialService } from '@/services/tutorial/TutorialService';
import { TUTORIAL_STEPS, GUI_TUTORIAL_STEPS } from '@/constants/tutorialSteps';
import { StepConfig } from '@/types';

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

describe('useAppStore GUI actions', () => {
  let service: TutorialService;

  // Puts the store at GUI step 41 on feature/gui-test with greeting.txt edited.
  beforeEach(async () => {
    resetFileSystem();
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

  it('refuses a push before staging and stays on the staging step', async () => {
    await useAppStore.getState().push();

    const output = useAppStore.getState().terminalOutput;
    expect(output).toContain('Error: このステップでは「プッシュ」はできません。');
    expect(useAppStore.getState().currentStep?.id).toBe(41);
    expect(useAppStore.getState().gitState.remoteBranches).not.toContain('origin/feature/gui-test');
  });
});
