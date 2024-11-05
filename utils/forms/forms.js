import { loadCSS } from '../../scripts/aem.js';

// function validateForm() {}

function buildLabel(field) {
    const label = document.createElement('label');
    label.textContent = field.label;
    return label;
}

// TODO - this should be changed to create any type of input??
function buildInput(field) {
    const input = document.createElement('input');
    input.type = field.type;
    input.name = field.name || '';
    input.placeholder = field.placeholder || '';
    input.required = !!field.required;

    // input.autocomplete = false;
    return input;
}

function buildSelect(field) {
    const select = document.createElement('select');
    select.name = field.name || '';
    return select
}

function buildTextArea(field) {
    const textArea = document.createElement('textarea');
    textArea.placeholder = field.placeholder || '';
    textArea.rows = field.rows || 4;
    textArea.cols = field.cols || 50;

    return textArea;
}

function buildWrapper(field) {
    const wrapper = document.createElement('div');
    wrapper.className = `form-${field.type}`;
    return wrapper;
}

function buildField(field) {
    const wrapper = buildWrapper(field);

    // TODO - Need to add/make better validation functions
    if (field.type === 'input') {
        const label = buildLabel(field);
        const input = buildInput(field);

        // QUESTION - add some kind of if label/if input exist then append to wrapper
        wrapper.append(label, input);
    } else if (field.type === 'tel') {
        const label = buildLabel(field);
        const input = buildInput(field);
        input.pattern = '[0-9]{3}-[0-9]{3}-[0-9]{4}';
        
        wrapper.append(label, input);
    } else if (field.type === 'password') {
        const label = buildLabel(field);
        const input = buildInput(field);
        input.minLength = field.minLength;

        wrapper.append(label, input);
    } else if (field.type === 'date') {        
        const label = buildLabel(field);
        const input = buildInput(field);
        if (field.min) input.min = field.min;
        // if (field.max) input.max = field.max;
        // Validation, cannot go in the past for year or to far in the future

        wrapper.append(label, input);
    } else if (field.type === 'time') {
        // TODO - need to either disable pop up or restyle it
        const label = buildLabel(field);
        const input = buildInput(field);
        if (field.min) input.min = field.min;
        if (field.max) input.max = field.max;

        wrapper.append(label, input);
    } else if (field.type === 'textarea') {
        const label = buildLabel(field);
        const textArea = buildTextArea(field);

        wrapper.append(label, textArea);
    } else if (field.type === 'number') {
        const label = buildLabel(field);
        const input = buildInput(field);
        input.value = field.value || 0;
        input.min = field.min || 0;
        input.max = field.max || 100;

        wrapper.append(label, input);
    } else if (field.type === 'radio') {
        const label = buildLabel(field);

        const optionWrapper = document.createElement('div');
        field.options.forEach((option) => {
            option.type = field.type;
            const radioInput = buildInput(option);
            const radioLabel = buildLabel(option);

            optionWrapper.append(radioInput, radioLabel);
        })

        wrapper.append(label, optionWrapper);
    } else if (field.type === 'checkbox') {
        const label = buildLabel(field);
        const input = buildInput(field);
        // TODO - some of these are in ifs and others have this || figure out the stronger one and we'll make all the others conform to that
        input.checked = field.checked || false;

        wrapper.append(input, label);
    } else if (field.type === 'select') {
        const label = buildLabel(field);
        const select = buildSelect(field);

        field.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });

        wrapper.append(label, select);
    }
    return wrapper
}
    
export function buildForm(fields) {
    // Create form element
    const form = document.createElement('form');

    // Build for field and add to form
    fields.forEach((field) => {
        const formField = buildField(field);
        form.append(formField);
    });

    // QUESTION - Maybe add this as another function??
    // Add onSubmit handler to form
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('hitting form on submit');

        const inputs = form.querySelectorAll('input');
        inputs.forEach((input) => {
            console.log(input.name)
            console.log(input.value)
        })
    })

    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/utils/forms/forms.css`);

    // Return form
    return form;
} 