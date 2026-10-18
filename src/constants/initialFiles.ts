export const INITIAL_FILES = {
  'README.md': `# Sample Project

This is a sample project for learning Git.

## Getting Started

Edit the files and commit your changes!
`,
  'greeting.txt': '',
  'src/main.js': `console.log('Hello, World!');
`,
};

export const REMOTE_REPO_NAME = 'sample-repo';
export const WORKSPACE_DIR = '/workspace';
export const REMOTE_DIR = '/remote-repo';

// The GUI stage creates its branch from this one: the branch menu offers
// "+ 新しいブランチの作成..." only while it is checked out.
export const GUI_BRANCH_BASE = 'main';
