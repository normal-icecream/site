import { loadCSS } from '../../scripts/aem.js';

function createModalTitle(title) {
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  return modalTitle;
}

// Function to toggle the modal
export function toggleModal(element, refresh, data = null) {
  const isExpanded = element.getAttribute('aria-expanded') === 'true';

  if (!isExpanded) refresh(element, data);

  element.setAttribute('aria-expanded', !isExpanded);
  element.style.display = isExpanded ? 'none' : 'block';
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
  closeModalButton.textContent = 'x';
  closeModalButton.className = 'modal-close-btn';
  closeModalButton.addEventListener('click', () => toggleModal(element));
  element.append(closeModalButton);

  return element;
}
