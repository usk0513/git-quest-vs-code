import { describe, it, expect } from 'vitest';
import { GitValidator } from '@/services/git/GitValidator';

describe('GitValidator', () => {
  const validator = new GitValidator();

  describe('validateCommand', () => {
    it('should allow git clone command when clone is allowed', () => {
      const result = validator.validateCommand('git clone /remote-repo', ['clone']);
      expect(result.passed).toBe(true);
    });

    it('should reject git clone command with invalid repository path', () => {
      const result = validator.validateCommand('git clone https://github.com/example/repo.git', ['clone']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should reject git push when only clone is allowed', () => {
      const result = validator.validateCommand('git push origin main', ['clone']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should reject non-git commands', () => {
      const result = validator.validateCommand('npm install', ['add']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Only git commands are allowed');
    });

    it('should validate git add with file path', () => {
      const result = validator.validateCommand('git add greeting.txt', ['add']);
      expect(result.passed).toBe(true);
    });

    it('should reject git add without file path', () => {
      const result = validator.validateCommand('git add', ['add']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('requires a file path');
    });

    it('should validate git commit with message', () => {
      const result = validator.validateCommand('git commit -m "test"', ['commit']);
      expect(result.passed).toBe(true);
    });

    it('should reject git commit without -m flag', () => {
      const result = validator.validateCommand('git commit', ['commit']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('requires a message');
    });

    it('should reject git commit with empty message', () => {
      const result = validator.validateCommand('git commit -m ""', ['commit']);
      expect(result.passed).toBe(false);
    });

    it('should validate git checkout -b with allowed branch name', () => {
      const result = validator.validateCommand('git checkout -b feature/add-greeting', ['checkout']);
      expect(result.passed).toBe(true);
    });

    it('should reject git checkout -b without branch name', () => {
      const result = validator.validateCommand('git checkout -b', ['checkout']);
      expect(result.passed).toBe(false);
    });

    it('should reject git checkout -b with disallowed branch name', () => {
      const result = validator.validateCommand('git checkout -b feature/test', ['checkout']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should reject git branch creation when not allowed in step', () => {
      const result = validator.validateCommand('git branch feature/add-greeting', ['branch'], {
        allowBranchCreation: false,
      });
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should validate git push with remote and branch', () => {
      const result = validator.validateCommand('git push origin main', ['push']);
      expect(result.passed).toBe(true);
    });

    it('should reject git push without remote and branch', () => {
      const result = validator.validateCommand('git push', ['push']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('requires remote and branch');
    });

    it('should reject git branch with unsupported flags', () => {
      const result = validator.validateCommand('git branch -v', ['branch']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('Unsupported flag');
    });

    it('should reject git branch with disallowed branch name', () => {
      const result = validator.validateCommand('git branch feature/test', ['branch']);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not allowed');
    });

    it('should allow git branch with allowed branch name', () => {
      const result = validator.validateCommand('git branch feature/add-greeting', ['branch']);
      expect(result.passed).toBe(true);
    });
  });
});
