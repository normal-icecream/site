import { buildForm } from "../../utils/forms/forms.js";

const fields = [
    {
        type: 'input',
        label: 'First Name',
        name: 'firstName',
        placeholder: 'Enter your first name',
        validation: /^[A-Za-z]+$/, // Allows only letters
        required: true,
    },
    {
        type: 'input',
        label: 'Email',
        name: 'email',
        placeholder: 'Enter your email',
        validation: 'email', // or a function to validate email format
        required: true,
    },
    {
        type: 'tel',
        label: 'Phone Number',
        name: 'phone',
        // pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}', // pattern for phone number validation
        placeholder: '000-000-0000',
        required: true,
    },
    {
        type: 'textarea',
        label: 'How did you hear about us?',
        name: 'referralSource',
        placeholder: 'e.g., friend, social media, etc.',
        rows: 4,
        cols: 50,
        required: true,
    },
    {
        type: 'number',
        label: 'Quantity',
        name: 'quantity',
        min: 0,
        max: 100,
        step: 1,
        value: 0, // default value
        required: true,
    },
    {
        type: 'radio',
        label: 'Select a flavor',
        name: 'flavor',
        options: [
            { label: 'Vanilla', value: 'vanilla' },
            { label: 'Chocolate', value: 'chocolate' },
            { label: 'Strawberry', value: 'strawberry' },
        ],
        required: true,
    },
    {
        type: 'checkbox',
        label: 'want to pay with a gift card?',
        name: 'gift-card',
        checked: false,
        required: true,
    },
    {
        type: 'select',
        label: 'Country',
        name: 'country',
        options: [
            { label: 'United States', value: 'US' },
            { label: 'Canada', value: 'CA' },
            { label: 'United Kingdom', value: 'UK' },
            { label: 'Australia', value: 'AU' }
        ],
        required: true,
    },
    {
        type: 'date',
        label: 'Select Date',
        name: 'date',
        min: '2024-10-01', // Earliest allowable date
        max: '2024-12-31',  // Latest allowable date
        required: false,
    },
    {
        type: 'time',
        label: 'Select Time',
        name: 'time',
        min: '09:00', // Earliest allowable time
        max: '17:00',  // Latest allowable time
        required: false,
    },
    {
        type: 'password',
        label: 'Password',
        name: 'password',
        placeholder: 'Enter your password',
        minLength: 8,
        required: false,
    },
    {
        type: 'submit',
        label: 'Submit',
        className: 'submit-button',
    },
];

export default function decorate(block) {
    const form = buildForm(fields);
    block.append(form);
}