// function validate() {}

export function buildForm(fields) {
    console.log('fields', fields);
    const form = document.createElement('form');

    fields.forEach((field) => {
        // let label;
        let inputField;

        if (field.label) {
            const labelElement = document.createElement('label');
            labelElement.textContent = field.label;
            form.append(labelElement);
        }

        // TODO - Need to add/make better validation functions
        if (field.type === 'input' || field.type === 'tel' || field.type === 'password') {
            inputField = document.createElement('input');
            inputField.type = field.validation === 'email' ? 'email' : field.type; // sets type to 'tel' for phone field
            inputField.placeholder = field.placeholder || '';
            inputField.required = field.required || false;
            inputField.name = field.name || '';
            if (field.type === 'tel' && field.pattern) {
                inputField.pattern = field.pattern; // adds pattern validation for phone
            }
            if (field.type === 'password' && field.minLength) {
                inputField.minLength = field.minLength; // Enforces minimum length for password
            }
        } else if (field.type === 'date' || field.type === 'time') {
            inputField = document.createElement('input');
            inputField.type = field.type; // This sets 'date' or 'time' as the input type
            inputField.name = field.name;

            // if (field.min) inputField.min = field.min;
            // if (field.max) inputField.max = field.max;
        }
        else if (field.type === 'textarea') {
            inputField = document.createElement('textarea');
            inputField.placeholder = field.placeholder || '';
            inputField.rows = field.rows || 4;
            inputField.cols = field.cols || 50;
            inputField.name = field.name || '';
        } else if (field.type === 'number') {
            inputField = document.createElement('input');
            inputField.type = 'number';
            inputField.min = field.min || 0;
            inputField.max = field.max || 100;
            inputField.value = field.value || 0;
            inputField.name = field.name || '';
        } else if (field.type === 'radio') {
            inputField = document.createElement('div');
            field.options.forEach(option => {
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = field.name;
                radioInput.value = option.value;
    
                const label = document.createElement('label');
                label.textContent = option.label;
                label.appendChild(radioInput);
                inputField.appendChild(label);
            });
        } else if (field.type === 'checkbox') {
            inputField = document.createElement('input');
            inputField.type = 'checkbox';
            inputField.checked = field.checked || false;
            inputField.name = field.name || '';
        } else if (field.type === 'select') {
            inputField = document.createElement('select');
            inputField.name = field.name || '';
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                inputField.appendChild(optionElement);
            });
        } else if (field.type === 'submit') {
            inputField = document.createElement('button');
            inputField.type = 'submit';
            inputField.className = field.className || '';
            inputField.textContent = field.label || 'Submit';
        }
    
        if (inputField) { form.append(inputField); }
    })

    return form;
} 