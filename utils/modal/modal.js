import { loadCSS } from '../../scripts/aem.js';

function createModalTitle(title) {
  const modalTitle = document.createElement('div');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = title;
  return modalTitle;
}

// Function to toggle the modal
export function toggleModal(element, title, refresh, data = null) {
  const isExpanded = element.getAttribute('aria-expanded') === 'true';

  if (title) {
    const modalTitle = element.querySelector('.modal-title');
    if (modalTitle) modalTitle.remove();

    const modalHeader = element.querySelector('.modal-header');
    modalHeader.prepend(createModalTitle(title));
  }

  if (!isExpanded) {
    refresh(element, data);
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  element.setAttribute('aria-expanded', !isExpanded);
  element.style.display = isExpanded ? 'none' : 'block';
}

// Function to create a modal
export function createModal(element, content = '') {
  loadCSS(`${window.hlx.codeBasePath}/utils/modal/modal.css`);

  element.classList.add('modal');
  element.setAttribute('aria-expanded', 'false');
  element.style.display = 'none';

  const modalContainer = document.createElement('div');
  const modalHeader = document.createElement('div');
  modalHeader.classList.add('modal-header');

  const closeModalButton = document.createElement('button');
  closeModalButton.textContent = 'x';
  closeModalButton.className = 'modal-close-btn';
  closeModalButton.addEventListener('click', () => toggleModal(element));
  modalHeader.append(closeModalButton);

  modalContainer.append(modalHeader);

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.append(content);

  modalContainer.append(modalContent);
  element.append(modalContainer);

  return element;
}
