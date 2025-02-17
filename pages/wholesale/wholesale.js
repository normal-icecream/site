/* eslint-disable import/prefer-default-export */
import { buildBlock, loadCSS } from '../../scripts/aem.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';
import { wholesaleOrderForm } from '../../utils/orderForm/orderForm.js';
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
    form.classList.add('table-form', 'wholesale-form');

    const wholesaleModal = document.createElement('div');
    wholesaleModal.classList.add('wholesale-modal');
    createModal(wholesaleModal);
    form.append(wholesaleModal);

    // Form handle submit
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      console.log("event:", event.target.value);

      const isValid = validateForm();
      if (isValid) {
        // const formData = {};
        // const inputsTest = form.querySelectorAll('input');
        // console.log("inputsTest:", inputsTest);
        // const test = [];
        // inputsTest.forEach((field) => {
        //   console.log('field', field)
        //   console.log('field.name', field.name)
        // });
        // // Add data to cart
        // console.log("lineItems:", lineItems);
        // console.log("formData:", formData);

        const inputs = form.querySelectorAll('input[type="number"]');
        
        const lineItems = [];
        inputs.forEach(({id, value, dataset}) => {
          // If input value isn't empty or zero, add to formData
          if (value > 0) {
            const item = window.catalog.byId[id];
            const lineItem = createLineItem(item.id, value);
            lineItems.push(lineItem);
            lineItem.note = dataset.itemName;
            // lineItem.key = id;
          
            // formData[id] = {
            //   // TODO - Add whatever data we want to send
            //   quantity: value,
            // };
          }
        });
        console.log("lineItems:", lineItems);


        // const modalContentSection = element.querySelector('.wholesale-modal');

        function refreshWholesaleContent(formData) {
          console.log("formData:", formData);
          const wholesaleModal = document.querySelector('.wholesale-modal');
          const modalContentSection = wholesaleModal.querySelector('.modal-content');
          console.log("modalContentSection:", modalContentSection);

          // wholesaleModal.innerHTML = '';
          
          // const test = document.createElement('div');
          // test.textContent = 'TTTAAACCCCCCOOOOOOO';
          // wholesaleModal.append(test);
          wholesaleOrderForm({line_items: lineItems}, wholesaleModal)
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
