import { loadCSS } from '../../scripts/aem.js';

function buildLabel(field) {
  const label = document.createElement('label');
  label.textContent = field.required === true ? `${field.label} *` : field.label;
  return label;
}

// Helper functions to show and clear error messages
function showError(input, errorMessages) {
  // Check if the error container already exists next to the input
  let errorContainer = input.nextElementSibling;
  if (!errorContainer || !errorContainer.classList.contains('error-messages')) {
    // Create a new error container if one doesn't already exist
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-messages';
    input.insertAdjacentElement('afterend', errorContainer);
  } else {
    // Clear existing error messages if the container already exists
    errorContainer.innerHTML = '';
  }

  // Append each error message as a separate span element
  errorMessages.forEach((msg) => {
    const span = document.createElement('span');
    span.className = 'forms-error';
    span.textContent = msg;
    errorContainer.append(span);
  });
}

function clearError(input) {
  const existingError = input.nextElementSibling;
  if (existingError && existingError.classList.contains('error-messages')) {
    existingError.remove();
  }
}

function validateInput(input) {
  input.setCustomValidity('');
  const errorMessages = [];
  let isValid = true;

  // Run built-in validation and gather messages
  if (input.validationMessage) {
    errorMessages.push(input.validationMessage);
  }

  // Retrieve and parse rules
  const validationRules = JSON.parse(input.dataset.validation || '[]');
  validationRules.forEach((rule) => {
    if (rule === 'no-nums' && /\d/.test(input.value)) {
      errorMessages.push('Numbers are not allowed.');
    }

    if (rule === 'phone:US' && /\d/.test(input.value)) {
      const digitsOnly = input.value.replace(/\D/g, '');

      if (digitsOnly.length < 10) {
        errorMessages.push(`Missing ${10 - digitsOnly.length} digit${digitsOnly.length === 9 ? '' : 's'}`);
      }

      if (digitsOnly.length > 10) {
        errorMessages.push('There should only be 10 digits in this entry.');
      }
    }
  });

  // Set custom validity if there are any errors
  if (errorMessages.length > 0) {
    isValid = false;
    input.setCustomValidity(errorMessages.join('\n')); // This will trigger :invalid
    showError(input, errorMessages);
  } else {
    clearError(input);
  }

  return isValid;
}

function validateForm(form) {
  let isValid = true;

  // Loop through all form inputs
  const formInputs = Array.from(form.elements);
  formInputs.forEach((input) => {
    // Skip non-input elements like buttons
    if (input.type !== 'submit' && input.type !== 'button') {
      const inputValid = validateInput(input);
      if (!inputValid) {
        isValid = false; // Mark the form as invalid if any field fails
      }
    }
  });

  return isValid;
}

function buildInput(field) {
  const input = document.createElement('input');
  input.type = field.type || 'text';
  input.name = field.name || '';
  input.placeholder = field.placeholder || '';

  if (field.value !== undefined && field.value !== null) {
    input.value = field.value;
  }

  if (field.min !== undefined && field.min !== null) {
    input.min = field.min;
  }

  // Apply additional properties if they exist
  if (field.required) input.required = true;
  if (field.minLength) input.minLength = field.minLength;
  if (field.maxLength) input.maxLength = field.maxLength;
  if (field.max) input.max = field.max;

  // Add validation rules as a data attribute
  if (field.validation && Array.isArray(field.validation)) {
    input.dataset.validation = JSON.stringify(field.validation);
  }

  input.addEventListener('change', () => {
    input.classList.add('touched');
    validateInput(input);
  });

  return input;
}

function buildTextArea(field) {
  const textarea = document.createElement('textarea');
  textarea.name = field.name || ''; // Sets name attribute
  textarea.placeholder = field.placeholder || ''; // Sets placeholder if provided
  textarea.value = field.value || ''; // Sets default value if provided

  // Apply additional properties if they exist
  if (field.required) textarea.required = true;
  if (field.rows) textarea.rows = field.rows; // Number of visible rows
  if (field.cols) textarea.cols = field.cols; // Number of visible columns
  if (field.maxLength) textarea.maxLength = field.maxLength; // Max length for input

  textarea.addEventListener('change', () => {
    textarea.classList.add('touched');
    validateInput(textarea, field);
  });

  return textarea;
}

function buildSelect(field) {
  const select = document.createElement('select');
  select.name = field.name || ''; // Sets name attribute

  if (field.required) select.required = field.required;
  if (field.value) select.value = field.value;

  if (field.options && Array.isArray(field.options)) {
    const placeholder = document.createElement('option');
    placeholder.value = ''; // An empty value
    placeholder.textContent = 'Select an option'; // Placeholder text
    placeholder.selected = true;
    placeholder.disabled = true;
    select.append(placeholder);

    field.options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value || ''; // Sets value for option
      optionElement.textContent = option.label || ''; // Sets text content for option
      if (option.selected) optionElement.selected = option.selected;
      select.appendChild(optionElement);
    });
  }

  select.addEventListener('change', () => {
    select.classList.add('touched');
    validateInput(select, field);
  });

  return select;
}

function buildRadio(field) {
  const radioWrapper = document.createElement('div');

  field.options.forEach((option) => {
    const radioLabel = buildLabel(option);
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = field.name;
    radio.value = option.value;

    if (field.required) radio.required = true;

    radioLabel.prepend(radio);
    radioWrapper.append(radioLabel);
  });

  return radioWrapper;
}

function buildCheckboxGroup(field) {
  const checkboxGroupWrapper = document.createElement('div');

  field.options.forEach((option) => {
    if (field.required) option.required = field.required;

    const input = buildInput(option);
    input.name = field.name;
    const checkboxLabel = buildLabel(option);

    checkboxLabel.prepend(input);
    checkboxGroupWrapper.append(checkboxLabel);
  });

  return checkboxGroupWrapper;
}

function buildSubmitButton(field) {
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = field.className || '';
  submit.textContent = field.label || 'Submit';

  return submit;
}

function buildWrapper(field) {
  const wrapper = document.createElement('div');
  wrapper.className = `form-${field.type}`;
  return wrapper;
}

function buildField(field) {
  const wrapper = buildWrapper(field);
  let label = buildLabel(field);
  let input;

  switch (field.type) {
    case 'input':
      input = buildInput(field);
      break;

    case 'email':
      input = buildInput(field);
      break;

    case 'tel':
      input = buildInput(field);
      break;

    case 'date':
      input = buildInput(field);
      break;

    case 'time':
      input = buildInput(field);
      break;

    case 'number':
      input = buildInput(field);
      break;

    case 'password':
      input = buildInput(field);
      break;

    case 'textarea':
      input = buildTextArea(field);
      break;

    case 'select':
      input = buildSelect(field);
      break;

    case 'radio':
      input = buildRadio(field);
      break;

    case 'checkbox':
      input = buildInput(field);
      if (field.checked) input.checked = field.checked;
      break;

    case 'checkbox-group':
      input = buildCheckboxGroup(field);
      break;

    case 'submit':
      label = '';
      input = buildSubmitButton(field);
      break;

    default:
      console.log(`Field type ${field.type} not supported`);
      break;
  }

  wrapper.append(label, input);
  return wrapper;
}

// TODO - add info on function and what it does
// eslint-disable-next-line no-unused-vars
export default function buildForm(fields, handleSubmit) {
  const form = document.createElement('form');
  // This allows us to set up custom error handling and styling
  form.noValidate = true;

  // Build form input for each field in fields, then add to form
  fields.forEach((field) => {
    const formField = buildField(field);
    form.append(formField);
  });

  // Form submit handler
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true;
    isValid = validateForm(form);

    if (isValid) {
      console.log('hit form submit in form');
    }

    // input.setCustomValidity('')
    // event.submitter = disabled - use this to prevent users from clicking submit a million times
    // const formInputs = form.elements;
    // const isValid = validateForm(form);

    // Array.from(formInputs).forEach((input) => {
    //      validateInput(input);
    // console.log("isValid:", isValid);

    //     input.setCustomValidity('');
    //     let errorMessages = [];

    //     // Run built-in validation and gather messages
    //     if (input.validationMessage) {
    //         errorMessages.push(input.validationMessage);
    //     }

    //     // Set custom validity if there are any errors
    //     if (errorMessages.length > 0) {
    //         isValid = false;
    //         input.setCustomValidity(errorMessages.join('\n')); // This will trigger :invalid
    //         showError(input, errorMessages);
    //     } else {
    //         clearError(input);
    //     }

    // console.log('isValid', isValid)

    // if ( isValid ) {
    //     console.log('hit form submit in form')
    //     const data = {};
    //     const formFields = document.querySelectorAll('input, select, textarea');

    //     formFields.forEach((field) => {
    //         // Now process data for valid fields
    //         if (field.type === 'radio' && field.checked) {
    //             data[field.name] = field.value;
    //         } else if (field.type === 'checkbox') {
    //             if (data[field.name] === undefined) {
    //                 data[field.name] = field.checked ? (field.value === 'on' ? true : field.value) : false;
    //             } else {
    //                 // Convert to array if multiple checkboxes with same name
    //                 if (!Array.isArray(data[field.name])) {
    //                     data[field.name] = data[field.name] ? [data[field.name]] : [];
    //                 }
    //                 // Add checked value only
    //                 if (field.checked) {
    //                     data[field.name].push(field.value);
    //                 }
    //             }
    //         } else {
    //             data[field.name] = field.value;
    //         }

    //     })
    //     handleSubmit(data);
    // }
  });

  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/utils/forms/forms.css`);

  // Return form
  return form;
}
