import type React from 'react';
import type { StepConfig } from '@/types';
import { Button } from '../Common/Button';

interface InstructionPaneProps {
  step: StepConfig;
  onNext?: () => void;
  onValidate?: () => void;
}

export const InstructionPane: React.FC<InstructionPaneProps> = ({ step, onNext, onValidate }) => {
  const showValidate = step.requiresValidationButton && onValidate;
  const showNext =
    onNext &&
    step.autoAdvance === false &&
    !step.requiresValidationButton &&
    (step.showNextButton ?? true);

  return (
    <div className="h-full bg-vscode-bg border-l border-vscode-border flex flex-col">
      {/*
        Keyed by step: each step gets a new scroll area that starts at the
        top, so its title is not hidden by the previous step's scroll
        position.
      */}
      <div key={step.id} className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-vscode-text mb-2">
              {step.title}
            </h2>
            <p className="text-sm text-vscode-text-secondary">{step.description}</p>
          </div>

          {step.illustration && (
            <div className="mb-6">
              <img
                src={step.illustration.src}
                alt={step.illustration.alt}
                className="w-full rounded-sm border border-vscode-border"
              />
            </div>
          )}

          <div className="mb-6 p-4 bg-vscode-sidebar rounded-sm border border-vscode-border">
            <h3 className="text-sm font-medium text-vscode-text mb-2">📘 説明</h3>
            <div className="text-sm text-vscode-text whitespace-pre-wrap">
              {step.detailedInstructions}
            </div>
          </div>

          {step.hints.length > 0 && (
            <div className="mb-6 p-4 bg-vscode-hint-bg rounded-sm border border-vscode-warning">
              <h3 className="text-sm font-medium text-vscode-text mb-2">💡 ヒント</h3>
              <ul className="text-sm text-vscode-text space-y-1">
                {step.hints.map((hint, index) => (
                  // Hints are static display text for the current step.
                  // biome-ignore lint/suspicious/noArrayIndexKey: static display-only list, see above
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}

          {step.stage === 'terminal' && (
            <div className="p-4 bg-vscode-sidebar rounded-sm border border-vscode-border">
              <h3 className="text-sm font-medium text-vscode-text mb-2">
                ✅ 成功条件
              </h3>
              <div className="text-sm text-vscode-text-secondary">
                {step.successMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The action buttons stay below the scroll area, always in view. */}
      {(showValidate || showNext) && (
        <div className="p-4 border-t border-vscode-border">
          {showValidate && (
            <Button onClick={onValidate} className="w-full">
              {step.validationButtonLabel ?? '結果をチェック'}
            </Button>
          )}
          {showNext && (
            <Button onClick={onNext} className="w-full">
              次へ →
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
