/* eslint-disable import/prefer-default-export */
import { removeLeadingZero } from '../../helpers/helpers.js';
import { buildBlock, decorateBlock, loadBlock, loadCSS } from '../../scripts/aem.js';
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

async function buildWholesale(main, link) {
  const path = new URL(link).pathname;
    const blockParent = main.querySelector('div');

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
    block.dataset.src = `${window.location.origin}${path}`;
    const blockContentSection = block.querySelector('.block > div > div');
    blockParent.append(block);
    decorateBlock(block);
    
    blockContentSection.append(form);
    const submitButton = createSubmitButton();
    form.append(submitButton);

    await loadBlock(block);
}

async function fetchWholesaleKey(main, key) {
  const url = `${window.location.origin}/admin/wholesale-locations.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      if (json.data) {
        const wholesaleItem = json.data.find((locationKey) => locationKey.LOCATION === key);
        if (wholesaleItem) {
          buildWholesale(main, wholesaleItem.LINK);
          const columnsWrapper = main.querySelector('.columns-wrapper');
          columnsWrapper.style.display = 'none';

          const contactUs = main.querySelector('.default-content-wrapper:not(:first-of-type)');
          contactUs.style.display = 'none';
        }
      }
    } catch (error) {
      console.error(error.message);
    }
}

function handleError(input, message) {
  const inputParent = input.closest('form');
  const submitButton = inputParent.querySelector('.form-submit');
  const errorMessage = submitButton.querySelector('p');
  if (!errorMessage) {
    inputParent.classList.add('invalid');
    const error = document.createElement('p');
    error.classList.add('error-messages')
    error.textContent = message;
    submitButton.append(error);

    input.addEventListener("input", function clearError() {
      inputParent.classList.remove("invalid");
      if (error) error.remove();
      input.removeEventListener("input", clearError); // Remove event to avoid multiple triggers
    });
  }
}

/**
* Sets up wholesale static table block structure
*/
export async function decorateWholesale(main) {
  const wholesaleContainer = main.querySelector('div');
  wholesaleContainer.classList.add('wholesale');

  const key = JSON.parse(localStorage.getItem('wholesaleKey'));
  if (key) fetchWholesaleKey(main, key);

  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/wholesale/wholesale.css`);

  function handleBecomeWholesaler(formData) {
    const name = formData.find((data) => data.field === 'name').value;
    const businessName = formData.find((data) => data.field === 'businessName').value;
    const location = formData.find((data) => data.field === 'location').value;
    const email = formData.find((data) => data.field === 'email').value;
    const referralSource = formData.find((data) => data.field === 'referralSource').value;

    const subject = encodeURIComponent("Hi! I'd like to become a wholesaler");
    const body = encodeURIComponent(
      `Name: ${name}\nBusiness Name: ${businessName}\nEmail: ${email}\nLocation: ${location}\nHow Did You Hear About Us: ${referralSource}`
    );

    const mailtoLink = `mailto:hi@normal.club?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  }

  async function handleLoginWholesaler(formData) {
    const url = `${window.location.origin}/admin/wholesale-locations.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      if (json.data) {
        const passwordField = main.querySelector('.form-password input');
        const correctPasswordItem = json.data.find((item) => item.PASSWORD === formData[0].value);
        if (correctPasswordItem) {
          buildWholesale(main, correctPasswordItem.LINK);
          localStorage.setItem('wholesaleKey', JSON.stringify(correctPasswordItem.LOCATION));
          window.location.reload();
        } else {
          handleError(passwordField, "Please enter a valid password")
        }
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  const alreadyWholesalerSection = wholesaleContainer.querySelector('.columns > div > div:first-of-type');
  const alreadyWholesalerForm = buildForm(
    passwordFields,
    handleLoginWholesaler,
    alreadyWholesalerSection,
  );
  alreadyWholesalerForm.classList.add('wholesale-password-form');
  alreadyWholesalerSection.append(alreadyWholesalerForm);

  const becomeWholesalerSection = wholesaleContainer.querySelector('.columns > div > div:last-of-type');
  const becomeWholesalerForm = buildForm(fields, handleBecomeWholesaler, becomeWholesalerSection);
  becomeWholesalerSection.append(becomeWholesalerForm);
}
