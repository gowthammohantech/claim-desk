import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Testing Library only auto-cleans when Vitest globals are enabled. We keep
 * globals off (explicit imports), so unmount between tests here — otherwise
 * every render accumulates in the same jsdom document and queries start
 * matching elements from earlier tests.
 */
afterEach(() => {
  cleanup();
});
