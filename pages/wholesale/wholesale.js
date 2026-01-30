/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-cycle */
import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';
import buildForm from '../../utils/forms/forms.js';
import { getOrderFormData } from '../../utils/order/order.js';

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

  const { pathname } = window.location;
  const isWholesaleTest = pathname.split('/').some((path) => path === 'wholesale-test');

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
      shouldDisplay = isWholesaleTest ? true : shouldDisplayWholesaleForm(open, close, currentTime);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
  return shouldDisplay;
}

function getFormFieldData(form) {
  const inputFields = {};
  const lineItems = [];

  const elements = form.querySelectorAll('input, select, textarea');

  elements.forEach((el) => {
    const { name, type, value } = el;

    switch (type) {
      case 'checkbox':
        inputFields[name] = el.checked;
        break;

      case 'radio':
        if (el.checked) {
          inputFields[name] = value;
        }
        break;

      case 'number': {
        const inputQuantity = Number(value);
        const { itemType } = el.dataset;

        if (inputQuantity > 0) {
          lineItems.push({
            item_id: el.id,
            quantity: inputQuantity,
            name: el.dataset.itemName,
            type: itemType,
          });
        }
        break;
      }

      case 'date':
      case 'time':
      case 'datetime-local':
        inputFields[name] = value || null;
        break;

      default:
        inputFields[name] = value;
    }
  });

  inputFields.lineItems = lineItems;

  return inputFields;
}

function setWholesaleLocalStorage() {
  // Try to read in existing wholesale data from localStorage
  // and if nothing exists yet, set as an empty object.
  const wholesaleLS = JSON.parse(localStorage.getItem('wholesale')) || {};

  // Get wholesale key for this page and set to lowercase.
  const wholesaleKey = JSON.parse(sessionStorage.getItem('wholesaleKey'))?.toLowerCase();

  // Throw error if there is no wholesale key
  if (!wholesaleKey) {
    // eslint-disable-next-line no-console
    console.log('No wholesaleKey found in sessionStorage');
    return;
  }

  // add key if it does not exist
  if (!wholesaleLS[wholesaleKey]) {
    wholesaleLS[wholesaleKey] = {};
    localStorage.setItem('wholesale', JSON.stringify(wholesaleLS));
  }
}

function resetWholesaleLocalStorageKeyData() {
  const wholesaleLS = JSON.parse(localStorage.getItem('wholesale')) || {};

  // Get wholesale key for this page and set to lowercase.
  const wholesaleKey = JSON.parse(sessionStorage.getItem('wholesaleKey'))?.toLowerCase();

  // Throw error if there is no wholesale key
  if (!wholesaleKey) {
    // eslint-disable-next-line no-console
    console.log('No wholesaleKey found in sessionStorage');
    return;
  }

  // add key if it does not exist
  if (wholesaleLS[wholesaleKey]) {
    wholesaleLS[wholesaleKey] = {};
    localStorage.setItem('wholesale', JSON.stringify(wholesaleLS));
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

export async function updateWholesaleGoogleSheet(params) {
  const url = `${window.location.origin}/admin/wholesale-locations.json`;
  const key = JSON.parse(sessionStorage.getItem('wholesaleKey'));

  let res;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const wholesaleItem = json.data.find((locationKey) => locationKey.LOCATION === key);
      if (wholesaleItem) {
        try {
          const qs = buildGQs(params);
          const path = new URL(wholesaleItem.LINK).pathname;

          const wholesaleScriptLinkRes = await fetch(`${wholesaleItem.SCRIPT_LINK}?${qs}`, { method: 'POST' });
          if (!wholesaleScriptLinkRes.ok) {
            throw new Error(`Error fetching wholesale script link: ${wholesaleScriptLinkRes.status}`);
          }

          const wholesalePrevRes = await fetch(`https://admin.hlx.page/preview/normal-icecream/site/main/${path}`, { method: 'POST' });
          if (!wholesalePrevRes.ok) {
            throw new Error(`Error posting to preview: ${wholesalePrevRes.status}`);
          }

          const wholesaleLiveRes = await fetch(`https://admin.hlx.page/live/normal-icecream/site/main/${path}`, { method: 'POST' });
          if (!wholesaleLiveRes.ok) {
            throw new Error(`Error posting to preview: ${wholesaleLiveRes.status}`);
          }

          return {
            ok: response.ok,
          };
        } catch (error) {
          return {
            ok: false,
            message: error.message,
          };
        }
      }
    }
  } catch (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return res;
}

async function buildWholesale(main, link) {
  // Set up localstorage for wholesale order management
  setWholesaleLocalStorage();
  getOrderFormData();

  const showOrderWholesaleForm = await fetchWholesaleHours();

  const wholesaleFormContainer = main.querySelector('.wholesale-form');

  if (showOrderWholesaleForm) {
    const closedToOrdersBlock = main.querySelector('.closed-to-orders');
    if (closedToOrdersBlock) closedToOrdersBlock.remove();

    const path = new URL(link).pathname;
    const key = JSON.parse(sessionStorage.getItem('wholesaleKey'));
    const title = document.getElementById('wholesale');
    if (title && key) title.textContent = `${title.textContent} ${key}`;

    const form = document.createElement('form');
    form.classList.add('table-form', 'wholesale-form');

    // Form handle submit
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const isValid = validateForm();
      if (isValid) {
        const placeOrderContainer = form.querySelector('.table-form-submit-wrapper');

        const placeOrderButton = form.querySelector('.table-form-submit-wrapper button');
        placeOrderButton.disabled = true;

        const processingMessage = document.createElement('div');
        processingMessage.textContent = 'we are processing your order..';
        processingMessage.className = 'processing-message';
        placeOrderContainer.append(processingMessage);

        const formData = getFormFieldData(form);

        let wholesaleNote = `email: ${formData.email || ''},\nphone #: ${formData.phone || ''},\nnote: ${formData.businessNote || ''}`;

        if (formData.orderType === 'pickup') {
          wholesaleNote += `,\npickup date: ${formData.pickupdate},\npickup time: ${formData.pickuptime}`;
        }

        const params = {
          business_name: formData.businessName || '',
          business_email: formData.email || '',
          business_note: wholesaleNote,
          is_wholesale_order: true,
          business_method: formData.orderType || '',
          line_items: formData.lineItems,
        };

        try {
          const processingOrder = await updateWholesaleGoogleSheet(params);

          const processingMessageDiv = form.querySelector('.table-form-submit-wrapper .processing-message');
          processingMessageDiv.remove();

          if (processingOrder) {
            const successMessage = document.createElement('div');
            successMessage.textContent = 'your order was successfully placed!';
            placeOrderContainer.append(successMessage);
          }

          resetWholesaleLocalStorageKeyData();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('error', error);
        }
      }
    });

    const block = buildBlock('table', '');
    block.dataset.src = `${window.location.origin}${path}`;
    block.classList.add('section');
    const blockContentSection = block.querySelector('.block > div > div');
    wholesaleFormContainer.appendChild(block);

    // This hits the table block and builds the form there
    decorateBlock(block);

    blockContentSection.append(form);

    const submitButton = createSubmitButton(main);
    await loadBlock(block);
    form.append(submitButton);
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
        sessionStorage.setItem('wholesaleKey', JSON.stringify(key));
        buildWholesale(main, wholesaleItem.LINK);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

async function handleBecomeWholesaler(formData) {
  const name = formData.find((data) => data.field === 'name').value;
  const businessName = formData.find((data) => data.field === 'businessName').value;
  const location = formData.find((data) => data.field === 'location').value;
  const email = formData.find((data) => data.field === 'email').value;
  const referralSource = formData.find((data) => data.field === 'referralSource').value;

  const subject = encodeURIComponent("hi! I'd like to become a wholesaler");
  const body = encodeURIComponent(
    `Name: ${name}\nBusiness Name: ${businessName}\nEmail: ${email}\nLocation: ${location}\nHow Did You Hear About Us: ${referralSource}`,
  );

  const mailtoLink = `mailto:wholesale@normal.club?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;

  // wholesale_inquiries script link
  const url = `${window.location.origin}/admin/script-links.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const wholesaleScriptData = json.data.find((link) => link.TYPE === 'wholesale_inquiry');
      // Set up data we want to send in wholesaler inquiry email and
      // to populate the wholesale-inquires sheet
      if (wholesaleScriptData) {
        const params = {
          name,
          inquiry_date: new Date(),
          business_name: businessName,
          location,
          email,
          referral_source: referralSource,
        };

        try {
          const form = document.querySelector('form');
          const qs = buildGQs(params);
          // Reset form
          form.reset();

          // Add interested party to sheet
          await fetch(`${wholesaleScriptData.SCRIPT_LINK}?${qs}`, { method: 'POST', mode: 'no-cors' });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error updating inventory:', error.message);
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
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

  const fullPath = window.location.href;
  const lastSegment = fullPath.substring(fullPath.lastIndexOf('/') + 1).split('?')[0];
  const key = getWholesaleKey(lastSegment)?.toUpperCase();

  if (key) {
    fetchWholesaleKey(main, key);
  } else {
    const becomeWholesalerSection = wholesaleContainer.querySelector('.columns > div > div');
    const becomeWholesalerForm = buildForm(fields, handleBecomeWholesaler, becomeWholesalerSection);
    becomeWholesalerSection.append(becomeWholesalerForm);
  }
}
