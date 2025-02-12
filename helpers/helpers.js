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
  Object.keys(attrs).forEach((key) => {
    el.setAttribute(key, attrs[key]);
  });
  // normalize children to always be an array
  // eslint-disable-next-line no-param-reassign
  children = Array.isArray(children) ? children : [children];
  // add each child to the element
  children.forEach((child) => {
    if (child instanceof HTMLElement) el.appendChild(child);
    else el.appendChild(document.createTextNode(child));
  });
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

export function formatCurrency(amountInCents) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  // Convert cents to dollars by dividing by 100
  return formatter.format(amountInCents / 100);
}

export function formatPhoneNumberToE164(phoneNumber, countryCode = '1') {
  // Remove all non-numeric characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Ensure the phone number has at least 10 digits (US standard)
  if (digits.length < 10) {
    throw new Error('Invalid phone number. Must contain at least 10 digits.');
  }

  // Add the country code prefix if not already included
  if (digits.startsWith(countryCode)) {
    return `+${digits}`; // Already in E.164 format
  }
  return `+${countryCode}${digits}`;
}

export async function getIconSvg(icon, height, width, color = 'red') {
  const svgPath = `../icons/${icon}.svg`;

  try {
    const response = await fetch(svgPath);

    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.statusText}`);
    }

    const svgText = await response.text();
    const div = document.createElement('div');
    div.innerHTML = svgText;

    const svgElement = div.querySelector('svg');
    if (!svgElement) {
      throw new Error('Invalid SVG file.');
    }

    if (width) svgElement.setAttribute('width', width);
    if (height) svgElement.setAttribute('height', height);
    if (color) svgElement.setAttribute('fill', color);

    return svgElement; // Return the SVG elemen
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching SVG:', error);
    return null;
  }
}
