import * as LightningFSModule from '@isomorphic-git/lightning-fs';

type LightningFSInstance = {
  promises: {
    readFile(path: string, options: { encoding: 'utf8' }): Promise<string | Uint8Array>;
    writeFile(path: string, content: string, options: { encoding: 'utf8' }): Promise<void>;
    unlink(path: string, options?: unknown): Promise<void>;
    readdir(path: string, options?: unknown): Promise<string[]>;
    mkdir(path: string, options?: unknown): Promise<void>;
    rmdir(path: string, options?: unknown): Promise<void>;
    stat(path: string, options?: unknown): Promise<{ isDirectory(): boolean }>;
    lstat(path: string, options?: unknown): Promise<{ isDirectory(): boolean }>;
    readlink?(path: string, options?: unknown): Promise<string>;
    symlink?(target: string, path: string): Promise<void>;
    chmod?(path: string, mode: number): Promise<void>;
    backFile?(path: string, options?: unknown): Promise<void>;
    du?(path: string): Promise<number>;
    flush?(): Promise<void>;
  };
};

type LightningFSConstructor = new (
  name: string,
  options?: {
    wipe?: boolean;
  }
) => LightningFSInstance;

// Normalize CommonJS export shape so Vite can import it safely in ESM mode.
const LightningFS: LightningFSConstructor =
  (LightningFSModule as { default?: LightningFSConstructor }).default ??
  (LightningFSModule as unknown as LightningFSConstructor);

export class FileSystemService {
  private fs: LightningFSInstance;
  public pfs: LightningFSInstance['promises'];

  constructor(name: string = 'fs', wipe: boolean = false) {
    this.fs = new LightningFS(name, { wipe });
    this.pfs = this.fs.promises;
  }

  async readFile(filepath: string): Promise<string> {
    try {
      const data = await this.pfs.readFile(filepath, { encoding: 'utf8' });
      return data as string;
    } catch (error) {
      console.error(`Error reading file ${filepath}:`, error);
      throw error;
    }
  }

  async writeFile(filepath: string, content: string): Promise<void> {
    try {
      await this.pfs.writeFile(filepath, content, { encoding: 'utf8' });
    } catch (error) {
      console.error(`Error writing file ${filepath}:`, error);
      throw error;
    }
  }

  async mkdir(dirpath: string): Promise<void> {
    try {
      await this.pfs.mkdir(dirpath);
    } catch (error: any) {
      // Ignore if directory already exists
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dirpath}:`, error);
        throw error;
      }
    }
  }

  async readdir(dirpath: string): Promise<string[]> {
    try {
      return await this.pfs.readdir(dirpath);
    } catch (error) {
      console.error(`Error reading directory ${dirpath}:`, error);
      throw error;
    }
  }

  async exists(filepath: string): Promise<boolean> {
    try {
      await this.pfs.stat(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(filepath: string) {
    return await this.pfs.stat(filepath);
  }

  async rm(filepath: string): Promise<void> {
    try {
      await this.pfs.unlink(filepath);
    } catch (error) {
      console.error(`Error removing file ${filepath}:`, error);
      throw error;
    }
  }

  async rmdir(dirpath: string, options?: { recursive?: boolean }): Promise<void> {
    try {
      if (options?.recursive) {
        // Recursively delete directory
        const files = await this.pfs.readdir(dirpath);
        for (const file of files) {
          const filepath = `${dirpath}/${file}`;
          const stats = await this.pfs.stat(filepath);
          if (stats.isDirectory()) {
            await this.rmdir(filepath, { recursive: true });
          } else {
            await this.pfs.unlink(filepath);
          }
        }
      }
      await this.pfs.rmdir(dirpath);
    } catch (error) {
      console.error(`Error removing directory ${dirpath}:`, error);
      throw error;
    }
  }

  getFS() {
    return this.fs;
  }
}

// Singleton instance
let fsInstance: FileSystemService | null = null;

export const getFileSystemService = (): FileSystemService => {
  if (!fsInstance) {
    fsInstance = new FileSystemService('git-quest-fs', true);
  }
  return fsInstance;
};

export const resetFileSystem = (): FileSystemService => {
  fsInstance = new FileSystemService('git-quest-fs', true);
  return fsInstance;
};
