import { createRequire } from 'node:module';

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
 */
export function createRequireForTS(): NodeRequire {
  return createRequire(import.meta.url);
}
