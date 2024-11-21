import { loadCSS } from '../../scripts/aem.js';

//TODO - maybe add a should display required prop
function buildLabel(field) {
    const label = document.createElement('label');
    label.textContent = field.required === true ? `${field.label} *` : field.label;
    return label;
}

function showError(container, errorMessages) {
    const containerParent = container.closest('div[class^="form-"]');
    let errorContainer = containerParent.querySelector('.error-messages');
    if (!errorContainer) {
        // Create a new error container if one doesn't already exist
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-messages';
        containerParent.append(errorContainer);
    } else {
        // Clear existing error messages if the container already exists
        errorContainer.innerHTML = '';
    }

    // Append each error message as a separate span element
    errorMessages.forEach(msg => {
        const span = document.createElement('span');
        span.className = 'forms-error';
        span.textContent = msg;
        errorContainer.append(span);
    });
}

function clearError(container) {
    const containerParent = container.closest('div[class^="form-"]');
    const errorContainer = containerParent.querySelector('.error-messages');
    if (errorContainer) {
        errorContainer.remove(); // Remove the error messages container
    }
}

function validateCheckboxGroup(group) {
    const { checkboxes, validations, parent } = group; // Extract checkboxes, validations, and parent div
    let isValid = true;

    // Check for 'one-required' validation rule
    if (validations.includes('one-required')) {
        const isAnyChecked = checkboxes.some(checkbox => checkbox.checked);

        if (!isAnyChecked) {
            // Display error message on the parent container
            const errorMessages = ['Please select at least one option.'];
            showError(parent, errorMessages);
            isValid = false;
        } else {
            // Clear any previous error messages
            clearError(parent);
        }
    }

    return isValid;
}

function getCheckboxGroups(form) {
    const checkboxGroups = {};

    for (const element of form.elements) {
        if (element.type === 'checkbox') {
            const groupName = element.name;
            if (!groupName) continue;

            if (!checkboxGroups[groupName]) {
                const checkboxes = Array.from(form.elements).filter(
                    (el) => el.type === 'checkbox' && el.name === groupName
                );

                if (checkboxes.length > 1) {
                    const parentDiv = element.closest('div');
                    let validations = [];

                    if (parentDiv && parentDiv.dataset.validation) {
                        try {
                            validations = JSON.parse(parentDiv.dataset.validation);
                        } catch (e) {
                            console.warn(
                                `Invalid JSON in data-validation for ${groupName}`,
                                parentDiv.dataset.validation
                            );
                        }
                    }

                    checkboxGroups[groupName] = {
                        checkboxes,
                        validations,
                        parent: parentDiv
                    };
                }
            }
        }
    }

    return checkboxGroups;
}

// TODO - fix issue with multiple errors displaying for tel type
function validateInput(input) {
    input.setCustomValidity('');
    let errorMessages = [];
    let isValid = true;

    // Run built-in validation and gather messages
    if (input.validationMessage) {
        errorMessages.push(input.validationMessage);
    }

    // Retrieve and parse rules
    const validationRules = JSON.parse(input.dataset.validation || '[]');
    validationRules.forEach(rule => {
        if (rule === 'no-nums' && /\d/.test(input.value)) {
            errorMessages.push("Numbers are not allowed.");
        }
        
        if (rule === 'phone:US' && /\d/.test(input.value)) {
            const digitsOnly = input.value.replace(/\D/g, '');
        
            if (digitsOnly.length < 10) { 
                errorMessages.push(`Missing ${10 - digitsOnly.length} digit${digitsOnly.length === 9 ? '' : 's'}`); 
            } 
            
            if (digitsOnly.length > 10){
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
    const checkboxGroups = getCheckboxGroups(form);

    // Validate each checkbox group
    Object.values(checkboxGroups).forEach(group => {
        const groupValid = validateCheckboxGroup(group);
        if (!groupValid) {
            isValid = false;
        }
    });

    // Get all grouped checkbox elements
    const groupedCheckboxes = Object.values(checkboxGroups).flatMap((group) => group.checkboxes);

    // Exclude grouped checkboxes from formInputs
    const inputsExcludingCheckboxGroups = formInputs.filter((input) => !groupedCheckboxes.includes(input));
    inputsExcludingCheckboxGroups.forEach((input) => {
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
        input.min = field.min
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
    textarea.name = field.name || '';  // Sets name attribute
    textarea.placeholder = field.placeholder || '';  // Sets placeholder if provided
    textarea.value = field.value || '';  // Sets default value if provided

    // Apply additional properties if they exist
    if (field.required) textarea.required = true;
    if (field.rows) textarea.rows = field.rows;  // Number of visible rows
    if (field.cols) textarea.cols = field.cols;  // Number of visible columns
    if (field.maxLength) textarea.maxLength = field.maxLength;  // Max length for input

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
        
        field.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value || '';  // Sets value for option
            optionElement.textContent = option.label || '';  // Sets text content for option
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
    // Create the fieldset element to group the radio buttons
    const fieldset = document.createElement('fieldset');

    // Iterate through the options to create radio buttons and labels
    field.options.forEach((option) => {
        const radioLabel = buildLabel(option);
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = field.name;
        radio.value = option.value;

        // Set required attribute if specified
        if (field.required) radio.required = true;

        // Prepend the radio input to its label
        radioLabel.prepend(radio);

        // Append the label (with radio input) to the fieldset
        fieldset.appendChild(radioLabel);
    });

    return fieldset;
}

function buildCheckboxGroup(field) {
    const checkboxGroupWrapper = document.createElement('div');

    // Add validation rules as a data attribute
    if (field.validation && Array.isArray(field.validation)) {
        checkboxGroupWrapper.dataset.validation = JSON.stringify(field.validation);
    }

    field.options.forEach((option) => {
        if (field.required && !field.validation.includes('one-required')) {
            option.required = field.required
        };
    
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
export function buildForm(fields, handleSubmit) {
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
            const data = {};
            const formFields = document.querySelectorAll('input, select, textarea');
    
            formFields.forEach((field) => {
                // Now process data for valid fields
                if (field.type === 'radio' && field.checked) {
                    data[field.name] = field.value;
                } else if (field.type === 'checkbox') {
                    if (data[field.name] === undefined) {
                        data[field.name] = field.checked ? (field.value === 'on' ? true : field.value) : false;
                    } else {
                        // Convert to array if multiple checkboxes with same name
                        if (!Array.isArray(data[field.name])) {
                            data[field.name] = data[field.name] ? [data[field.name]] : [];
                        }
                        // Add checked value only
                        if (field.checked) {
                            data[field.name].push(field.value);
                        }
                    }
                } else {
                    data[field.name] = field.value;
                }
    
            });

            handleSubmit(data);
            }
        });

    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/utils/forms/forms.css`);

    // Return form
    return form;
}