export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

export interface FileSystemState {
  files: FileNode[];
  currentFile: string | null;
  fileContents: Record<string, string>;
}
