import { ParsedGitCommand, GitCommand } from '@/types';

export class CommandParser {
  parse(commandString: string): ParsedGitCommand {
    const trimmed = commandString.trim();

    // Check if it's a git command
    if (!trimmed.startsWith('git ')) {
      throw new Error('Only git commands are allowed');
    }

    // Remove 'git ' prefix
    const withoutGit = trimmed.substring(4).trim();

    // Split by spaces, but preserve quoted strings
    const parts = this.splitCommand(withoutGit);

    if (parts.length === 0) {
      throw new Error('Invalid git command');
    }

    const subcommand = parts[0] as GitCommand;
    const args: string[] = [];
    const flags: string[] = [];
    let message: string | undefined;
    let branchName: string | undefined;

    // Parse arguments and flags
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith('-')) {
        flags.push(part);

        // Special handling for -m flag (commit message)
        if (part === '-m' && i + 1 < parts.length) {
          message = parts[i + 1];
          i++; // Skip next part as we've consumed it
        }

        // Special handling for -b flag (branch name)
        if (part === '-b' && i + 1 < parts.length) {
          branchName = parts[i + 1];
          i++; // Skip next part as we've consumed it
        }
      } else {
        args.push(part);
      }
    }

    // If no -b flag but checkout command with args, first arg is branch name
    if (subcommand === 'checkout' && args.length > 0 && !branchName) {
      branchName = args[0];
    }

    return {
      command: subcommand,
      args,
      flags,
      message,
      branchName,
    };
  }

  private splitCommand(commandString: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < commandString.length; i++) {
      const char = commandString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  isGitCommand(commandString: string): boolean {
    return commandString.trim().startsWith('git ');
  }
}
