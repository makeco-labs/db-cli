// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * Utility type to flatten and display the internals of complex types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
