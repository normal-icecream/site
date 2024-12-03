/* eslint-disable import/prefer-default-export */
// Function to remove empty elements based on selector
export function removeEmptyElements(selector) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    // Check if the element has child nodes
    if (element.children.length === 0) {
      element.remove();
    }
  });
}

/**
 * Converts a given string into kebab-case and sets them all to lowercase.
 * @param {string} string - The input string to be converted.
 * @returns {string} - The kebab-case version of the input string.
 */
export function toKebabCase(string) {
  return string
    .split('')
    .map((char) => (char === ' ' ? '-' : char))
    .join('')
    .toLowerCase();
}
