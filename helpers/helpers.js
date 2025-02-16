/* eslint-disable import/prefer-default-export */

/**
 * Creates a new HTML element, applies attributes, and appends children.
 * @param {string} tag - Tag name of the element to create.
 * @param {Object} attrs - Object containing attributes to set on element.
 * @param {string|Node|Array<string|Node>} children - Children to append to element.
 * @returns {HTMLElement} - Fully constructed element.
 */
export function createEl(tag, attrs, children) {
  const el = document.createElement(tag);
  // loop through the attributes and set them
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  // normalize children to always be an array
  if (children) {
    // eslint-disable-next-line no-param-reassign
    children = Array.isArray(children) ? children : [children];
    // add each child to the element
    children.forEach((child) => {
      if (child instanceof HTMLElement) el.appendChild(child);
      else el.appendChild(document.createTextNode(child));
    });
  }
  return el;
}

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
