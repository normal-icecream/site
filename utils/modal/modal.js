import { getCart, getLastCartKey, getLocalStorageCart } from '../../pages/cart/cart.js';
import { loadCSS } from '../../scripts/aem.js';
import { orderForm } from '../orderForm/orderForm.js'

function createModalTitle(title) {
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  return modalTitle;
}

// Function to create a modal
export function createModal(element, title, content = '') {
  loadCSS(`${window.hlx.codeBasePath}/utils/modal/modal.css`);
  
  element.classList.add('modal');
  element.setAttribute('aria-expanded', 'false');
  element.style.display = 'none';

  if (title) element.append(createModalTitle(title));

  if (element.classList.contains('cart')) {
    element.append(getCart());
  } else if (element.classList.contains('payments')) {
    element.append(refreshPaymentModal());
  } else {
    element.append(content);
  }

  const closeModalButton = document.createElement('button');
  closeModalButton.textContent = 'X';
  closeModalButton.className = 'modal-close-btn';
  closeModalButton.addEventListener('click', () => toggleModal(element));
  element.append(closeModalButton);

  return element;
}

// Function to refresh the cart content
export function refreshCustomizeContent(element) {
  // console.log("element:", element);
  // const id = 
  // const wrapper = document.createElement('div');
  // const cartContent = element.querySelector('.card-wrapper');
  // if (cartContent) cartContent.remove();
}

// Function to refresh the cart content
export function refreshCartContent(element) {
  const cartContent = element.querySelector('.card-wrapper');
  if (cartContent) cartContent.remove();
  
  const emptyCartMessage = element.querySelector('.empty-cart-message');
  if (emptyCartMessage) emptyCartMessage.remove();

  const cartOrderForm = element.querySelector('.cart-order-form');
  if (cartOrderForm) cartOrderForm.remove();
  
  const currentCart = getCart();
  element.append(currentCart);

  // Check if currentCart contains the class `card-wrapper` (cart with items)
  if (currentCart.classList.contains('card-wrapper')) {
    // If cart has items, append the order form
    // TODO - clean up this logic
    const cartKey = getLastCartKey();
    const cartLocalStorageData = getLocalStorageCart();
    const hasShipping = (cartKey === 'shipping' || cartKey === 'merch') ? true : false;

    const form = orderForm(cartLocalStorageData, hasShipping);
    element.append(form);
  }
}
  
// Function to toggle the modal
export function toggleModal(element) {
    const isExpanded = element.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      // If it's a cart modal and is being opened, refresh its content
      if (element.classList.contains('cart')) refreshCartContent(element);
      if (element.classList.contains('customize')) refreshCustomizeContent(element);
    }
    
    element.setAttribute('aria-expanded', !isExpanded);
    element.style.display = isExpanded ? 'none' : 'block';
}