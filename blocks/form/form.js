import buildForm from '../../utils/forms/forms.js';

const fields = [
  {
    type: 'input',
    label: 'First Name',
    name: 'firstName',
    placeholder: 'Enter your first name',
    required: true,
    // This validation should have only the extras,
    // if any to be added to a field that aren't already on the field itself
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Last Name',
    name: 'lastName',
    placeholder: 'Enter your last name',
    required: true,
    // This validation should have only the extras,
    // if any to be added to a field that aren't already on the field itself
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
    // This validation should have only the extras,
    // if any to be added to a field that aren't already on the field itself
    validation: ['phone:US'],
  },
  // {
  //   type: 'textarea',
  //   label: 'How did you hear about us?',
  //   name: 'referralSource',
  //   placeholder: 'e.g., friend, social media, etc.',
  //   required: true,
  // },
  {
    type: 'number',
    label: 'Quantity',
    name: 'quantity',
    min: 1,
    max: 100,
    value: 0, // default value
    required: true,
  },
  {
    type: 'radio',
    label: 'Select a flavor',
    name: 'flavor',
    // This will force native validation to make sure at least one radio is checked
    required: true,
    options: [
      { label: 'Vanilla' },
      { label: 'Chocolate' },
      { label: 'Strawberry' },
      { label: 'Dulce de leche' },
    ],
  },
  {
    type: 'radio',
    label: 'Select a topping',
    name: 'topping',
    options: [
      { label: 'Sprinkles' },
      { label: 'Pickles' },
      { label: 'Snickers', value: 'i snicker at you' },
      {
        label: 'Cinnamon sticks',
        value: 'cinnamon-sticks',
      },
    ],
  },
  {
    type: 'checkbox',
    label: 'want to pay with a gift card?',
    name: 'giftCard',
    value: 'giftCard',
    required: true,
  },
  {
    type: 'checkbox',
    label: 'Would you like to subscribe to our newsletter?',
    name: 'subscribe',
    value: 'newsletter',
    checked: true,
    required: true,
  },
  {
    type: 'checkbox-group',
    label: 'Select payment options',
    name: 'paymentOptions',
    validation: ['one-required'],
    required: true,
    options: [
      {
        type: 'checkbox',
        label: 'Pay with gift card',
        value: 'gift-card',
      },
      {
        type: 'checkbox',
        label: 'Pay with credit card',
        value: 'credit-card',
      },
      {
        type: 'checkbox',
        label: 'Pay with PayPal',
        value: 'paypal',
      },
    ],
  },
  {
    type: 'checkbox-group',
    label: 'Select syrup options',
    name: 'syrup',
    options: [
      {
        type: 'checkbox',
        label: 'Maple',
        value: 'maple',
        checked: true,
      },
      {
        type: 'checkbox',
        label: 'Chocolate',
        value: 'chocolate',
      },
      {
        type: 'checkbox',
        label: 'Caramel',
        value: 'caramel',
      },
    ],
  },
  {
    type: 'select',
    label: 'Country',
    name: 'country',
    placeholder: 'Select an option',
    required: true,
    options: [
      {
        label: 'United States',
        value: 'US',
      },
      {
        label: 'Canada',
        value: 'CA',
      },
      {
        label: 'United Kingdom',
        value: 'UK A',
      },
      {
        label: 'Australia',
        value: 'AU',
      },
    ],
  },
  {
    type: 'select',
    label: 'Pick up location',
    name: 'pickupLocation',
    placeholder: 'Select an option',
    required: true,
    options: [
      {
        label: 'Store',
        selected: true,
      },
      {
        label: 'Spaceship',
      },
      {
        label: 'Truck',
      },
      {
        label: 'Warehouse',
      },
      {
        label: 'Harmons',
        value: 'harmons grocery',
      },
    ],
  },
  {
    type: 'date',
    label: 'Select Date',
    name: 'date',
    min: '2024-10-01',
    max: '2024-12-31',
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
    required: true,
  },
  {
    type: 'submit',
    label: 'Place Order',
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
