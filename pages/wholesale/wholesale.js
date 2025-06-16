/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-cycle */
import { removeLeadingZero } from '../../helpers/helpers.js';
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';
import buildForm from '../../utils/forms/forms.js';
// eslint-disable-next-line import/no-cycle
import { wholesaleOrderForm, resetOrderForm } from '../../utils/order/order.js';
import { createLineItem } from '../cart/cart.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';
import { getCatalog } from '../../scripts/scripts.js';

function buildModal(element, refresh) {
  const wholesaleModal = document.createElement('div');
  wholesaleModal.classList.add('wholesale', 'modal');
  createModal(wholesaleModal);
  element.append(wholesaleModal);

  toggleModal(wholesaleModal, 'your wholesale order', refresh);
}

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
    placeholder: 'Enter your business name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Location',
    name: 'location',
    placeholder: 'Enter your location',
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

function convertDecimalToTime(decimalTime) {
  const totalMinutes = decimalTime * 24 * 60; // Convert day fraction to minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function combineDayHours(data) {
  const combined = {};
  data.forEach(({ day, type, time }) => {
    if (!combined[day]) {
      combined[day] = { open: null, close: null };
    }

    if (type === 'open') {
      combined[day].open = time;
    } else if (type === 'close') {
      combined[day].close = time;
    }
  });
  return combined;
}

function convertToTotalMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + (minutes || 0); // Convert hours/minutes into total minutes
}

function shouldDisplayWholesaleForm(open, close, currentTime) {
  if (open === 'true' && close === 'false') {
    return true;
  }

  if (open === 'false' && close === 'false') {
    return false;
  }

  if (open !== 'true' && open !== 'false') {
    const openTime = convertToTotalMinutes(open);
    return currentTime > openTime;
  }

  if (close !== 'true' && close !== 'false') {
    const closeTime = convertToTotalMinutes(close);
    return currentTime <= closeTime;
  }

  return false;
}

async function fetchWholesaleHours() {
  const url = `${window.location.origin}/admin/store-hours.json`;
  let shouldDisplay = false;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const reformattedData = [];
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const status = ['open', 'close'];
      json.data.forEach((item) => {
        const day = days.find((key) => (item.TIME.includes(key) ? key : ''));
        const type = status.find((key) => (item.TIME.includes(key) ? key : ''));

        reformattedData.push({
          day,
          type,
          // eslint-disable-next-line no-restricted-globals
          time: isNaN(item.WHOLESALE)
            ? item.WHOLESALE
            : convertDecimalToTime(parseFloat(item.WHOLESALE)),
        });
      });

      const operatingHours = combineDayHours(reformattedData);
      const now = new Date();
      const dayName = days[now.getDay()];

      // eslint-disable-next-line prefer-const
      let { open, close } = operatingHours[dayName];

      const currentTime = now.getHours() * 60 + now.getMinutes();
      shouldDisplay = shouldDisplayWholesaleForm(open, close, currentTime);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
  return shouldDisplay;
}

// eslint-disable-next-line consistent-return
async function fetchWholesaleDeliveryMethods() {
  const url = `${window.location.origin}/admin/wholesale-locations.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const wholesaleKey = JSON.parse(sessionStorage.getItem('wholesaleKey'));
      const deliverMethods = json.data.find((location) => location.LOCATION === wholesaleKey);
      return deliverMethods.DELIVERY_METHOD;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

async function buildWholesale(main, link) {
  const showOrderWholesaleForm = await fetchWholesaleHours();

  if (showOrderWholesaleForm) {
    const path = new URL(link).pathname;
    const wholesaleHeroHeader = main.querySelector('div');

    const key = JSON.parse(sessionStorage.getItem('wholesaleKey'));
    const title = document.getElementById('wholesale');
    if (title && key) title.textContent = `${title.textContent} ${key}`;

    const form = document.createElement('form');
    form.classList.add('table-form', 'wholesale-form');

    // Form handle submit
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const isValid = validateForm();
      if (isValid) {
        const inputs = form.querySelectorAll('input[type="number"]');

        const lineItems = [];
        inputs.forEach(async (input) => {
          // If input value isn't empty or zero, add to formData
          if (input.value > 0) {
            const item = (await getCatalog()).byId[input.id];
            const lineItem = await createLineItem(item.id, removeLeadingZero(input.value));
            lineItems.push(lineItem);
            lineItem.note = input.dataset.itemName;
            lineItem.type = input.dataset.itemType;
          }
        });
        const wholesaleModal = document.querySelector('.wholesale.modal');
        /* eslint-disable-next-line no-inner-declarations */
        function refreshWholesaleContent(element) {
          const modalContentSection = element.querySelector('.modal-content');
          modalContentSection.innerHTML = '';

          const modalErrorContainer = element.querySelector('.modal-wholesale-content-container');
          if (modalErrorContainer) modalErrorContainer.remove();

          wholesaleOrderForm({
            line_items: lineItems,
            deliveryMethods: wholesaleDeliveryMethods,
          }, element);
        }

        if (!wholesaleModal) {
          buildModal(main, refreshWholesaleContent);
        } else {
          toggleModal(wholesaleModal, 'your wholesale order', refreshWholesaleContent);
        }
      }
    });

    const block = buildBlock('table', '');
    block.dataset.src = `${window.location.origin}${path}`;
    block.classList.add('section');
    const blockContentSection = block.querySelector('.block > div > div');
    wholesaleHeroHeader.after(block);
    decorateBlock(block);

    blockContentSection.append(form);

    const submitButton = createSubmitButton(main);
    await loadBlock(block);
    form.append(submitButton);
  } else {
    const wholesaleHeroHeader = main.querySelector('.hero-header');

    const closedContainer = document.createElement('div');
    closedContainer.className = 'wholesale-closed-container';

    const closedMessage = document.createElement('h3');
    closedMessage.className = 'wholesale-closed-message';
    closedMessage.textContent = 'Wholesale orders are closed right now';
    closedContainer.append(closedMessage);

    const closedMessageContext = document.createElement('p');
    closedMessageContext.className = 'wholesale-closed-message';

    const email = 'hi@normal.club';
    const subject = 'Wholesale Ice Cream Inquiry!';

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    const linkElement = document.createElement('a');
    linkElement.href = mailtoLink;
    linkElement.textContent = 'hi@normal.club';

    closedMessageContext.textContent = 'are you having an ice cream emergency? email us, we\'ll do whatever we can to assist :) ';
    closedMessageContext.append(linkElement);
    closedContainer.append(closedMessageContext);

    wholesaleHeroHeader.after(closedContainer);
  }
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
        sessionStorage.setItem('wholesaleKey', JSON.stringify(key))
        buildWholesale(main, wholesaleItem.LINK);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

export function buildGQs(params) {
  let qs = '';
  Object.keys(params).forEach((key) => {
    if (key in params) {
      if (key === 'line_items') {
        qs += `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
      } else {
        qs += `${key}=${encodeURIComponent(params[key])}`;
      }
      qs += '&';
    }
  });
  return qs;
}

export async function updateWholesaleGoogleSheet(orderData, orderFormFields, invoiceId) {
  const url = `${window.location.origin}/admin/wholesale-locations.json`;
  const key = JSON.parse(sessionStorage.getItem('wholesaleKey'));

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const wholesaleItem = json.data.find((locationKey) => locationKey.LOCATION === key);
      if (wholesaleItem) {
        const params = {
          business_name: orderFormFields.businessName,
          business_note: orderFormFields.businessNote,
          business_method: orderFormFields.getItShipped ? 'delivery' : 'pickup',
          reference_id: invoiceId,
          line_items: orderData.line_items,
        };

        params.line_items.forEach((p) => {
          p.name = p.note;
          delete p.base_price_money;
          delete p.id;
          delete p.item_type;
          delete p.note;
        });

        try {
          const qs = buildGQs(params);
          const path = new URL(wholesaleItem.LINK).pathname;

          await fetch(`${wholesaleItem.SCRIPT_LINK}?${qs}`, { method: 'POST' });
          await fetch(`https://admin.hlx.page/preview/normal-icecream/site/main/${path}`, { method: 'POST' });
          await fetch(`https://admin.hlx.page/live/normal-icecream/site/main/${path}`, { method: 'POST' });

          // Reset form
          resetOrderForm();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error updating inventory:', error);
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
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
    error.classList.add('error-messages');
    error.textContent = message;
    submitButton.append(error);

    input.addEventListener('input', function clearPasswordError() {
      inputParent.classList.remove('invalid');
      if (error) error.remove();
      input.removeEventListener('input', clearPasswordError); // Remove event to avoid multiple triggers
    });
  }
}

/**
* Sets up wholesale static table block structure
*/
export async function decorateWholesale(main) {
  // Add wholesale class due to new routes
  main.classList.add('wholesale');

  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/wholesale/wholesale.css`);

  const wholesaleContainer = main.querySelector('.columns');

  function getWholesaleKey(str) {
    return str.split('-')[1];
  }

  const key = getWholesaleKey(window.location.href.substring(window.location.href.lastIndexOf('/') + 1))?.toUpperCase();

  if (key) { 
    fetchWholesaleKey(main, key); 
  } else {
    function handleBecomeWholesaler(formData) {
      const name = formData.find((data) => data.field === 'name').value;
      const businessName = formData.find((data) => data.field === 'businessName').value;
      const location = formData.find((data) => data.field === 'location').value;
      const email = formData.find((data) => data.field === 'email').value;
      const referralSource = formData.find((data) => data.field === 'referralSource').value;
  
      const subject = encodeURIComponent("hi! I'd like to become a wholesaler");
      const body = encodeURIComponent(
        `Name: ${name}\nBusiness Name: ${businessName}\nEmail: ${email}\nLocation: ${location}\nHow Did You Hear About Us: ${referralSource}`,
      );
  
      const mailtoLink = `mailto:hi@normal.club?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
    }
  
    const becomeWholesalerSection = wholesaleContainer.querySelector('.columns > div > div');
    const becomeWholesalerForm = buildForm(fields, handleBecomeWholesaler, becomeWholesalerSection);
    becomeWholesalerSection.append(becomeWholesalerForm);
  }
}
