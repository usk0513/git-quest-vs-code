import 'fake-indexeddb/auto';
// Registers the jest-dom matchers with Vitest's expect and adds their types.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
