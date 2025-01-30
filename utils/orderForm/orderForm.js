import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import { getLastCartKey } from '../../pages/cart/cart.js';

class SquareDiscountAmount {
  constructor(data) {
    console.log("data:", data);
    this.amount = data.amount;
    this.currency = data.currency;
  }

  build() {
    return { 
      amount: this.amount,
      currency: this.currency
    }
  }
}

class SquareDiscountAmountData {
  constructor(data) {
    this.name = data.discount_data.name;
    this.amount_money = new SquareDiscountAmount(data.discount_data.amount_money).build();
    this.scope = 'ORDER'
    this.type = data.discount_data.discount_type;
  }

  build() {
    return {
      name: this.name,
      amount_money: this.amount_money,
      scope: this.scope,
      type: this.type,
    }
  }
}

class SquareDiscountPercentageData {
  constructor(data) {
    this.name = data.discount_data.name;
    this.percentage = data.discount_data.percentage;
    this.scope = 'ORDER'
    this.type = data.discount_data.discount_type;
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
      this.taxes = [new SquareTaxData(taxData).build()];
  }

  build() {
      return {
          line_items: this.line_items,
          state: this.state,
          taxes: this.taxes,
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

const alwaysVisibleFields = [
  'name',
  'phone',
  'email',
  'discountCode',
];

const shippingFields = [
  'address1',
  'address2',
  'city',
  'state',
  'zipcode',
];

const optionalFields = [
  'getItShipped',
];

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
    validation: ['discount'],
  },
  {
    type: 'date',
    label: 'pickup Date',
    name: 'pickupdate',
    // min: '2024-10-01',
    // max: '2024-12-31',
    required: true,
  },
  {
    type: 'time',
    label: 'pickup Time',
    name: 'pickuptime',
    // min: '09:00', // Earliest allowable time
    // max: '17:00', // Latest allowable time
    required: true,
  },
  {
    type: 'checkbox',
    label: 'want to pay with a gift card?',
    name: 'giftCard',
    value: 'giftCard',
    val: 'giftCard',
    required: true,
  },
  {
    type: 'checkbox',
    label: 'get it shipped?',
    name: 'getItShipped',
    value: 'get-it-shipped',
    val: 'get-it-shipped',
    required: false,
  },
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

function getVisibleFields(fields, isShipped) {
  console.log("fields:", fields);
  const cartKey = getLastCartKey();

  return Object.keys(fields).filter((field) => {
    console.log("field:", field);
    // Always display fields in the alwaysVisibleFields group
    if (alwaysVisibleFields.includes(field.name)) {
      return true;
    }

    // // Conditionally display shipping fields
    // if (shippingFields.includes(field.name)) {
    //   if (cartKey === 'shipping' || (cartKey === 'merch' && isShipped)) {
    //     return true;
    //   }
    //   return false;
    // }

    // // Conditionally display the "get it shipped" checkbox
    // if (optionalFields.includes(field.name)) {
    //   return cartKey === 'merch';
    // }

    // // Hide other fields by default
    return false;
  });
}


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

  const populateFields = (fields) => {
    const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
    // const orderFormData = (localStorage.getItem('orderFormData', JSON.stringify(orderFormData)));
    const visibleFields = getVisibleFields(orderFormData);
    console.log("visibleFields:", visibleFields);

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
  
  async function createSquareOrder() {
    const env = getEnvironment();

    cartData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);
    });



    const orderData = new SquareOrderData(cartData, window.catalog.taxes[0]).build();

    const discounts = [];
    if (orderFormData.discountCode) {
      const discount = window.catalog.discounts.find((discount) => discount.discount_data.name === orderFormData.discountCode);
      
      if (discount) {
        if(discount.discount_data.percentage) {
          console.log('hitting percentage')
          discounts.push(new SquareDiscountPercentageData(discount).build());
        } 
        if (discount.discount_data.amount_money) {
          console.log('hitting amount')
          discounts.push(new SquareDiscountAmountData(discount).build())
        }
      }
    }
    orderData.discounts = discounts;

    if (env === 'sandbox') {
      cartData.line_items.forEach((item) => {
        delete item.catalog_object_id;
      });
    }

    const orderWrapper = new SquareOrderWrapper(orderData).build(); 
    console.log("orderWrapper:", orderWrapper);

    // TODO - should I hit calculate order API????
    // TODO - Add qp logic

    const newOrder = env === 'sandbox' 
    ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox') 
    : await createOrder(JSON.stringify(orderWrapper), '?location=sandbox');
    console.log("newOrder:", newOrder);
    
    if (newOrder) {
      const cartModal = document.querySelector('.modal.cart');
      toggleModal(cartModal);
      
      const paymentsModal = document.querySelector('.modal.payments');
      toggleModal(paymentsModal, newOrder);
    } else {
      // throw user an error
      console.log('error with creating an order');
    }
  }
  
  const populatedFields = populateFields(fields);
  // const populatedFields = populateFields(includeShipping ? shippingFields : fields);
  // TODO - need to add flag/logic to display shipping fields if applicable or if chosen by the user where applicable.
  const form = buildForm(populatedFields, createSquareOrder)
  form.className = 'form cart-order-form';
  return form;
}