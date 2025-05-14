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

export function getTotals(element, orderData, format) {
  const { pathname } = window.location;
  const wholesale = pathname.split('/').some((path) => path === 'wholesale');

  const totalWrapper = element.querySelector('.total-wrapper');
  if (totalWrapper) totalWrapper.innerHTML = '';

  if (Number(orderData.order.total_discount_money.amount) > 0) {
    const discount = format('discount', `-${formatCurrency(orderData.order.total_discount_money.amount)}`);
    totalWrapper.append(discount);
  }

  if (!wholesale) {
    const tax = format('prepared food tax (included)', formatCurrency(orderData.order.total_tax_money.amount));
    totalWrapper.append(tax);
  }

  const total = format('total', formatCurrency(orderData.order.net_amount_due_money.amount));
  totalWrapper.append(total);
}

export function stringExistsInAnother(stringOne, stringTwo) {
  return stringOne.toLowerCase().includes(stringTwo.toLowerCase());
}

export function removeLeadingZero(numString) {
  return String(numString).replace(/^0+/, '');
}

export function convertEmailToLink(text) {
  // Regular expression to match an email address
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

  // Replace the email address with a mailto link
  return text.replace(emailRegex, (email) => `<a href="mailto:${email}">${email}</a>`);
}

export function wrapRegisteredWithSup(str) {
  const containsRegisteredTm = str.includes('®');
  if (containsRegisteredTm) {
    const span = document.createElement('span');
    span.innerHTML = str.replace(/®/g, '<sup>®</sup>');
    return span;
  }
  return str;
}

export function generateUniqueTimestamp(orderData) {
  const orderObj = JSON.parse(orderData);
  orderObj.timestamp = Date.now();
  return JSON.stringify(orderObj);
}

export async function getCSRFToken(payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const base64String = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return base64String.substring(0, 6);
}
