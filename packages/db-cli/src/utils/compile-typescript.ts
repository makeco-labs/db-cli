
// ========================================================================
// TYPESCRIPT COMPILATION UTILITIES
// ========================================================================

export const safeRegister = async () => {
  const { register } = await import('esbuild-register/dist/node');
  let res: { unregister: () => void };
  try {
    res = register({
      format: 'cjs',
      loader: 'ts',
    });
  } catch {
    // tsx fallback
    res = {
      unregister: () => {
        // No-op for tsx fallback
      },
    };
  }
  return res;
};

/**
 * Creates a CommonJS require function for loading TypeScript files
 * In bundled environments, this falls back to the global require
 */
export function createRequireForTS() {
  // In bundled CJS environments (like our esbuild output), require is available globally
  if (typeof require !== 'undefined') {
    return require;
  }
  
  // This should not happen in our bundled CLI, but provide a helpful error
  throw new Error('require function not available in current environment');
}
