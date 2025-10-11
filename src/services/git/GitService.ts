import git from 'isomorphic-git';
import { FileSystemService } from '../filesystem/FileSystemService';
import { GitState, GitFile, GitCommit } from '@/types';

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
          stagedFiles: [],
          unstagedFiles: [],
          commits: [],
          hasRemote: false,
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
        stagedFiles,
        unstagedFiles,
        commits,
        hasRemote: false, // We'll implement remote simulation separately
      };
    } catch (error) {
      console.error('Error getting git state:', error);
      return {
        isRepository: false,
        currentBranch: '',
        branches: [],
        stagedFiles: [],
        unstagedFiles: [],
        commits: [],
        hasRemote: false,
      };
    }
  }
}
