import { getCart, getLastCartKey, getLocalStorageCart } from '../../pages/cart/cart.js';
import { loadCSS } from '../../scripts/aem.js';
import { getCustomize } from '../customize/customize.js';
import { orderForm } from '../orderForm/orderForm.js'
import { getCardPaymentForm } from '../payments/payments.js';

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

  element.append(content);

  const closeModalButton = document.createElement('button');
  closeModalButton.textContent = 'X';
  closeModalButton.className = 'modal-close-btn';
  closeModalButton.addEventListener('click', () => toggleModal(element));
  element.append(closeModalButton);

  return element;
}

// Function to refresh the cart content
export function refreshPaymentsContent(element, orderData) {
  const paymentForm = element.querySelector('.card-payment-form');
  if (paymentForm) paymentForm.remove();

  getCardPaymentForm(element, orderData);
}

// Function to refresh the cart content
export function refreshCustomizeContent(element) {
  const customizeWrapper = element.querySelector('.customize');
  if (customizeWrapper) customizeWrapper.remove();
  
  const customizeContent = getCustomize(element);

  element.append(customizeContent);
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
    const cartKey = getLastCartKey();
    const cartLocalStorageData = getLocalStorageCart();
    const hasShipping = (cartKey === 'shipping' || cartKey === 'merch') ? true : false;

    const form = orderForm(cartLocalStorageData, hasShipping);
    element.append(form);
  }
}
  
// Function to toggle the modal
export function toggleModal(element, data = null) {
    const isExpanded = element.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      // If it's a cart modal and is being opened, refresh its content
      if (element.classList.contains('cart')) refreshCartContent(element);
      if (element.classList.contains('customize')) refreshCustomizeContent(element);
      if (element.classList.contains('payments')) refreshPaymentsContent(element, data);
    }
    
    element.setAttribute('aria-expanded', !isExpanded);
    element.style.display = isExpanded ? 'none' : 'block';
}