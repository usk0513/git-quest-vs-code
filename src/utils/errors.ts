// Message of a caught value, or `fallback` when it is not an Error with a
// message. Lets `catch (error)` stay `unknown` instead of `any`.
export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

// True when a caught value carries the given `code` (e.g. 'EEXIST' from
// LightningFS).
export const hasErrorCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;
