export function toggleModal(block) {
  const modalWrapper = block.closest('.modal-wrapper');
  const isExpanded = modalWrapper.getAttribute('aria-expanded') === 'true';

  modalWrapper.setAttribute('aria-expanded', !isExpanded);
  modalWrapper.style.display = isExpanded ? 'none' : 'block';
}

export default function decorate(block) {
  const variants = [...block.classList];

  const modalWrapper = block.closest('.modal-wrapper');
  modalWrapper.setAttribute('aria-expanded', 'false');
  modalWrapper.style.display = 'none';

  if (variants.includes('cart')) {
    const cartKey = window.location.pathname.split('/')[1];

    const div = document.createElement('div');
    div.textContent = cartKey;
    block.append(div);

    // Cart TODO's
    // Get cart
    // insert cart contents into modal body
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
