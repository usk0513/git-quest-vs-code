import git from 'isomorphic-git';
import { FileSystemService } from '../filesystem/FileSystemService';
import { GitState, GitFile, GitCommit } from '@/types';

type DiffLine = {
  type: 'context' | 'add' | 'remove';
  content: string;
};

export class GitService {
  private fs: FileSystemService;

  constructor(fileSystem: FileSystemService) {
    this.fs = fileSystem;
  }

  async init(dir: string): Promise<void> {
    await git.init({
      fs: this.fs.getFS(),
      dir,
      defaultBranch: 'main',
    });
  }

  async add(dir: string, filepath: string): Promise<void> {
    await git.add({
      fs: this.fs.getFS(),
      dir,
      filepath,
    });
  }

  async commit(dir: string, message: string): Promise<string> {
    const sha = await git.commit({
      fs: this.fs.getFS(),
      dir,
      message,
      author: {
        name: 'Git Quest User',
        email: 'user@gitquest.com',
      },
    });
    return sha;
  }

  async branch(dir: string, branchName: string, checkout: boolean = false): Promise<void> {
    await git.branch({
      fs: this.fs.getFS(),
      dir,
      ref: branchName,
      checkout,
    });
  }

  async resetFile(dir: string, filepath: string): Promise<void> {
    await git.resetIndex({
      fs: this.fs.getFS(),
      dir,
      filepath,
    });
  }

  async checkout(dir: string, ref: string): Promise<void> {
    await git.checkout({
      fs: this.fs.getFS(),
      dir,
      ref,
    });
  }

  async currentBranch(dir: string): Promise<string> {
    const branch = await git.currentBranch({
      fs: this.fs.getFS(),
      dir,
      fullname: false,
    });
    return branch || 'main';
  }

  async listBranches(dir: string): Promise<string[]> {
    const branches = await git.listBranches({
      fs: this.fs.getFS(),
      dir,
    });
    return branches;
  }

  async status(dir: string, filepath: string): Promise<string> {
    const status = await git.status({
      fs: this.fs.getFS(),
      dir,
      filepath,
    });
    return status;
  }

  async statusMatrix(dir: string): Promise<[string, number, number, number][]> {
    const matrix = await git.statusMatrix({
      fs: this.fs.getFS(),
      dir,
    });
    return matrix;
  }

  async log(dir: string, depth: number = 10): Promise<GitCommit[]> {
    const commits = await git.log({
      fs: this.fs.getFS(),
      dir,
      depth,
    });

    return commits.map((commit) => ({
      oid: commit.oid,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        timestamp: commit.commit.author.timestamp,
      },
    }));
  }

  async getGitState(dir: string): Promise<GitState> {
    try {
      const isRepo = await this.fs.exists(`${dir}/.git`);
      if (!isRepo) {
        return {
          isRepository: false,
          currentBranch: '',
          branches: [],
          remoteBranches: [],
          stagedFiles: [],
          unstagedFiles: [],
          commits: [],
          hasRemote: false,
          aheadCount: 0,
          behindCount: 0,
        };
      }

      const currentBranch = await this.currentBranch(dir);
      const branches = await this.listBranches(dir);
      const matrix = await this.statusMatrix(dir);
      const commits = await this.log(dir);

      const stagedFiles: GitFile[] = [];
      const unstagedFiles: GitFile[] = [];

      for (const [filepath, headStatus, workdirStatus, stageStatus] of matrix) {
        // Skip .git directory
        if (filepath.startsWith('.git')) continue;

        // Determine file status
        if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
          // New file, staged
          stagedFiles.push({ path: filepath, status: 'added' });
        } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
          // New file, not staged
          unstagedFiles.push({ path: filepath, status: 'untracked' });
        } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
          // Modified file, staged
          stagedFiles.push({ path: filepath, status: 'modified' });
        } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
          // Modified file, not staged
          unstagedFiles.push({ path: filepath, status: 'modified' });
        } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 0) {
          // Deleted file, staged
          stagedFiles.push({ path: filepath, status: 'deleted' });
        } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 1) {
          // Deleted file, not staged
          unstagedFiles.push({ path: filepath, status: 'deleted' });
        }
      }

      return {
        isRepository: true,
        currentBranch,
        branches,
        remoteBranches: [],
        stagedFiles,
        unstagedFiles,
        commits,
        hasRemote: false, // We'll implement remote simulation separately
        aheadCount: 0,
        behindCount: 0,
      };
    } catch (error) {
      console.error('Error getting git state:', error);
      return {
        isRepository: false,
        currentBranch: '',
        branches: [],
        remoteBranches: [],
        stagedFiles: [],
        unstagedFiles: [],
        commits: [],
        hasRemote: false,
        aheadCount: 0,
        behindCount: 0,
      };
    }
  }

  async diff(dir: string, filepath?: string): Promise<string> {
    const statusMatrix = await git.statusMatrix({ fs: this.fs.getFS(), dir });
    const targets = statusMatrix.filter(([path, head, workdir, stage]) => {
      if (filepath && filepath !== path) {
        return false;
      }
      return head !== workdir || workdir !== stage;
    });

    if (targets.length === 0) {
      return 'No differences';
    }

    const results: string[] = [];

    for (const [path, headStatus, workdirStatus] of targets) {
      const oldContent = await this.getHeadFileContent(dir, path, headStatus !== 0);
      const newContent = await this.getWorkingTreeContent(dir, path, workdirStatus !== 0);
      const diffLines = this.createUnifiedDiff(path, oldContent, newContent);
      results.push(diffLines.join('\n'));
    }

    return results.join('\n\n');
  }

  private async getHeadFileContent(dir: string, filepath: string, existsInHead: boolean): Promise<string> {
    if (!existsInHead) {
      return '';
    }

    try {
      const oid = await git.resolveRef({ fs: this.fs.getFS(), dir, ref: 'HEAD' });
      const { blob } = await git.readBlob({ fs: this.fs.getFS(), dir, oid, filepath });
      return new TextDecoder('utf-8').decode(blob);
    } catch {
      return '';
    }
  }

  private async getWorkingTreeContent(dir: string, filepath: string, existsInWorkdir: boolean): Promise<string> {
    if (!existsInWorkdir) {
      return '';
    }

    try {
      return await this.fs.readFile(`${dir}/${filepath}`);
    } catch {
      return '';
    }
  }

  private createUnifiedDiff(filepath: string, oldContent: string, newContent: string): string[] {
    const oldLines = oldContent.split(/\r?\n/);
    const newLines = newContent.split(/\r?\n/);
    const diffs = this.computeDiffLines(oldLines, newLines);

    const header = [
      `diff --git a/${filepath} b/${filepath}`,
      `--- a/${filepath}`,
      `+++ b/${filepath}`,
    ];

    if (diffs.length === 0) {
      return [...header, 'No changes'];
    }

    return [...header, '@@', ...diffs.map((line) => {
      switch (line.type) {
        case 'add':
          return `+${line.content}`;
        case 'remove':
          return `-${line.content}`;
        default:
          return ` ${line.content}`;
      }
    })];
  }

  private computeDiffLines(oldLines: string[], newLines: string[]): DiffLine[] {
    const m = oldLines.length;
    const n = newLines.length;
    const lcs: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (oldLines[i] === newLines[j]) {
          lcs[i][j] = lcs[i + 1][j + 1] + 1;
        } else {
          lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
      }
    }

    const result: DiffLine[] = [];
    let i = 0;
    let j = 0;

    while (i < m && j < n) {
      if (oldLines[i] === newLines[j]) {
        result.push({ type: 'context', content: oldLines[i] });
        i++;
        j++;
      } else if (lcs[i][j + 1] >= lcs[i + 1][j]) {
        result.push({ type: 'add', content: newLines[j] });
        j++;
      } else {
        result.push({ type: 'remove', content: oldLines[i] });
        i++;
      }
    }

    while (i < m) {
      result.push({ type: 'remove', content: oldLines[i++] });
    }

    while (j < n) {
      result.push({ type: 'add', content: newLines[j++] });
    }

    return result;
  }
}
