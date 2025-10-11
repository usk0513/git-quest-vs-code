import { describe, it, expect } from 'vitest';
import { CommandParser } from '@/services/terminal/CommandParser';

describe('CommandParser', () => {
  const parser = new CommandParser();

  describe('parse', () => {
    it('should parse git clone command with URL', () => {
      const result = parser.parse('git clone /remote-repo');
      expect(result.command).toBe('clone');
      expect(result.args).toEqual(['/remote-repo']);
    });

    it('should parse git commit with message', () => {
      const result = parser.parse('git commit -m "Initial commit"');
      expect(result.command).toBe('commit');
      expect(result.flags).toContain('-m');
      expect(result.message).toBe('Initial commit');
    });

    it('should parse git checkout -b with branch name', () => {
      const result = parser.parse('git checkout -b feature/test');
      expect(result.command).toBe('checkout');
      expect(result.flags).toContain('-b');
      expect(result.branchName).toBe('feature/test');
    });

    it('should parse git add with filename', () => {
      const result = parser.parse('git add greeting.txt');
      expect(result.command).toBe('add');
      expect(result.args).toContain('greeting.txt');
    });

    it('should parse git add with dot', () => {
      const result = parser.parse('git add .');
      expect(result.command).toBe('add');
      expect(result.args).toContain('.');
    });

    it('should parse git push with remote and branch', () => {
      const result = parser.parse('git push origin main');
      expect(result.command).toBe('push');
      expect(result.args).toEqual(['origin', 'main']);
    });

    it('should throw error for non-git commands', () => {
      expect(() => parser.parse('npm install')).toThrow('Only git commands are allowed');
    });

    it('should throw error for empty git command', () => {
      expect(() => parser.parse('git')).toThrow();
    });
  });

  describe('isGitCommand', () => {
    it('should return true for git commands', () => {
      expect(parser.isGitCommand('git status')).toBe(true);
      expect(parser.isGitCommand('git add .')).toBe(true);
    });

    it('should return false for non-git commands', () => {
      expect(parser.isGitCommand('npm install')).toBe(false);
      expect(parser.isGitCommand('ls -la')).toBe(false);
    });
  });
});
