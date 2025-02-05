import { loadCSS } from '../../scripts/aem.js';
import { toKebabCase } from '../../helpers/helpers.js';
import { getCartLocation } from '../../pages/cart/cart.js';

/**
 * Creates a label element for a form field, indicating if the field is required.
 * @param {Object} field - The field configuration object.
 * @returns {HTMLLabelElement} A `<label>` element with appropriate text.
 */
function buildLabel(field) {
  const label = document.createElement('label');

  // Add an asterisk if the field is required
  label.textContent = field.required === true ? `${field.label} *` : field.label;

  return label; // Return the constructed label element
}

/**
 * Displays error messages for a specific form field and highlights the invalid state.
 * @param {HTMLElement} container - The container of the input field.
 * @param {string[]} errorMessages - Array of error messages to display.
 */
function showError(container, errorMessages) {
  const containerParent = container.closest('div[class^="form-"]'); // Locate the parent container
  containerParent.classList.add('invalid'); // Add an invalid class to the parent container

  // Add invalid styling to the label
  const label = containerParent.querySelector('label');
  label.classList.add('label-invalid');

  // Check if an error container already exists
  let errorContainer = containerParent.querySelector('.error-messages');
  if (!errorContainer) {
    // Create a new error container if none exists
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-messages';
    containerParent.append(errorContainer);
  } else {
    // Clear existing error messages
    errorContainer.innerHTML = '';
  }

  // Append each error message as a separate span element
  errorMessages.forEach((msg) => {
    const span = document.createElement('span');
    span.textContent = msg;
    errorContainer.append(span);
  });
}

/**
 * Clears error messages and resets the invalid state for a form field.
 * @param {HTMLElement} container - The container of the input field.
 */
function clearError(container) {
  const containerParent = container.closest('div[class^="form-"]'); // Locate the parent container
  containerParent.classList.remove('invalid'); // Remove invalid class from the parent container

  // Remove invalid styling from the label
  const label = containerParent.querySelector('label');
  label.classList.remove('label-invalid');

  // Remove the error messages container if it exists
  const errorContainer = containerParent.querySelector('.error-messages');
  if (errorContainer) {
    errorContainer.remove(); // Remove the error messages container
  }
}

/**
 * Extracts groups of related checkboxes from a form, along with their validation rules and
 * parent container.
 * @param {HTMLFormElement} form - The form element containing the checkboxes.
 * @returns {Object} An object where each key is a group name, and the value is an object
 * containing:
 *  - {HTMLInputElement[]} checkboxes: Array of checkboxes in the group.
 *  - {string[]} validations: Array of validation rules for the group.
 *  - {HTMLElement} parent: The parent container element for the checkbox group.
 */
function getCheckboxGroups(form) {
  const checkboxGroups = {}; // Object to store grouped checkboxes

  // Iterate through all form elements
  Array.from(form.elements).forEach((element) => {
    if (element.type === 'checkbox') {
      const groupName = element.name;

      if (groupName) {
        // Check if the group has already been processed
        if (!checkboxGroups[groupName]) {
          // Find all checkboxes sharing the same group name
          const checkboxes = Array.from(form.elements).filter(
            (el) => el.type === 'checkbox' && el.name === groupName,
          );
          // Only consider groups with more than one checkbox
          if (checkboxes.length > 1) {
            const parentDiv = element.closest('div'); // Find the closest parent div
            let validations = [];
            // Extract validation rules from the parent div's data attribute
            if (parentDiv && parentDiv.dataset.validation) {
              try {
                validations = JSON.parse(parentDiv.dataset.validation); // Parse validation JSON
              } catch (e) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Invalid JSON in data-validation for ${groupName}`,
                  parentDiv.dataset.validation,
                );
              }
            }
            // Store the checkbox group with its details
            checkboxGroups[groupName] = {
              checkboxes, // The group of checkboxes
              validations, // Validation rules
              parent: parentDiv, // Parent container
            };
          }
        }
      }
    }
  });

  // Return the organized checkbox groups
  return checkboxGroups;
}

/**
 * Validates a group of checkboxes based on specified validation rules.
 * @param {Object} group - An object representing the checkbox group.
 * @returns {boolean} `true` if the checkbox group is valid; `false` otherwise.
 */
function validateCheckboxGroup(group) {
  // Extract relevant properties from the group object
  const { checkboxes, validations, parent } = group;
  let isValid = true;

  // Validation: Check if at least one checkbox is required to be selected
  if (validations.includes('one-required')) {
    const isAnyChecked = checkboxes.some((checkbox) => checkbox.checked);

    if (!isAnyChecked) {
      // If none are selected, add an error message to the parent container
      const errorMessages = ['Please select at least one option.'];
      showError(parent, errorMessages);
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Validates a single input element based on built-in and custom validation rules.
 * @param {HTMLInputElement} input - The input field to validate.
 * @returns {boolean} `true` if the input is valid; `false` otherwise.
 */
function validateInput(input) {
  input.setCustomValidity(''); // Reset any previous custom validity
  const errorMessages = []; // Array to collect error messages
  let isValid = true; // Tracks the validity of the input

  // Built-in validation: Check for any browser-detected issues
  if (!input.validity.valid) {
    errorMessages.push(input.validationMessage); // Add default validation message
  }

  // Custom validation rules: Parse from data-validation attribute
  const validationRules = JSON.parse(input.dataset.validation || '[]');
  validationRules.forEach((rule) => {
    // Rule: No numbers allowed
    if (rule === 'no-nums' && /\d/.test(input.value)) {
      errorMessages.push('Numbers are not allowed.');
    }

    if (rule === 'discount') {
      const discountsList = window.catalog.discounts;
      const cartLocation = getCartLocation();

      const location = window.catalog.locations.find((location) => location.name === cartLocation.toUpperCase());

      const discountsByLocation = discountsList.filter((discount) => {
        if (discount.present_at_all_locations) {
          return discount;
        } else {
          const discountLocations = discount.present_at_location_ids;
          const appliesToThisLocation = discountLocations.some((locationId) => locationId === location.id)
          if (appliesToThisLocation) return discount;
        }
      })
      const isValidDiscount = discountsByLocation.some((discount) => discount.discount_data.name === input.value);

      if (!isValidDiscount) {
        errorMessages.push('invalid discount code.');
      }
    }

    // Rule: US phone number validation
    if (rule === 'phone:US' && /\d/.test(input.value)) {
      const digitsOnly = input.value.replace(/\D/g, '');

      // Add error for missing digits
      if (digitsOnly.length < 10) {
        errorMessages.push(`Missing ${10 - digitsOnly.length} digit${digitsOnly.length === 9 ? '' : 's'}`);
      }

      // Add error for excess digits
      if (digitsOnly.length > 10) {
        errorMessages.push('There should only be 10 digits in this entry.');
      }
    }
  });

  // Apply error messages if validation failed
  if (errorMessages.length > 0) {
    isValid = false;
    input.setCustomValidity(errorMessages.join('\n')); // This will trigger :invalid
    showError(input, errorMessages);
  } else {
    clearError(input);
  }

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

/**
 * Validates all inputs and checkbox groups in a given form.
 * @param {HTMLFormElement} form - The form element to validate.
 * @returns {boolean} `true` if the form is valid; `false` otherwise.
 */
function validateForm(form) {
  let isValid = true;

  // Get all form inputs as an array
  const formInputs = Array.from(form.elements);

  // Retrieve grouped checkboxes based on specific criteria
  const checkboxGroups = getCheckboxGroups(form);

  // Validate each checkbox group
  Object.values(checkboxGroups).forEach((group) => {
    const groupValid = validateCheckboxGroup(group);
    if (!groupValid) {
      isValid = false;
    }
  });

  // Extract all grouped checkboxes into a flat array
  const groupedCheckboxes = Object.values(checkboxGroups).flatMap((group) => group.checkboxes);

  // Exclude grouped checkboxes from other form inputs
  const withoutCheckboxGroups = formInputs.filter((input) => !groupedCheckboxes.includes(input));
  withoutCheckboxGroups.forEach((input) => {
    // Skip non-input elements like buttons
    if (input.type !== 'submit' && input.type !== 'button' && input.type !== 'reset') {
      const inputValid = validateInput(input); // Validate individual input
      if (!inputValid) {
        isValid = false; // Mark the form as invalid if any field fails
      }
    }
  });

  // Return the overall validity of the form
  return isValid;
}

/**
 * Creates and returns an `<input>` element with specified attributes and behavior.
 * @returns {HTMLElement} A configured `<input>` element with event listeners.
 */
function buildInput(field) {
  const input = document.createElement('input');

  // Set standard attributes, with defaults where applicable
  input.type = field.type || 'text';
  input.name = field.name || '';
  input.placeholder = field.placeholder || '';
  input.value = (field.value || field.val) ?? '';
  input.min = field.min ?? '';

  // Apply additional optional attributes
  if (field.required) input.required = true;
  if (field.max) input.max = field.max;

  // Add validation rules as a data attribute
  if (field.validation && Array.isArray(field.validation)) {
    input.dataset.validation = JSON.stringify(field.validation);
  }

  // Trigger input validation when the user types into the field
  input.addEventListener('input', () => {
    validateInput(input); // Validate the current input
  });

  // Return the fully configured <input> element
  return input;
}

/**
 * Creates and returns a `<textarea>` element with specified attributes and behavior.
 * @param {Object} field - An object containing configuration for the textarea element.
 * @returns {HTMLElement} A configured `<textarea>` element with event listeners.
 */
function buildTextArea(field) {
  const textarea = document.createElement('textarea');
  textarea.name = field.name || ''; // Sets name attribute
  textarea.placeholder = field.placeholder || ''; // Sets placeholder if provided
  textarea.value = field.value || ''; // Sets default value if provided
  textarea.rows = 8;

  if (field.required) textarea.required = true;

  // Trigger input validation when the user types into the field
  textarea.addEventListener('input', () => {
    validateInput(textarea);
  });

  return textarea;
}

/**
 * Creates and returns a `<select>` element with options and validation behavior.
 * @param {Object} field - An object containing configuration for the select element.
 * @returns {HTMLElement} A configured `<select>` element with event listeners and options.
 */
function buildSelect(field) {
  const select = document.createElement('select');
  select.name = field.name || ''; // Sets name attribute

  // Add required and default value attributes if specified
  if (field.required) select.required = field.required;

  // Add options if provided
  if (field.options && Array.isArray(field.options)) {
    const placeholder = document.createElement('option');
    placeholder.value = field.value || '';
    placeholder.textContent = field.placeholder;
    placeholder.selected = true;
    placeholder.disabled = true;
    select.append(placeholder);

    field.options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value ? toKebabCase(option.value) : toKebabCase(option.label);
      optionElement.textContent = option.label || ''; // Sets text content for option
      if (option.selected) optionElement.selected = option.selected;
      select.appendChild(optionElement);
    });
  }

  // Trigger input validation when the user types into the field
  select.addEventListener('input', () => {
    validateInput(select);
  });

  return select;
}

/**
 * Creates and returns a labeled radio input element group based on the provided field.
 * @param {Object} field - An object containing configuration options for the radio.
 * @returns {HTMLElement} An element containing a radio input group and its associated label text.
 */
function buildRadio(field) {
  // Create the fieldset element to group the radio buttons
  const fieldset = document.createElement('fieldset');

  // Iterate through the options to create radio buttons and labels
  field.options.forEach((option) => {
    const radioLabel = buildLabel(option);
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = field.name;
    radio.value = option.value ? toKebabCase(option.value) : toKebabCase(option.label);

    // Set required attribute if specified
    if (field.required) radio.required = true;
    if (option.id) radio.id = option.id;
    if (radioLabel) {
      // Prepend the radio input to its label
      radioLabel.prepend(radio);
    }

    // Trigger input validation when the user types into the field
    radio.addEventListener('input', () => {
      validateInput(radio);
    });

    // Append the label (with radio input) to the fieldset
    fieldset.appendChild(radioLabel);
  });
  return fieldset;
}

/**
 * Creates and returns a labeled checkbox input element based on the provided field.
 * @param {Object} field - An object containing configuration options for the checkbox.
 * @returns {HTMLElement} A label element containing the checkbox input
 * and its associated label text.
 */
function buildCheckbox(field) {
  // Create the checkbox input element using a helper function
  const input = buildInput(field);

  // Set the name attribute for the checkbox
  input.name = field.name;

  if (field.checked) input.checked = true;

  const checkboxLabel = buildLabel(field);
  checkboxLabel.prepend(input);

  return checkboxLabel;
}

/**
 * Creates and returns a submit button element for a form.
 * @param {Object} field - An object containing configuration options for the button.
 * @returns {HTMLButtonElement} A submit button element with the specified label.
 */
function buildSubmitButton(field) {
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = field.label || 'Submit';
  return submit;
}

/**
 * Creates a group of checkboxes with labels, wrapped in a container element.
 * @param {Object} field - An object representing the checkbox group field.
 * @returns {HTMLDivElement} - A `<div>` element containing the checkbox group.
 */
function buildCheckboxGroup(field) {
  const checkboxGroupWrapper = document.createElement('div');

  // Add validation rules as a data attribute
  if (field.validation && Array.isArray(field.validation)) {
    checkboxGroupWrapper.dataset.validation = JSON.stringify(field.validation);
  }

  field.options.forEach((option) => {
    if (field.required && !field.validation.includes('one-required')) {
      option.required = field.required;
    }

    // Set each checkbox to have the name of it group
    option.name = field.name;

    // create checkbox element
    const checkbox = buildCheckbox(option);
    checkboxGroupWrapper.append(checkbox);
  });

  return checkboxGroupWrapper;
}

/**
 * Creates a wrapper `<div>` element for a form field.
 * @param {Object} field - An object representing a form field.
 * @returns {HTMLDivElement} - The created `<div>` element with the appropriate class name.
 */
function buildWrapper(field) {
  // Create a new <div> element to serve as the wrapper
  const wrapper = document.createElement('div');
  wrapper.className = `form-${field.type}`;
  return wrapper;
}

/**
 * Constructs a form field based on the provided configuration.
 * @param {Object} field - The configuration object for the field.
 * @returns {HTMLElement} - A DOM element representing the completed field.
 * Unsupported types will log a warning message.
 */
function buildField(field) {
  // Create a wrapper element for the field
  const wrapper = buildWrapper(field);

  // Create a label for the field
  let label = buildLabel(field);
  let input;

  // A switch statement to handle building different field types
  switch (field.type) {
    case 'input':
    case 'email':
    case 'tel':
    case 'date':
    case 'time':
    case 'number':
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
      label = '';
      input = buildCheckbox(field);
      break;

    case 'checkbox-group':
      input = buildCheckboxGroup(field);
      break;

    case 'submit':
      label = '';
      input = buildSubmitButton(field);
      break;

    default:
      // Log a message if the field type is unsupported
      // eslint-disable-next-line no-console
      console.log(`Field type ${field.type} not supported`);
      break;
  }

  // Append the label and input to the wrapper
  wrapper.append(label, input);

  // Return the completed field element
  return wrapper;
}

/**
 * This function checks if the `fields` array contains valid field definitions and if the
 * `handleSubmit` parameter is a valid function. If any validation fails, an error is
 * thrown with an appropriate message.
 * @param {Array} fields - An array of field configuration objects, each representing a
 * form input.
 * @param {Function} handleSubmit - A callback function to handle form submission.
 * @throws {Error} If `fields` is not a non-empty array or contains invalid field
 * definitions.
 * @throws {Error} If `handleSubmit` is not a function.
 */
function validateBuildFormInputs(fields, handleSubmit) {
  // Check if `fields` is a non-empty array
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('The "fields" parameter must be a non-empty array of field definitions.');
  }

  // Iterate over each field in the `fields` array
  fields.forEach((field, index) => {
    if (!field.type || typeof field.type !== 'string') {
      throw new Error(`Missing valid "type" property from config at index ${index}.`);
    }
    if ((!field.name || typeof field.name !== 'string') && field.type !== 'submit') {
      throw new Error(`Missing valid "name" property from config at index ${index}.`);
    }
    if (field.placeholder !== undefined && typeof field.placeholder !== 'string') {
      throw new Error(`Field at index ${index} has an invalid "placeholder" property. It must be a string.`);
    }
    if (['text', 'textarea'].includes(field.type) && !field.placeholder) {
      throw new Error(`Field at index ${index} of type "${field.type}" must include a "placeholder" property.`);
    }
    if (field.type === 'checkbox') {
      if ((!field.val || typeof field.val !== 'string')) {
        throw new Error(`Missing valid "value" property from config at index ${index}.`);
      }
    }
    if (field.type === 'select') {
      if (!field.placeholder) {
        throw new Error(`Missing valid "placeholder" property from config at index ${index}.`);
      }
      if (!field.options) {
        throw new Error(`Missing valid "options" property from config at index ${index}.`);
      }
      if (field.options.length > 0) {
        field.options.forEach((option, i) => {
          if (!option.label) {
            throw new Error(`Missing valid "label" property from config at index ${index}, options array index ${i}.`);
          }
        });

        const selectedOptions = field.options.filter((option) => option.selected);
        if (selectedOptions.length > 1) {
          throw new Error('Multiple selected options provided for a single-select dropdown. Please remove one of them.');
        }
      }
    }
    if (field.type === 'radio') {
      if (!field.options) {
        throw new Error(`Options array missing from ${field.name} radio.`);
      }

      if (field.options.length > 0) {
        field.options.forEach((option) => {
          if (!option.label) {
            throw new Error('Label is missing from option');
          }
        });
      }
    }
    if (field.type === 'checkbox-group') {
      if (!field.options) {
        throw new Error(`Options array missing from ${field.name} checkbox group.`);
      } else {
        field.options.forEach((option) => {
          if (!option.type) {
            throw new Error('"Type" is missing from option');
          }

          if (!option.val) {
            throw new Error('"Value" is missing from option');
          }

          if (!option.label) {
            throw new Error('"Label" is missing from option');
          }
        });
      }
    }
  });

  // Check if `handleSubmit` is a function
  if (typeof handleSubmit !== 'function') {
    throw new Error('The "handleSubmit" parameter must be a function.');
  }
}

/**
 * Constructs a dynamic HTML form based on provided field definitions and handles form submission.
 * @param {Array} fields - An array of objects where each object defines a form field.
 * @param {Function} handleSubmit - A callback function to handle the form data on submission.
 * @returns {HTMLFormElement} - The dynamically constructed form element.
 */
export default function buildForm(fields, handleSubmit, scopedElement) {
  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/utils/forms/forms.css`);

  // Validate inputs before proceeding
  validateBuildFormInputs(fields, handleSubmit);

  // Create the <form> element
  const form = document.createElement('form');
  form.className = 'form';

  // Disable browser's default validation UI in favor of custom validation logic and styling
  form.noValidate = true;

  // If no submit button is provided, add one
  const hasSubmit = fields.some((field) => field.type === 'submit');
  if (!hasSubmit) {
    fields.push({
      type: 'submit',
      label: 'Submit',
    });
  }

  // Loop through each field definition and dynamically build its corresponding form input
  fields.forEach((field) => {
    const formField = buildField(field);

    // Attach event listeners dynamically
    if (field.oninput) {
      formField.addEventListener('input', field.oninput);
    }

    form.append(formField);
  });

  // Attach an event listener to handle form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let isValid = true;
    isValid = validateForm(form); // Perform custom validation on the form

    if (isValid) {
      const data = []; // Initialize an object to store form data
      const formFields = Array.from(scopedElement.querySelectorAll('input, select, textarea'));
      
      // Filter out unchecked radio inputs
      const filteredFormFields = formFields.filter(field => {
          if (field.type === 'radio') {
            return field.checked; // Keep only checked radios
          }
          return true; // Keep all other field types
      });

      filteredFormFields.forEach((field) => {
        if (field.type === 'radio') {
          const radioData = {
            field: field.name,
            value: field.value
          }

          if (field.id) radioData.id = field.id;
          data.push(radioData);
        } else if (field.type === 'checkbox') {
            const existingEntry = data.find(entry => entry.name === field.name);

            if (!existingEntry) {
                data.push({
                  field: field.name,
                  value: field.checked ? (field.value !== 'on' ? field.value : true) : false
                });
            } else if (field.checked) {
                // Convert to array if there are multiple checkboxes with the same name
                if (!Array.isArray(existingEntry.value)) {
                    existingEntry.value = [existingEntry.value];
                }
                existingEntry.value.push(field.value);
            }
        } else {
            data.push({
              field: field.name,
              value: field.value
            });
        }
      })

      // Pass the collected form data to the provided handleSubmit callback
      handleSubmit(data);
    }
  });

  // Return form
  return form;
}
