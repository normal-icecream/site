export const sandboxConfig = {
  useSandbox: false, // Default to production mode
};
  
export function enableSandbox() {
  sandboxConfig.useSandbox = true;
}
  
export function disableSandbox() {
  sandboxConfig.useSandbox = false;
}
  
export async function hitSandbox(fn, ...args) {
  enableSandbox(); // Enable sandbox mode
  try {
    return await fn(...args); // Call the wrapped function with any  arguments
  } finally {
    disableSandbox(); // Restore the environment to production
  }
}