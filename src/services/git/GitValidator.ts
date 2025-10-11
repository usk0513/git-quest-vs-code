import { GitCommand, ValidationResult } from '@/types';
import { CommandParser } from '../terminal/CommandParser';

export class GitValidator {
  private parser: CommandParser;

  constructor() {
    this.parser = new CommandParser();
  }

  validateCommand(
    commandString: string,
    allowedCommands: GitCommand[]
  ): ValidationResult {
    try {
      // Check if it's a git command
      if (!this.parser.isGitCommand(commandString)) {
        return {
          passed: false,
          message: 'Only git commands are allowed',
          hint: 'Start your command with "git"',
        };
      }

      // Parse the command
      const parsed = this.parser.parse(commandString);

      // Check if command is allowed
      if (!allowedCommands.includes(parsed.command)) {
        return {
          passed: false,
          message: `The command "git ${parsed.command}" is not allowed at this step`,
          hint: `Allowed commands: ${allowedCommands.map(cmd => `git ${cmd}`).join(', ')}`,
        };
      }

      // Command-specific validation
      const validation = this.validateSpecificCommand(parsed);
      if (!validation.passed) {
        return validation;
      }

      return {
        passed: true,
        message: 'Command is valid',
      };
    } catch (error: any) {
      return {
        passed: false,
        message: error.message || 'Invalid command',
        hint: 'Check your command syntax',
      };
    }
  }

  private validateSpecificCommand(parsed: any): ValidationResult {
    switch (parsed.command) {
      case 'clone':
        if (parsed.args.length === 0) {
          return {
            passed: false,
            message: 'git clone requires a repository path',
            hint: 'Usage: git clone <repository>',
          };
        }
        break;

      case 'commit':
        if (!parsed.flags.includes('-m')) {
          return {
            passed: false,
            message: 'git commit requires a message',
            hint: 'Usage: git commit -m "your message"',
          };
        }
        if (!parsed.message) {
          return {
            passed: false,
            message: 'Commit message cannot be empty',
            hint: 'Provide a commit message after -m flag',
          };
        }
        break;

      case 'add':
        if (parsed.args.length === 0) {
          return {
            passed: false,
            message: 'git add requires a file path',
            hint: 'Usage: git add <file> or git add .',
          };
        }
        break;

      case 'checkout':
        if (parsed.flags.includes('-b') && !parsed.branchName) {
          return {
            passed: false,
            message: 'git checkout -b requires a branch name',
            hint: 'Usage: git checkout -b <branch-name>',
          };
        }
        if (!parsed.flags.includes('-b') && parsed.args.length === 0) {
          return {
            passed: false,
            message: 'git checkout requires a branch name',
            hint: 'Usage: git checkout <branch-name>',
          };
        }
        break;

      case 'branch':
        // git branch is OK with or without args
        break;

      case 'push':
        if (parsed.args.length < 2) {
          return {
            passed: false,
            message: 'git push requires remote and branch',
            hint: 'Usage: git push <remote> <branch>',
          };
        }
        break;
    }

    return { passed: true, message: 'Valid command' };
  }
}
