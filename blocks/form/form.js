import { buildForm } from '../../utils/forms/forms.js';

const fields = [
  {
    type: 'input',
    label: 'First Name',
    name: 'firstName',
    placeholder: 'Enter your first name',
    required: true,
    // This validation should have only the extras, if any
    // to be added to a field that aren't already on the field itself
    validation: ['no-nums'],
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    type: 'tel',
    label: 'Phone Number',
    name: 'phone',
    placeholder: '000-000-0000',
    required: true,
    validation: ['phone:US'],
  },
  {
    type: 'textarea',
    label: 'How did you hear about us?',
    name: 'referralSource',
    placeholder: 'e.g., friend, social media, etc.',
    rows: 8,
    required: true,
  },
  {
    type: 'number',
    label: 'Quantity',
    name: 'quantity',
    min: 0,
    max: 100,
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
    required: true, // This will force native validation to make sure at least one radio is checked
  },
  {
    type: 'checkbox',
    label: 'want to pay with a gift card?',
    name: 'gift-card',
    checked: false,
  },
  {
    type: 'checkbox',
    label: 'Would you like to subscribe to our newsletter?',
    name: 'news-letter',
    checked: true,
    required: true,
  },
  {
    type: 'checkbox-group',
    label: 'Select payment options',
    name: 'payment-options',
    required: true,
    options: [
      {
        type: 'checkbox',
        label: 'Pay with gift card',
        value: 'gift-card',
        checked: false,
      },
      {
        type: 'checkbox',
        label: 'Pay with credit card',
        value: 'credit-card',
        checked: false,
      },
      {
        type: 'checkbox',
        label: 'Pay with PayPal',
        value: 'paypal',
        checked: false,
      },
    ],
  },
  {
    type: 'select',
    label: 'Country',
    name: 'country',
    required: true,
    options: [
      {
        label: 'United States',
        value: 'US',
        selected: false,
      },
      {
        label: 'Canada',
        value: 'CA',
        selected: false,
      },
      {
        label: 'United Kingdom',
        value: 'UK',
        selected: false,
      },
      {
        label: 'Australia',
        value: 'AU',
        selected: false,
      },
    ],
  },
  {
    type: 'date',
    label: 'Select Date',
    name: 'date',
    // min: '2024-10-01',
    // max: '2024-12-31',
    required: true,
  },
  {
    type: 'time',
    label: 'Select Time',
    name: 'time',
    min: '09:00', // Earliest allowable time
    max: '17:00', // Latest allowable time
    required: true,
  },
  {
    type: 'password',
    label: 'Password',
    name: 'password',
    placeholder: 'Enter your password',
    minLength: 8,
    maxLength: 20,
    required: true,
  },
  {
    type: 'submit',
    label: 'Submit',
    className: 'submit-button',
  },
];

export default function decorate(block) {
  function handleSubmit(formData) {
    // eslint-disable-next-line no-console
    console.log('formData from form: ', formData);
  }

  const form = buildForm(fields, handleSubmit);

  block.append(form);
}
