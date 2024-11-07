import { loadCSS } from '../../scripts/aem.js';

// function validateForm() {}

function buildLabel(field) {
    const label = document.createElement('label');
    label.textContent = field.label;
    return label;
}

function buildInput(field) {
    const input = document.createElement('input');
    input.type = field.type || 'text';
    input.name = field.name || '';
    input.placeholder = field.placeholder || '';

    if (field.value !== undefined && field.value !== null) {
        input.value = field.value;
    }

    // Apply additional properties if they exist
    if (field.required) input.required = true;
    if (field.pattern) input.pattern = field.pattern;
    if (field.minLength) input.minLength = field.minLength;
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.min) input.min = field.min;
    if (field.max) input.max = field.max;

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

    return textarea;
}

function buildSelect(field) {
    const select = document.createElement('select');
    select.name = field.name || '';  // Sets name attribute

    if (field.required) select.required = true;
    if (field.value) select.value = field.value;

    if (field.options && Array.isArray(field.options)) {
        field.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value || '';  // Sets value for option
            optionElement.textContent = option.label || '';  // Sets text content for option

            // If the option is selected by default, set the "selected" attribute
            if (option.selected) optionElement.selected = true;

            select.appendChild(optionElement);
        });
    }

    return select;
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
            const radioWrapper = document.createElement('div');

            field.options.forEach((option) => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = field.name;
                radio.value = option.value;
                const radioLabel = buildLabel(option);

                radioLabel.prepend(radio);
                radioWrapper.append(radioLabel);
            });

            input = radioWrapper;
        break;
    
        case 'checkbox':
            input = buildInput(field);
            input.checked = false;
        break;
    
        case 'checkbox-group':
            const checkboxGroupWrapper = document.createElement('div');

            field.options.forEach((option) => {
                const input = buildInput(option);
                const checkboxLabel = buildLabel(option);
    
                checkboxLabel.prepend(input);
                checkboxGroupWrapper.append(checkboxLabel);
            });

            input = checkboxGroupWrapper;
        break;
    
        case 'submit':
            const submit = document.createElement('button');
            submit.type = 'submit';
            submit.className = field.className || '';
            submit.textContent = field.label || 'Submit';

            label = '';
            input = submit;
        break;
    
        default:
            console.log(`Field type ${field.type} not supported`);
        break;
    }

    wrapper.append(label, input);
    return wrapper;
}
    
export function buildForm(fields, submitHandler) {
    // Create form element
    const form = document.createElement('form');

    // Build form input for each field in fields, then add to form
    fields.forEach((field) => {
        const formField = buildField(field);
        form.append(formField);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log("event:", event);
        
        const data = {};
        const inputs = form.querySelectorAll('input');
        inputs.forEach((input) => {
            console.log("input:", input);
            
            if (input.type === 'radio' && input.checked) {
                data[input.name] = input.value;
            } else if (input.type !== 'radio') {
                data[input.name] = input.value;
            }
        });

        submitHandler(data);
    })

    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/utils/forms/forms.css`);

    // Return form
    return form;
}