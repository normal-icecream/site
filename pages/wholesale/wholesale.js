/* eslint-disable import/prefer-default-export */
import { removeLeadingZero } from '../../helpers/helpers.js';
import { buildBlock, loadCSS } from '../../scripts/aem.js';
import buildForm from '../../utils/forms/forms.js';
import { toggleModal } from '../../utils/modal/modal.js';
import { wholesaleOrderForm } from '../../utils/order/order.js';
import { createLineItem } from '../cart/cart.js';

function createSubmitButton() {
  // Create submit button wrapper
  const submitButtonWrapper = document.createElement('div');
  submitButtonWrapper.className = 'table-form-submit-wrapper';

  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'place order';

  submitButtonWrapper.append(submitButton);
  return submitButtonWrapper;
}

function showError(errorMessages) {
  const submitContainer = document.querySelector('.table-form-submit-wrapper');

  // Check if an error container already exists
  const errorContainer = submitContainer.querySelector('.error-messages');

  if (!errorContainer) {
    submitContainer.classList.add('invalid');

    const errorMessagesDiv = document.createElement('div');
    errorMessagesDiv.className = 'error-messages';
    errorMessages.forEach((message) => {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      errorMessagesDiv.append(messageDiv);
    });

    submitContainer.append(errorMessagesDiv);
  }
}

function clearError() {
  const submitContainer = document.querySelector('.table-form-submit-wrapper');
  submitContainer.classList.remove('invalid');

  const errorContainer = submitContainer.querySelector('.error-messages');
  if (errorContainer) {
    errorContainer.remove();
  }
}

function validateForm() {
  let isValid = true;
  const formFields = Array.from(document.querySelectorAll('input'));
  const errorMessages = [];

  const hasEntry = formFields.some((field) => field.value > 0);
  if (!hasEntry) {
    isValid = false;
    errorMessages.push('Please enter at least one valid quantity or value to submit.');
    showError(errorMessages);
  } else {
    isValid = true;
    clearError();
  }
  return isValid;
}

const fields = [
  {
    type: 'input',
    label: 'Your Name',
    name: 'name',
    placeholder: 'Enter your name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Business Name',
    name: 'businessName',
    placeholder: 'Enter your businesses name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Location',
    name: 'location',
    placeholder: 'Enter your businesses name',
    required: true,
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    type: 'textarea',
    label: 'How did you hear about us?',
    name: 'referralSource',
    placeholder: 'e.g., friend, social media, etc.',
  },
];

const passwordFields = [
  {
    type: 'password',
    label: 'Password',
    name: 'password',
    placeholder: 'Enter your password',
    required: true,
  },
  {
    type: 'submit',
    label: 'enter password',
  },
];

/**
* Sets up wholesale static table block structure
*/
export async function decorateWholesale(main) {
  const wholesaleContainer = main.querySelector('div');
  wholesaleContainer.classList.add('wholesale');

  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/wholesale/wholesale.css`);

  function handleBecomeWholesaler() {}
  // function handleBecomeWholesaler(formData) {
  // console.log('formData:', formData);
  // console.log('hit become wholesaler function');
  // }

  function handleLoginWholesaler() {}
  // function handleLoginWholesaler(formData) {
  // console.log('formData:', formData);
  // console.log('hit login wholesaler function');
  // }

  const becomeWholesalerSection = wholesaleContainer.querySelector('.columns > div > div:first-of-type');
  const becomeWholesalerForm = buildForm(fields, handleBecomeWholesaler, becomeWholesalerSection);
  becomeWholesalerSection.append(becomeWholesalerForm);

  const alreadyWholesalerSection = wholesaleContainer.querySelector('.columns > div > div:last-of-type');
  const alreadyWholesalerForm = buildForm(
    passwordFields,
    handleLoginWholesaler,
    alreadyWholesalerSection,
  );
  alreadyWholesalerSection.append(alreadyWholesalerForm);

  const link = main.querySelector('a[href]');
  if (link.href.endsWith('wholesale.json')) {
    const parentDiv = link.closest('div');

    const form = document.createElement('form');
    form.classList.add('table-form', 'wholesale-form');

    // Form handle submit
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isValid = validateForm();
      if (isValid) {
        const inputs = form.querySelectorAll('input[type="number"]');

        const lineItems = [];
        inputs.forEach(({ id, value, dataset }) => {
          // If input value isn't empty or zero, add to formData
          if (value > 0) {
            const item = window.catalog.byId[id];
            const lineItem = createLineItem(item.id, removeLeadingZero(value));
            lineItems.push(lineItem);
            lineItem.note = dataset.itemName;
          }
        });
        const wholesaleModal = document.querySelector('.wholesale.modal');

        /* eslint-disable-next-line no-inner-declarations */
        function refreshWholesaleContent(element) {
          const modalContentSection = element.querySelector('.modal-content');
          modalContentSection.innerHTML = '';
          wholesaleOrderForm({ line_items: lineItems }, wholesaleModal);
        }
        toggleModal(wholesaleModal, 'your wholesale order', refreshWholesaleContent);
      }
    });

    const block = buildBlock('table', '');
    block.dataset.src = link.href;

    block.append(form);
    parentDiv.append(block);

    const submitButton = createSubmitButton();
    form.append(submitButton);

    const unusedDivs = document.querySelector('.table > div');
    unusedDivs.remove();

    const p = link.closest('p');
    // Remove link
    p.remove();
  }
}
