import { getCart } from '../../pages/cart/cart.js';
import { loadCSS } from '../../scripts/aem.js';

// Function to create a modal
export function createModal(element, title = '', content = '') {
    loadCSS(`${window.hlx.codeBasePath}/utils/modal/modal.css`);
    
    element.classList.add('modal');
    element.setAttribute('aria-expanded', 'false');
    element.style.display = 'none';

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    element.append(modalTitle);

    if (element.classList.contains('cart')) {
      element.append(getCart());
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
function refreshCartContent(element) {
  const cartContent = element.querySelector('.cart.card-wrapper');
  cartContent.remove();

  const currentCart = getCart();
  element.append(currentCart);
}
  
// Function to toggle the modal
export function toggleModal(element) {
    const isExpanded = element.getAttribute('aria-expanded') === 'true';

    if (!isExpanded && element.classList.contains('cart')) {
      // If it's a cart modal and is being opened, refresh its content
      refreshCartContent(element);
    }
    
    element.setAttribute('aria-expanded', !isExpanded);
    element.style.display = isExpanded ? 'none' : 'block';
}