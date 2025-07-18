import { createOptimizedPicture } from '../../scripts/aem.js';
import { addItemToCart, removeItemFromCart, getCartItemQuantity } from '../../pages/cart/cart.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';
import { refreshCustomizeContent } from '../../utils/customize/customize.js';
import { getCatalog } from '../../scripts/scripts.js';

/**
 * Delays execution of a function until delay has passed since the last function invocation.
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay (in milliseconds) to wait before invoking the function
 * @returns {Function} Debounced version of the input function
 */
function debounce(func, delay) {
  let timeout;
  // eslint-disable-next-line func-names
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Decreases the value of an input element by 1 (while observing the min value).
 * @param {HTMLInputElement} input - Input element whose value will be decremented.
 */
function decrement(input, catalogObjectId) {
  const total = parseInt(input.value, 10);
  const min = parseInt(total.min, 10) || 0;
  if (total > min) {
    input.value = total - 1;
    input.dispatchEvent(new Event('change'));
    removeItemFromCart(catalogObjectId, catalogObjectId);
  }
}

/**
 * Increases the value of an input element by 1 (while observing the max value).
 * @param {HTMLInputElement} input - Input element whose value will be incremented.
 */
function increment(input, catalogObjectId) {
  const total = parseInt(input.value, 10);
  const max = parseInt(total.max, 10) || null;
  if (!max || total < max) {
    input.value = total + 1;
    input.dispatchEvent(new Event('change'));
    addItemToCart(catalogObjectId, catalogObjectId);
  }
}

/**
 * Checks if an element has a vertical scrollbar.
 * @param {HTMLElement} el - Element to check.
 * @returns {boolean} True if the element has a vertical scrollbar, false if not.
 */
function hasScrollbar(el) {
  return el.scrollHeight > el.clientHeight;
}

/**
 * Gets the computed style value of a specified property on an element.
 * @param {HTMLElement} el - Element whose style property value is being retrieved.
 * @param {string} prop - Name of the style property to retrieve.
 * @returns {number} Numerical value of the specified style property.
 */
function getStyle(el, prop) {
  const styles = window.getComputedStyle(el);
  const value = styles.getPropertyValue(prop);
  // convert the style property value to a number, stripping 'px' unit
  return parseFloat(value.replace('px', ''), 10);
}

/**
 * Removes the inline styles used for clamping text.
 * @param {HTMLElement} wrapper - Parent element wrapping paragraphs to unclamp.
 */
function unclampBodies(wrapper) {
  const clamped = wrapper.querySelectorAll('p[style]');
  clamped.forEach((el) => el.removeAttribute('style'));
}

/**
 * Clamps the description text inside card body elements based on available space.
 * @param {HTMLElement} wrapper - Parent element wrapping card body elements.
 */
function clampBodies(wrapper) {
  const bodies = wrapper.querySelectorAll('.cards-card-body');
  bodies.forEach((body) => {
    const overflows = hasScrollbar(body);
    if (overflows) {
      const head = body.querySelector('h3');
      const desc = body.querySelector('h3 ~ p:not([class])');
      if (desc) {
        const headHeight = head.offsetHeight;
        const lineHeight = getStyle(desc, 'line-height');
        const spacing = getStyle(desc, 'margin-top');
        const heightAvail = body.clientHeight - headHeight - spacing;
        let linesAvail = Math.floor(heightAvail / lineHeight);
        if (linesAvail < 0) linesAvail = 0;
        desc.style.setProperty('--line-clamp', linesAvail);
      }
    } else unclampBodies(body); // unclamp the body if it doesn't overflow
  });
}

export default function decorate(block) {
  const variants = [...block.classList];
  const ul = document.createElement('ul');

  // decorate each card
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'cards-card';
    const [image, body] = row.children;
    image.className = 'cards-card-image';
    body.className = 'cards-card-body';
    card.append(image, body);

    const squareButton = body.querySelector('.button-wrapper');
    let squareProductId;
    if (squareButton) {
      const squareLink = squareButton.querySelector('a')
        ?.getAttribute('href')
        .split('/');
      squareProductId = [squareLink[squareLink.length - 1]].pop()?.split('?')[0];
      squareButton.remove();
    }

    // decorate image
    const img = image.querySelector('picture > img');
    if (img) {
      const pic = img.closest('picture');
      pic.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '560' }]));
    }

    // decorate dietary restrictions
    const dietary = body.querySelector('h3 ~ p > span.icon');
    if (dietary) {
      const p = dietary.closest('p');
      if (p.textContent === dietary.textContent) p.className = 'cards-card-dietary';
    }

    // decorate badge
    const badge = body.querySelector('h3 ~ p > em');
    if (badge) {
      const p = badge.closest('p');
      if (p.textContent === badge.textContent) {
        p.className = 'cards-card-badge';
        p.innerHTML = badge.innerHTML;
      }
    }

    // decorate price
    if (variants.includes('price')) {
      const price = body.querySelector('h3 ~ p > strong');
      if (price) {
        const p = price.closest('p');
        if (p.textContent === price.textContent) {
          p.className = 'cards-card-price';
          p.innerHTML = price.innerHTML;
          // style flat rate
          if (p.textContent.includes('flat rate')) {
            p.textContent = p.textContent.replace('flat rate', '').trim();
            const span = document.createElement('span');
            span.className = 'flat-rate';
            span.textContent = 'flat rate';
            p.append(span);
          }
        }
      }
    }

    // assemble card
    li.append(card);

    if (!variants.includes('customize')) {
      // decorate cart actions
      const cart = document.createElement('form');
      cart.className = 'cards-card-cart';

      // build total field
      const total = document.createElement('input');
      total.type = 'number';
      total.min = 0;
      total.value = squareProductId ? getCartItemQuantity(squareProductId) : 0;
      total.step = 1;
      total.readOnly = true;
      total.addEventListener('change', () => {
        const value = parseInt(total.value, 10);
        const subtract = cart.querySelector('.button.subtract');
        const min = parseInt(total.min, 10) || 0;
        if (value > min) subtract.removeAttribute('disabled');
        else subtract.disabled = true;
        // TODO: disable "add" if max
      });
      cart.append(total);

      // build action buttons
      const actions = ['subtract', 'add'];
      actions.forEach((action) => {
        const button = document.createElement('button');
        button.className = `button ${action}`;
        button.type = 'button';
        // TODO: write more dynamic button labels
        button.setAttribute('aria-label', `${action} item`);
        const symbol = document.createElement('i');
        symbol.className = `symbol symbol-${action}`;
        button.append(symbol);

        if (action === 'subtract') {
          button.disabled = !(getCartItemQuantity(squareProductId) > 0);
          cart.prepend(button);
          // Fetch catalog item by Id to display in new modal variations and mods to choose from.
          button.addEventListener('click', () => decrement(total, squareProductId));
        } else {
          cart.append(button);
          button.addEventListener('click', () => increment(total, squareProductId));
        }
      });
      li.append(cart);
    } else {
      const modal = document.createElement('div');
      modal.classList.add('customize', `customize-${squareProductId}`);
      modal.dataset.id = squareProductId;
      createModal(modal);
      li.append(modal);

      const pathSegments = window.location.pathname.split('/');
      const path = pathSegments.length > 1 ? pathSegments[1] : null;

      let buttonLabel;
      if (path === 'merch') {
        buttonLabel = 'select your size';
      } else if (path === 'shipping') {
        buttonLabel = 'pick your items';
      } else {
        buttonLabel = 'add to cart';
      }

      // build customize button
      const button = document.createElement('button');
      button.className = 'button customize';
      button.type = 'button';
      button.setAttribute('aria-label', 'customize item');
      button.textContent = buttonLabel;
      button.addEventListener('click', async () => {
        if (squareProductId) {
          const cardItemTitle = (await getCatalog()).byId[squareProductId].item_data.name;
          toggleModal(modal, cardItemTitle, refreshCustomizeContent);
        }
      });
      li.append(button);
    }

    if (variants.includes('actionless')) {
      const cardActions = li.querySelector('.cards-card-cart');
      cardActions.remove();
    }

    // assemble card
    ul.append(li);
  });

  block.innerHTML = '';
  block.append(ul);

  // observe the block attributes to determine when it appears in the dom
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      // clamp bodies when their height can be calculated
      setTimeout(() => clampBodies(ul), 100);
      observer.disconnect();
    });
  });
  observer.observe(block, { attributes: true });

  // listen for resize events to determine when elements should or shouldn't be clamped
  window.addEventListener('resize', debounce((e) => {
    const width = e.target.innerWidth;
    // apply clamping on devices larger than mobile
    if (width >= 600) {
      unclampBodies(ul);
      clampBodies(ul);
    } else unclampBodies(ul); // unclamp all bodies on mobile
  }, 100));
}
