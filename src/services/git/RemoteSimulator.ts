import { FileSystemService } from '../filesystem/FileSystemService';
import { GitService } from './GitService';
import { INITIAL_FILES, REMOTE_DIR } from '@/constants/initialFiles';

export class RemoteSimulator {
  private fs: FileSystemService;
  private git: GitService;

  constructor(fileSystem: FileSystemService, gitService: GitService) {
    this.fs = fileSystem;
    this.git = gitService;
  }

  async createRemoteRepository(): Promise<void> {
    try {
      // Create remote directory
      await this.fs.mkdir(REMOTE_DIR);

      // Initialize git repository
      await this.git.init(REMOTE_DIR);

      // Create initial files
      for (const [filepath, content] of Object.entries(INITIAL_FILES)) {
        const fullPath = `${REMOTE_DIR}/${filepath}`;

        // Create directory if needed
        if (filepath.includes('/')) {
          const dir = filepath.substring(0, filepath.lastIndexOf('/'));
          await this.fs.mkdir(`${REMOTE_DIR}/${dir}`);
        }

        // Write file
        await this.fs.writeFile(fullPath, content);

        // Stage file
        await this.git.add(REMOTE_DIR, filepath);
      }

      // Create initial commit
      await this.git.commit(REMOTE_DIR, 'Initial commit');

      console.log('Remote repository created successfully');
    } catch (error) {
      console.error('Error creating remote repository:', error);
      throw error;
    }
  }

  async cloneToWorkspace(workspaceDir: string): Promise<void> {
    try {
      // Create workspace directory
      await this.fs.mkdir(workspaceDir);

      // Initialize git repository in workspace
      await this.git.init(workspaceDir);

      // Copy files from remote to workspace
      await this.copyDirectory(REMOTE_DIR, workspaceDir);

      console.log('Repository cloned to workspace');
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  private async copyDirectory(source: string, dest: string): Promise<void> {
    const files = await this.fs.readdir(source);

    for (const file of files) {
      // Skip .git directory for now
      if (file === '.git') continue;

      const sourcePath = `${source}/${file}`;
      const destPath = `${dest}/${file}`;
      const stats = await this.fs.stat(sourcePath);

      if (stats.isDirectory()) {
        await this.fs.mkdir(destPath);
        await this.copyDirectory(sourcePath, destPath);
      } else {
        const content = await this.fs.readFile(sourcePath);
        await this.fs.writeFile(destPath, content);
      }
    }
  }

  async simulatePush(workspaceDir: string, branch: string): Promise<boolean> {
    try {
      // In a real scenario, we would push to remote
      // For simulation, we just validate that:
      // 1. The branch exists
      // 2. There are commits to push

      const branches = await this.git.listBranches(workspaceDir);
      if (!branches.includes(branch)) {
        throw new Error(`Branch ${branch} does not exist`);
      }

      const commits = await this.git.log(workspaceDir, 5);
      if (commits.length === 0) {
        throw new Error('No commits to push');
      }

      console.log(`Simulated push to origin/${branch}`);
      return true;
    } catch (error) {
      console.error('Error simulating push:', error);
      return false;
    }
  }
}
