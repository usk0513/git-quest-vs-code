import type React from 'react';
import { useState, useRef, useEffect } from 'react';

interface TerminalProps {
  output: string[];
  onCommand: (command: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ output, onCommand }) => {
  const [input, setInput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever the output changes. The body does not read
  // `output`, but the dependency is what triggers the scroll: appended lines,
  // a reset that replaces the array, or new content of the same length.
  // biome-ignore lint/correctness/useExhaustiveDependencies: output is the scroll trigger, see above
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="h-full bg-vscode-bg border-t border-vscode-border flex flex-col">
      <div className="px-2 py-1 text-xs font-medium text-vscode-text border-b border-vscode-border">
        ターミナル
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-sm text-vscode-text"
      >
        {output.map((line, index) => (
          // Each line is stateless display text. Lines repeat (blank lines,
          // the same message twice), so the text itself cannot be the key.
          // biome-ignore lint/suspicious/noArrayIndexKey: stateless display lines, see above
          <div key={index} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-2 py-1 border-t border-vscode-border">
        <span className="font-mono text-sm text-vscode-accent">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-vscode-text"
          placeholder="Type a git command..."
          // biome-ignore lint/a11y/noAutofocus: the terminal prompt is the main input of the tutorial; focusing it on load lets learners type commands right away
          autoFocus
        />
      </div>
    </div>
  );
};
