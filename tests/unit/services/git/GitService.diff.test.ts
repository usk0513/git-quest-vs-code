import { describe, it, expect } from 'vitest';
import { GitService } from '@/services/git/GitService';
import { resetTestFileSystem } from '../../../setup/testFileSystem';

// Expected outputs are copied from real Git (2.50.1, `git diff --no-color`
// with the same file contents). The app compares HEAD with the working tree,
// which is what `git diff` shows before anything is staged; for an added or
// deleted file the expected output comes from `git diff HEAD`.
const DIR = '/repo';

const setUpRepo = async (files: Record<string, string>) => {
  const fs = resetTestFileSystem();
  const git = new GitService(fs);
  await fs.mkdir(DIR);
  await git.init(DIR);
  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(`${DIR}/${name}`, content);
    await git.add(DIR, name);
  }
  await git.commit(DIR, 'init');
  return { fs, git };
};

const diffAfterEdit = async (before: string, after: string) => {
  const { fs, git } = await setUpRepo({ 'f.txt': before });
  await fs.writeFile(`${DIR}/f.txt`, after);
  return git.diff(DIR);
};

const lines = (...output: string[]) => output.join('\n');

describe('GitService.diff', () => {
  it('adds a line to an empty file without a phantom removed line', async () => {
    expect(await diffAfterEdit('', 'Hello, Git!')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index e69de29..7f118ff 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -0,0 +1 @@',
        '+Hello, Git!',
        '\\ No newline at end of file'
      )
    );
  });

  it('omits the no-newline marker when the new line ends with a newline', async () => {
    expect(await diffAfterEdit('', 'Hello, Git!\n')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index e69de29..670a245 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -0,0 +1 @@',
        '+Hello, Git!'
      )
    );
  });

  it('prints the removed line before the added line when a line changes', async () => {
    expect(await diffAfterEdit('Hello, Git!', 'Hello, Git Quest!')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 7f118ff..fa2c449 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1 +1 @@',
        '-Hello, Git!',
        '\\ No newline at end of file',
        '+Hello, Git Quest!',
        '\\ No newline at end of file'
      )
    );
  });

  it('treats a removed final newline as a changed line', async () => {
    expect(await diffAfterEdit('a\n', 'a')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 7898192..2e65efe 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1 +1 @@',
        '-a',
        '+a',
        '\\ No newline at end of file'
      )
    );
  });

  it('treats an added final newline as a changed line', async () => {
    expect(await diffAfterEdit('a', 'a\n')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 2e65efe..7898192 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1 +1 @@',
        '-a',
        '\\ No newline at end of file',
        '+a'
      )
    );
  });

  it('removes every line when the file is emptied', async () => {
    expect(await diffAfterEdit('a\nb\n', '')).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 422c2b7..e69de29 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1,2 +0,0 @@',
        '-a',
        '-b'
      )
    );
  });

  it('splits changes more than six lines apart into separate hunks with three lines of context', async () => {
    const before = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n';
    const after = '1\nTWO\n3\n4\n5\n6\n7\n8\n9\n10\nELEVEN\n12\n';
    expect(await diffAfterEdit(before, after)).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 08fe19c..94e6d90 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1,5 +1,5 @@',
        ' 1',
        '-2',
        '+TWO',
        ' 3',
        ' 4',
        ' 5',
        '@@ -8,5 +8,5 @@',
        ' 8',
        ' 9',
        ' 10',
        '-11',
        '+ELEVEN',
        ' 12'
      )
    );
  });

  it('merges changes whose context overlaps into one hunk', async () => {
    const before = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n';
    const after = '1\n2\nTHREE\n4\n5\n6\n7\nEIGHT\n9\n10\n';
    expect(await diffAfterEdit(before, after)).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index f00c965..693c319 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1,10 +1,10 @@',
        ' 1',
        ' 2',
        '-3',
        '+THREE',
        ' 4',
        ' 5',
        ' 6',
        ' 7',
        '-8',
        '+EIGHT',
        ' 9',
        ' 10'
      )
    );
  });

  it('starts the hunk three lines before an inserted line', async () => {
    const before = '1\n2\n3\n4\n5\n6\n7\n8\n';
    const after = '1\n2\n3\n4\nNEW\n5\n6\n7\n8\n';
    expect(await diffAfterEdit(before, after)).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 535d2b0..72385ce 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -2,6 +2,7 @@',
        ' 2',
        ' 3',
        ' 4',
        '+NEW',
        ' 5',
        ' 6',
        ' 7'
      )
    );
  });

  it('counts the lines of a hunk around a deleted line', async () => {
    const before = '1\n2\n3\n4\n5\n6\n7\n8\n';
    const after = '1\n2\n3\n5\n6\n7\n8\n';
    expect(await diffAfterEdit(before, after)).toBe(
      lines(
        'diff --git a/f.txt b/f.txt',
        'index 535d2b0..5692262 100644',
        '--- a/f.txt',
        '+++ b/f.txt',
        '@@ -1,7 +1,6 @@',
        ' 1',
        ' 2',
        ' 3',
        '-4',
        ' 5',
        ' 6',
        ' 7'
      )
    );
  });

  it('prints the diffs of several files one after another without blank lines', async () => {
    const { fs, git } = await setUpRepo({ 'a.txt': 'keep\n', 'b.txt': 'x\ny\n' });
    await fs.writeFile(`${DIR}/a.txt`, 'keep2\n');
    // A different size: isomorphic-git treats a same-size rewrite within the
    // same second as unchanged ("racy git"), which tests can hit.
    await fs.writeFile(`${DIR}/b.txt`, 'x\nzz\n');

    expect(await git.diff(DIR)).toBe(
      lines(
        'diff --git a/a.txt b/a.txt',
        'index 2fa992c..a09deca 100644',
        '--- a/a.txt',
        '+++ b/a.txt',
        '@@ -1 +1 @@',
        '-keep',
        '+keep2',
        'diff --git a/b.txt b/b.txt',
        'index b77b4eb..fd3a737 100644',
        '--- a/b.txt',
        '+++ b/b.txt',
        '@@ -1,2 +1,2 @@',
        ' x',
        '-y',
        '+zz'
      )
    );
  });

  it('shows an added file against /dev/null', async () => {
    const { fs, git } = await setUpRepo({ 'a.txt': 'keep\n' });
    await fs.writeFile(`${DIR}/c.txt`, 'new\n');
    await git.add(DIR, 'c.txt');

    expect(await git.diff(DIR)).toBe(
      lines(
        'diff --git a/c.txt b/c.txt',
        'new file mode 100644',
        'index 0000000..3e75765',
        '--- /dev/null',
        '+++ b/c.txt',
        '@@ -0,0 +1 @@',
        '+new'
      )
    );
  });

  it('shows a deleted file against /dev/null', async () => {
    const { fs, git } = await setUpRepo({ 'a.txt': 'keep\n', 'b.txt': 'x\ny\n' });
    await fs.rm(`${DIR}/b.txt`);

    expect(await git.diff(DIR)).toBe(
      lines(
        'diff --git a/b.txt b/b.txt',
        'deleted file mode 100644',
        'index b77b4eb..0000000',
        '--- a/b.txt',
        '+++ /dev/null',
        '@@ -1,2 +0,0 @@',
        '-x',
        '-y'
      )
    );
  });

  // More lines than a function call accepts as arguments (V8 fails at
  // roughly 10^5), so the diff must not spread the lines into a call.
  const MANY_LINES = 150000;

  it('handles a file that gains many lines', async () => {
    const output = await diffAfterEdit('', `Hello, Git!\n${'x\n'.repeat(MANY_LINES)}`);
    const outputLines = output.split('\n');

    expect(outputLines[4]).toBe(`@@ -0,0 +1,${MANY_LINES + 1} @@`);
    expect(outputLines[5]).toBe('+Hello, Git!');
    expect(outputLines).toHaveLength(5 + MANY_LINES + 1);
    expect(outputLines[outputLines.length - 1]).toBe('+x');
  });

  it('handles a file that loses many lines', async () => {
    const output = await diffAfterEdit(`Hello, Git!\n${'x\n'.repeat(MANY_LINES)}`, '');
    const outputLines = output.split('\n');

    expect(outputLines[4]).toBe(`@@ -1,${MANY_LINES + 1} +0,0 @@`);
    expect(outputLines[5]).toBe('-Hello, Git!');
    expect(outputLines).toHaveLength(5 + MANY_LINES + 1);
    expect(outputLines[outputLines.length - 1]).toBe('-x');
  });

  it('limits the output to the requested file', async () => {
    const { fs, git } = await setUpRepo({ 'a.txt': 'keep\n', 'b.txt': 'x\ny\n' });
    await fs.writeFile(`${DIR}/a.txt`, 'keep2\n');
    await fs.writeFile(`${DIR}/b.txt`, 'x\nzz\n');

    const output = await git.diff(DIR, 'b.txt');
    expect(output.startsWith('diff --git a/b.txt b/b.txt')).toBe(true);
    expect(output).not.toContain('a.txt');
  });

  it('reports no differences when nothing changed', async () => {
    const { git } = await setUpRepo({ 'a.txt': 'keep\n' });
    expect(await git.diff(DIR)).toBe('No differences');
  });
});
