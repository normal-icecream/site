export const environmentConfig = {
  useSandbox: false, // Default to production mode
  useProduction: false,
};
  
export function enableSandbox() {
  environmentConfig.useSandbox = true;
}
  
export function disableSandbox() {
  environmentConfig.useSandbox = false;
}

export function enableProduction() {
  environmentConfig.useProduction = true;
}
  
export function disableProduction() {
  environmentConfig.useProduction = false;
}
  
export async function hitSandbox(fn, ...args) {
  enableSandbox(); // Enable sandbox mode
  try {
    return await fn(...args); // Call the wrapped function with any  arguments
  } finally {
    disableSandbox(); // Restore the environment to production
  }
}

export async function hitProduction(fn, ...args) {
  enableProduction(); // Enable sandbox mode
  try {
    return await fn(...args); // Call the wrapped function with any  arguments
  } finally {
    disableProduction(); // Restore the environment to production
  }
}

/**
 * Determines the environment based on the current URL.
 * @returns {string} - Returns 'sandbox' if the URL is localhost or ends with .page, otherwise 'production'.
 */
export function getEnvironment() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname.endsWith('.page')) {
    return 'sandbox';
  }

  return 'production';
}