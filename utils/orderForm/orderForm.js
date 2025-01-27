import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import buildForm from '../forms/forms.js';

class SquareSandboxOrderData {
  constructor({ line_items, state, discounts }) {
      this.line_items = line_items;
      this.state = state || 'OPEN';
      // this.discounts = discounts ? discounts.map(discount => new Discount(discount)) : [];
  }

  build() {
      return {
          line_items: this.line_items,
          state: this.state,
          // discounts: this.discounts,
      };
  }
}

// class SquareOrderData {
//   constructor({ line_items, state, customer_id, discounts }) {
//       this.location_id = location_id;
//       this.line_items = line_items;
//       // this.discounts = discounts ? discounts.map(discount => new Discount(discount)) : [];
//   }

//   build() {
//       return {
//           location_id: this.location_id,
//           line_items: this.line_items,
//           state: this.state,
//           // discounts: this.discounts,
//       };
//   }
// }

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
      address: '',
      address2: '',
      city: '',
      state: '',
      zipcode: '',
      getItShipped: '',
    }));
  }
  
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
  
  async function createSquareOrder(formData) {
    const env = getEnvironment();

    // eslint-disable-next-line no-console
    if (env === 'sandbox') {
      // console.log("cartData:", cartData);
      cartData.line_items.forEach((item) => {
        // console.log("item:", item);
        item.quantity = String(item.quantity);
        delete item.catalog_object_id;
      });
      
      console.log("cartData:", cartData);
       
      const orderData = new SquareSandboxOrderData(cartData);
      console.log("orderData:", orderData);
      const orderWrapper = new SquareOrderWrapper(orderData);
      console.log("orderWrapper:", orderWrapper);

      // TODO - need to set this up to read shipping selection from the merch context. 
      const locationQueryParam = '?location=sandbox';

      const order = await hitSandbox(createOrder, JSON.stringify(orderWrapper), locationQueryParam);
      console.log("order:", order);
    } else {
      // const orderData = new SquareOrderData(cartData);
      // const order = await createOrder(orderData);
      // console.log("order:", order);
    }
  }

  // const orderData = JSON.parse(localStorage.getItem('orderFormData'));
  // console.log("orderData:", orderData);
  // console.log("fields:", fields);
  const populatedFields = populateFields(fields);
  // const populatedFields = populateFields(includeShipping ? shippingFields : fields);
  // TODO - need to add flag/logic to display shipping fields if applicable or if chosen by the user where applicable.
  const form = buildForm(populatedFields, createSquareOrder)
  form.className = 'cart-order-form';
  return form;
}