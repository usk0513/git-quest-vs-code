export interface GitFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

export interface GitCommit {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
}

export interface GitState {
  isRepository: boolean;
  currentBranch: string;
  branches: string[];
  remoteBranches: string[];
  stagedFiles: GitFile[];
  unstagedFiles: GitFile[];
  commits: GitCommit[];
  hasRemote: boolean;
  aheadCount: number;
  behindCount: number;
}

export type GitCommand =
  | 'clone'
  | 'init'
  | 'add'
  | 'commit'
  | 'push'
  | 'pull'
  | 'branch'
  | 'checkout'
  | 'status'
  | 'log'
  | 'diff';

export interface ParsedGitCommand {
  command: GitCommand;
  args: string[];
  flags: string[];
  message?: string;
  branchName?: string;
}
