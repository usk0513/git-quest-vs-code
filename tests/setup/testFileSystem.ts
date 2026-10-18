import { resetFileSystem } from '@/services/filesystem/FileSystemService';

let databaseCount = 0;

// Gives each test its own IndexedDB database. LightningFS saves its
// superblock 500 ms after the last write, so an instance left over from the
// previous test could otherwise overwrite this test's wiped database and
// break `git init` (seen in CI as "Could not find HEAD").
export const resetTestFileSystem = () => {
  databaseCount += 1;
  return resetFileSystem(`git-quest-fs-test-${databaseCount}`);
};
