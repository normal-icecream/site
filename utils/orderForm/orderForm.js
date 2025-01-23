import buildForm from '../forms/forms.js';

const fields = [
    {
      type: 'input',
      label: 'Your Name',
      name: 'name',
      placeholder: 'your name',
      required: true,
      validation: ['no-nums'],
    },
    {
      type: 'tel',
      label: 'Phone Number',
      name: 'phone',
      placeholder: 'your cell',
      required: true,
      validation: ['phone:US'],
    },
    {
      type: 'email',
      label: 'Email',
      name: 'email',
      placeholder: 'your email',
      required: true,
    },
    {
      type: 'input',
      label: 'Discount Code',
      name: 'discountCode',
      placeholder: 'your discount code',
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
];

const shippingFields = [
  {
    type: 'input',
    label: 'Your Name',
    name: 'name',
    placeholder: 'your name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'tel',
    label: 'Phone Number',
    name: 'phone',
    placeholder: 'your cell',
    required: true,
    validation: ['phone:US'],
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'your email',
    required: true,
  },
  {
    type: 'input',
    label: 'Discount Code',
    name: 'discountCode',
    placeholder: 'your discount code',
  },
  {
    type: 'input',
    label: 'Your Address',
    name: 'address',
    required: true,
    placeholder: 'your address',
  },
  {
    type: 'input',
    label: 'Your Apt # or building code',
    name: 'address2',
    placeholder: 'your apt# or building code? add here!',
  },
  {
    type: 'input',
    label: 'city',
    name: 'city',
    required: true,
    placeholder: 'your city',
  },
  {
    type: 'input',
    label: 'state',
    name: 'state',
    required: true,
    placeholder: 'your state',
  },
  {
    type: 'input',
    label: 'your zip code',
    name: 'zipcode',
    required: true,
    placeholder: 'your zip code',
  },
];

export function orderForm(includeShipping) {
  const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
  if (!orderFormData) {
    localStorage.setItem('orderFormData', JSON.stringify({
      name: '',
      phone: '',
      email: '',
      discountCode: '',
      date: '',
      time: '',
      address: '',
      address2: '',
      city: '',
      state: '',
      zipcode: '',
    }));
  }

  const populateFields = (fields) => {
    return fields.map((field) => {
      const value = orderFormData[field.name] || '';
      return {
        ...field,
        value,
        oninput: (event) => {
          const newVal = event.target.value;
          orderFormData[field.name] = newVal;
          localStorage.setItem('orderFormData', JSON.stringify(orderFormData));
        }
      }
    })
  }

  function handleSubmit(formData) {
    // eslint-disable-next-line no-console
    console.log('formData from form: ', formData);
  }

  const populatedFields = populateFields(includeShipping ? shippingFields : fields);
  const form = buildForm(populatedFields, handleSubmit)
  form.className = 'cart-order-form';
  return form;
}