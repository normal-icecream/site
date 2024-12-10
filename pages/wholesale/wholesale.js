/* eslint-disable import/prefer-default-export */
import { buildBlock, loadCSS } from '../../scripts/aem.js';

function createSubmitButton() {
  // Create submit button wrapper
  const submitButtonWrapper = document.createElement('div');
  submitButtonWrapper.className = 'table-form-submit-wrapper';

  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'add to cart';

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

  let errorContainer = submitContainer.querySelector('.error-messages');
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

/**
* Sets up wholesale static table block structure
*/
export async function decorateWholesale(main) {
  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/wholesale/wholesale.css`);

  const link = main.querySelector('a[href]');
  if (link.href.endsWith('wholesale.json')) {
    const parentDiv = link.closest('div');

    const form = document.createElement('form');
    form.className = 'table-form';

    // Form handle submit
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isValid = validateForm();
      if (isValid) {
        const formData = {};
        const inputs = form.querySelectorAll('input[type="number"]');
        inputs.forEach(({ id, value }) => {
          // If input value isn't empty or zero, add to formData
          if (value > 0) {
            formData[id] = {
              // TODO - Add whatever data we want to send
              quantity: value,
            };
          }
        });
        // Add data to cart
        // console.log("formData:", formData);
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
