import { getCart, getLastCart } from '../../utils/cart/cart.js'

export function toggleModal(block) {
  const modalWrapper = block.closest('.modal-wrapper');
  const isExpanded = modalWrapper.getAttribute('aria-expanded') === 'true';
  
  modalWrapper.setAttribute('aria-expanded', !isExpanded);
  // TODO - this is broken for some reason on cart modal??? It's not switching to display block.
  modalWrapper.style.display = isExpanded ? 'none' : 'block';
}

function getModalTitle(title) {
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  modalTitle.className = 'modal-cart-title';
  return modalTitle;
}

export default function decorate(block) {
  const variants = [...block.classList];

  // Set initial modal state
  const modalWrapper = block.closest('.modal-wrapper');
  modalWrapper.setAttribute('aria-expanded', 'false');
  modalWrapper.style.display = 'none';

  if (variants.includes('cart')) {
    const cartKey = window.location.pathname.split('/')[1];

    const cart = getCart(cartKey);
    const lastCart = getLastCart();
    const cartTitle = getModalTitle(`Your ${lastCart} order`);

    block.append(cartTitle);
    block.append(cart);
  } else {
    // create and append button to block
    const button = document.createElement('button');
    button.className = 'modal-btn';
    // TODO - Need to fix this so user can set button text
    button.textContent = 'open';
    button.addEventListener('click', () => toggleModal(block));

    modalWrapper.after(button);
  }

  const closeModalButton = document.createElement('button');
  closeModalButton.textContent = 'X';
  closeModalButton.className = 'modal-close-btn';
  closeModalButton.addEventListener('click', () => toggleModal(block));

  block.append(closeModalButton);
}
