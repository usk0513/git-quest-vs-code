import type React from 'react';

// Renders the small Markdown subset used by the step instructions
// (detailedInstructions): "## " headings, numbered lists, fenced code
// blocks, `inline code`, and paragraphs whose line breaks are kept. The text
// comes from the tutorial definitions, and it is turned into React elements,
// never into HTML strings.

type Block =
  | { kind: 'heading'; id: number; text: string }
  | { kind: 'paragraph'; id: number; lines: string[] }
  | { kind: 'list'; id: number; items: { id: number; text: string }[] }
  | { kind: 'code'; id: number; lines: string[] };

const LIST_ITEM = /^\d+\.\s+(.*)$/;

const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  const lines = text.split('\n');
  let nextId = 0;
  let paragraph: string[] = [];
  let list: { id: number; text: string }[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', id: nextId++, lines: paragraph });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ kind: 'list', id: nextId++, items: list });
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) {
        code.push(lines[i]);
      }
      blocks.push({ kind: 'code', id: nextId++, lines: code });
      continue;
    }

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', id: nextId++, text: line.slice(3) });
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (item) {
      flushParagraph();
      list.push({ id: nextId++, text: item[1] });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
};

// Splits `inline code` out of a line. Keys are offsets into the line.
const renderInline = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let offset = 0;
  for (const segment of text.split(/(`[^`]+`)/)) {
    if (segment.length > 2 && segment.startsWith('`') && segment.endsWith('`')) {
      parts.push(
        <code
          key={offset}
          className="px-1 rounded-sm bg-vscode-hover font-mono text-xs text-vscode-text"
        >
          {segment.slice(1, -1)}
        </code>
      );
    } else if (segment) {
      parts.push(segment);
    }
    offset += segment.length;
  }
  return parts;
};

// Lines of a paragraph, separated by <br>. Keys are line numbers.
const renderLines = (lines: string[]): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lineNumber = 0;
  for (const line of lines) {
    if (lineNumber > 0) {
      parts.push(<br key={`br-${lineNumber}`} />);
    }
    parts.push(<span key={`line-${lineNumber}`}>{renderInline(line)}</span>);
    lineNumber++;
  }
  return parts;
};

// One line of text with `inline code`, for short texts such as hints.
export const InlineText: React.FC<{ text: string }> = ({ text }) => <>{renderInline(text)}</>;

export const InstructionText: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-sm text-vscode-text space-y-2">
    {parseBlocks(text).map((block) => {
      switch (block.kind) {
        case 'heading':
          return (
            <h4 key={block.id} className="font-semibold">
              {renderInline(block.text)}
            </h4>
          );
        case 'list':
          return (
            <ol key={block.id} className="list-decimal pl-5 space-y-1">
              {block.items.map((item) => (
                <li key={item.id}>{renderInline(item.text)}</li>
              ))}
            </ol>
          );
        case 'code':
          return (
            <pre
              key={block.id}
              className="p-2 rounded-sm border border-vscode-border bg-vscode-bg font-mono text-xs whitespace-pre-wrap"
            >
              <code>{block.lines.join('\n')}</code>
            </pre>
          );
        default:
          return <p key={block.id}>{renderLines(block.lines)}</p>;
      }
    })}
  </div>
);
