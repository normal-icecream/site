import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';

class SquareTaxData {
  constructor(data) {
    this.name = data.tax_data.name;
    this.percentage = data.tax_data.percentage;
    this.scope = 'ORDER'
    this.type = data.tax_data.inclusion_type;
  }

  build() {
    return {
      name: this.name,
      percentage: this.percentage,
      scope: this.scope,
      type: this.type,
    }
  }
}

class SquareOrderData {
  constructor(orderData, taxData) {
      this.line_items = orderData.line_items;
      this.state = orderData.state || 'OPEN';
      // this.discounts = discounts ? discounts.map(discount => new Discount(discount)) : [];
      this.taxes = new SquareTaxData(taxData).build();
  }

  build() {
      return {
          line_items: this.line_items,
          state: this.state,
          // discounts: this.discounts,
      };
  }
}

class SquareSandboxOrderData {
  constructor(orderData) {
  // constructor({ line_items, state, discounts }) {
      this.line_items = orderData.line_items;
      this.state = orderData.state || 'OPEN';
      // this.discounts = discounts ? discounts.map(discount => new Discount(discount)) : [];
      this.taxes = new SquareTaxData(orderData)
  }

  build() {
      return {
          line_items: this.line_items,
          state: this.state,
          // discounts: this.discounts,
      };
  }
}

class SquareOrderWrapper {
  constructor(data) {
    this.order = data;
  }

  build() {
    return {
      order: this.order,
    }
  }
}

// const alwaysVisibleFields = [
//   'name',
//   'phone',
//   'email',
//   'discountCode',
// ];

// const shippingFields = [
//   'address',
//   'address2',
//   'city',
//   'state',
//   'zipcode',
// ];

// const optionalFields = [
//   'getItShipped',
// ];

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
    label: 'pickup Date',
    name: 'pickupdate',
    // min: '2024-10-01',
    // max: '2024-12-31',
    // required: true,
  },
  {
    type: 'time',
    label: 'pickup Time',
    name: 'pickuptime',
    // min: '09:00', // Earliest allowable time
    // max: '17:00', // Latest allowable time
    // required: true,
  },
  // {
  //   type: 'checkbox',
  //   label: 'get it shipped?',
  //   name: 'getItShipped',
  //   value: 'getItShipped',
  //   required: true,
  // },
  {
    type: 'input',
    label: 'Your Address',
    name: 'address1',
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

// function getVisibleFields(fields, isShipped) {
//   console.log("fields:", fields);
//   const cartKey = getLastCartKey();

  // return fields.filter((field) => {
  //   // Always display fields in the alwaysVisibleFields group
  //   if (alwaysVisibleFields.includes(field.name)) {
  //     return true;
  //   }

  //   // Conditionally display shipping fields
  //   if (shippingFields.includes(field.name)) {
  //     if (cartKey === 'shipping' || (cartKey === 'merch' && isShipped)) {
  //       return true;
  //     }
  //     return false;
  //   }

  //   // Conditionally display the "get it shipped" checkbox
  //   if (optionalFields.includes(field.name)) {
  //     return cartKey === 'merch';
  //   }

  //   // Hide other fields by default
  //   return false;
  // });
// }


export function orderForm(cartData) {
  const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
  if (!orderFormData) {
    localStorage.setItem('orderFormData', JSON.stringify({
      name: '',
      phone: '',
      email: '',
      discountCode: '',
      date: '',
      time: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipcode: '',
      // TODO - use this get it shipped to determine if address should be added to payment request data
      getItShipped: true, // TODO - needs to be false by default
      // getItShipped: false,
    }));
  }
  
  const catalogList = window.catalog.taxes;
  console.log("catalogList:", catalogList);
  const taxes = catalogList.filter((item) => item.type === 'TAX')[0];
  console.log("taxes:", taxes);

  const populateFields = (fields) => {
    const formFieldsFromLocalStorage = JSON.parse(localStorage.getItem('orderFormData'));
    // const formFieldsFromLocalStorage = (localStorage.getItem('orderFormData', JSON.stringify(orderFormData)));
    // const visibleFields = getVisibleFields(formFieldsFromLocalStorage, formFieldsFromLocalStorage.getItShipped);
    // console.log("visibleFields:", visibleFields);

    return fields.map((field) => {
      const value = formFieldsFromLocalStorage[field.name] || '';
      
      return {
        ...field,
        value,
        oninput: (event) => {
          const newVal = event.target.value;
          formFieldsFromLocalStorage[field.name] = newVal;
          localStorage.setItem('orderFormData', JSON.stringify(formFieldsFromLocalStorage));
        }
      }
    })
  }
  
  async function createSquareOrder() {
    const env = getEnvironment();

    cartData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);
    });

    let newOrder;
    // eslint-disable-next-line no-console
    if (env === 'sandbox') {
      // TODO - remove this
      cartData.line_items.forEach((item) => {
        delete item.catalog_object_id;
      });
       
      // const taxData = new SquareTaxData(taxes);
      const orderData = new SquareOrderData(cartData, taxes);
      console.log("orderData:", orderData);
      // TODO - filter out id's on line items

      const orderWrapper = new SquareOrderWrapper(orderData);
      
      // console.log("taxData:", taxData);
      // orderWrapper.object.taxes = [taxData];
      
      console.log("orderWrapper:", orderWrapper);
      // newOrder = await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox');
      // console.log("newOrder:", newOrder);
      
    } else {
      const orderData = new SquareOrderData(cartData);
      // const order = await createOrder(orderData);
      // console.log("order:", order);
      
      // TODO - need to set this up to read shipping selection from the merch context. 
      // const locationQueryParam = '?location=sandbox';
      
      // newOrder = await createOrder(JSON.stringify(orderWrapper), '?location=sandbox');
      // console.log("newOrder:", newOrder);
    }

    if (newOrder) {
      const cartModal = document.querySelector('.modal.cart');
      console.log("cartModal:", cartModal);
      toggleModal(cartModal);
      
      const paymentsModal = document.querySelector('.modal.payments');
      toggleModal(paymentsModal, newOrder);
    } else {
      // throw user an error
      console.log('error with creating an order');
    }
  }
  
  // const orderData = JSON.parse(localStorage.getItem('orderFormData'));
  // console.log("orderData:", orderData);
  // console.log("fields:", fields);
  const populatedFields = populateFields(fields);
  // const populatedFields = populateFields(includeShipping ? shippingFields : fields);
  // TODO - need to add flag/logic to display shipping fields if applicable or if chosen by the user where applicable.
  const form = buildForm(populatedFields, createSquareOrder)
  form.className = 'form cart-order-form';
  return form;
}