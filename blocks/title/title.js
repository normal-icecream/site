import { createEl } from '../../helpers/helpers.js';

/**
 * Splits a price string into numeric price and label.
 * @param {string} str - Input string containing a price (e.g., '$6 each').
 * @returns {[string|null, string]} Array of price ('$6') and label ('each'), or `null`.
 */
function splitPrice(str) {
  const match = str.match(/^\$(\d+(?:\.\d{1,2})?)\s*(.*)/);
  return match ? [`$${match[1]}`, match[2].trim()] : [null, str.trim()];
}

/**
 * Splits string containing parentheses into main label and aside.
 * @param {string} str - Input string (e.g., 'mini (serves 1 human)').
 * @returns {[string, string|null]} Array of main label and paranthentical aside, or `null`.
 */
function splitParens(str) {
  const match = str.match(/^([^(]+)\s*\(([^)]+)\)$/);
  return match ? [match[1].trim(), match[2].trim()] : [str.trim()];
}

export default function decorate(block) {
  const variants = [...block.classList];
  // simplify dom structure
  const [title, price] = block.firstElementChild.children;
  title.replaceWith(...title.children);

  if (variants.includes('bundled')) {
    const bundledContainer = document.createElement('div');
    bundledContainer.className = 'title-bundled-container';

    const complexPrice = block.querySelector('div > h2:nth-of-type(2)');
    const splitPriceArray = complexPrice.textContent.split('|');
    splitPriceArray.forEach((item) => {
      const priceText = document.createElement('h3');
      priceText.innerHTML = item.trim();
      bundledContainer.append(priceText);
    });

    complexPrice.remove();

    const titleContainer = block.querySelector('div');
    titleContainer.append(bundledContainer);
  }

  // decorate price, if available
  if (price) {
    price.className = 'title-price';
    const lines = [...price.querySelectorAll('p')].map((p) => p.textContent.trim());
    price.innerHTML = '';
    lines.forEach((line) => {
      const wrapper = createEl('p');
      // check for dollar amount and additional text
      const [$, text] = splitPrice(line);
      if ($) {
        const amount = createEl('span', { class: 'h2' }, $);
        wrapper.append(amount);
      }
      // decorate text as label, if available
      if (text) {
        const labels = splitParens(text);
        // check if label text has additional paranthetical aside
        labels.forEach((l, i) => {
          const label = createEl(
            'span',
            { class: `title-price-${!i ? 'label' : 'extra'}` },
            l,
          );
          wrapper.append(label);
        });
      }
      price.append(wrapper);
    });
  }

  // check if title is describing multiple items
  const wrapper = block.parentElement;
  const sibling = wrapper.nextElementSibling;
  // enable sticky behavior and animation
  if (sibling && sibling.firstElementChild.children.length > 1) {
    wrapper.classList.add('sticky');
    window.addEventListener('scroll', () => {
      const headerHeight = document.querySelector('header').offsetHeight;
      const { top, bottom } = wrapper.getBoundingClientRect();
      const sticky = top <= headerHeight; // CURRENTLY sticky
      const outOfView = bottom <= headerHeight; // scrolled UP and out of view
      wrapper.dataset.sticky = sticky && !outOfView;
    });
  }
}
