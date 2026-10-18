import git from 'isomorphic-git';
import type { FileSystemService } from '../filesystem/FileSystemService';
import type { GitState, GitFile, GitCommit } from '@/types';

// A line of a file, including its trailing '\n'. Only the last line of a
// file can lack it, so "a" and "a\n" differ, as they do in Git.
type DiffLine = {
  type: 'context' | 'add' | 'remove';
  text: string;
  // Lines of the old and new file before this one.
  oldBefore: number;
  newBefore: number;
};

type DiffSide = { content: string; oid: string } | null;

// Output format of `git diff`: three lines of context around each change,
// and hunks whose context would touch are merged.
const CONTEXT_LINES = 3;
const NO_NEWLINE_MARKER = '\\ No newline at end of file';
const FILE_MODE = '100644';
const NULL_OID = '0000000';

const shortOid = (oid: string) => oid.slice(0, 7);

const splitLines = (content: string): string[] => {
  if (content === '') {
    return [];
  }
  const parts = content.split('\n');
  const lines = parts.map((part, index) => (index < parts.length - 1 ? `${part}\n` : part));
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
};

// "start,count" of a hunk header. Git prints only the start when the count
// is 1, and the line before the hunk when it is 0 (for example "-0,0").
const hunkRange = (start: number, count: number) => {
  if (count === 1) {
    return `${start}`;
  }
  return `${count === 0 ? start - 1 : start},${count}`;
};

const formatLine = (prefix: string, text: string): string[] =>
  text.endsWith('\n') ? [prefix + text.slice(0, -1)] : [prefix + text, NO_NEWLINE_MARKER];

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

  async resolveRef(dir: string, ref: string): Promise<string> {
    return await git.resolveRef({
      fs: this.fs.getFS(),
      dir,
      ref,
    });
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

  // Compares HEAD with the working tree, like `git diff HEAD`. In the
  // tutorial `git diff` is only allowed before anything is staged, where this
  // is also what `git diff` shows.
  async diff(dir: string, filepath?: string): Promise<string> {
    const statusMatrix = await git.statusMatrix({ fs: this.fs.getFS(), dir });
    const targets = statusMatrix.filter(([path, head, workdir, stage]) => {
      if (filepath && filepath !== path) {
        return false;
      }
      return head !== workdir || workdir !== stage;
    });

    const results: string[] = [];

    for (const [path, headStatus, workdirStatus] of targets) {
      const oldSide = await this.getHeadBlob(dir, path, headStatus !== 0);
      const newSide = await this.getWorkingTreeBlob(dir, path, workdirStatus !== 0);
      // A loop, not push(...lines): a large file has more lines than a
      // function call accepts as arguments.
      for (const line of this.createUnifiedDiff(path, oldSide, newSide)) {
        results.push(line);
      }
    }

    return results.length > 0 ? results.join('\n') : 'No differences';
  }

  private async getHeadBlob(dir: string, filepath: string, existsInHead: boolean): Promise<DiffSide> {
    if (!existsInHead) {
      return null;
    }

    try {
      const commitOid = await git.resolveRef({ fs: this.fs.getFS(), dir, ref: 'HEAD' });
      const { oid, blob } = await git.readBlob({
        fs: this.fs.getFS(),
        dir,
        oid: commitOid,
        filepath,
      });
      return { content: new TextDecoder('utf-8').decode(blob), oid };
    } catch {
      return null;
    }
  }

  private async getWorkingTreeBlob(
    dir: string,
    filepath: string,
    existsInWorkdir: boolean
  ): Promise<DiffSide> {
    if (!existsInWorkdir) {
      return null;
    }

    try {
      const content = await this.fs.readFile(`${dir}/${filepath}`);
      const { oid } = await git.hashBlob({ object: content });
      return { content, oid };
    } catch {
      return null;
    }
  }

  // Lines of `git diff` output for one file, or none if the contents match.
  private createUnifiedDiff(filepath: string, oldSide: DiffSide, newSide: DiffSide): string[] {
    const diffLines = this.computeDiffLines(
      splitLines(oldSide?.content ?? ''),
      splitLines(newSide?.content ?? '')
    );
    const hunks = this.groupIntoHunks(diffLines);

    if (hunks.length === 0) {
      return [];
    }

    const header = [`diff --git a/${filepath} b/${filepath}`];
    if (!oldSide && newSide) {
      header.push(
        `new file mode ${FILE_MODE}`,
        `index ${NULL_OID}..${shortOid(newSide.oid)}`,
        '--- /dev/null',
        `+++ b/${filepath}`
      );
    } else if (oldSide && !newSide) {
      header.push(
        `deleted file mode ${FILE_MODE}`,
        `index ${shortOid(oldSide.oid)}..${NULL_OID}`,
        `--- a/${filepath}`,
        '+++ /dev/null'
      );
    } else {
      header.push(
        `index ${shortOid(oldSide?.oid ?? NULL_OID)}..${shortOid(newSide?.oid ?? NULL_OID)} ${FILE_MODE}`,
        `--- a/${filepath}`,
        `+++ b/${filepath}`
      );
    }

    return [...header, ...hunks.flatMap((hunk) => this.formatHunk(hunk))];
  }

  private formatHunk(hunk: DiffLine[]): string[] {
    const oldCount = hunk.filter((line) => line.type !== 'add').length;
    const newCount = hunk.filter((line) => line.type !== 'remove').length;
    const header = `@@ -${hunkRange(hunk[0].oldBefore + 1, oldCount)} +${hunkRange(
      hunk[0].newBefore + 1,
      newCount
    )} @@`;

    return [
      header,
      ...hunk.flatMap((line) => {
        switch (line.type) {
          case 'add':
            return formatLine('+', line.text);
          case 'remove':
            return formatLine('-', line.text);
          default:
            return formatLine(' ', line.text);
        }
      }),
    ];
  }

  // Splits the diff into hunks: each change with up to CONTEXT_LINES lines
  // of context on both sides, merging changes whose context would touch.
  private groupIntoHunks(lines: DiffLine[]): DiffLine[][] {
    const changes = lines.flatMap((line, index) => (line.type === 'context' ? [] : [index]));
    const hunks: DiffLine[][] = [];

    let first = 0;
    while (first < changes.length) {
      let last = first;
      while (
        last + 1 < changes.length &&
        changes[last + 1] - changes[last] - 1 <= 2 * CONTEXT_LINES
      ) {
        last++;
      }
      const start = Math.max(0, changes[first] - CONTEXT_LINES);
      const end = Math.min(lines.length - 1, changes[last] + CONTEXT_LINES);
      hunks.push(lines.slice(start, end + 1));
      first = last + 1;
    }

    return hunks;
  }

  // Line-based diff from the longest common subsequence. Within each run of
  // changes, removed lines come before added lines, as in Git's output.
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
    let removed: string[] = [];
    let added: string[] = [];
    let i = 0;
    let j = 0;

    const flushChanges = () => {
      for (const text of removed) {
        result.push({ type: 'remove', text, oldBefore: 0, newBefore: 0 });
      }
      for (const text of added) {
        result.push({ type: 'add', text, oldBefore: 0, newBefore: 0 });
      }
      removed = [];
      added = [];
    };

    while (i < m && j < n) {
      if (oldLines[i] === newLines[j]) {
        flushChanges();
        result.push({ type: 'context', text: oldLines[i], oldBefore: 0, newBefore: 0 });
        i++;
        j++;
      } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
        removed.push(oldLines[i++]);
      } else {
        added.push(newLines[j++]);
      }
    }
    // Loops, not push(...rest): the rest can be more lines than a function
    // call accepts as arguments.
    for (; i < m; i++) {
      removed.push(oldLines[i]);
    }
    for (; j < n; j++) {
      added.push(newLines[j]);
    }
    flushChanges();

    // Number the lines once their final order is known.
    let oldBefore = 0;
    let newBefore = 0;
    for (const line of result) {
      line.oldBefore = oldBefore;
      line.newBefore = newBefore;
      if (line.type !== 'add') {
        oldBefore++;
      }
      if (line.type !== 'remove') {
        newBefore++;
      }
    }

    return result;
  }
}
