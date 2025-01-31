import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import { getLastCartKey, getCartLocation } from '../../pages/cart/cart.js';
import { refreshCartContent } from '../../utils/modal/modal.js';

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

const addressFields = [
  'address1',
  'address2',
  'city',
  'state',
  'zipcode',
];

const pickupFields = [
  'pickupdate',
  'pickuptime',
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
  // {
  //   type: 'checkbox',
  //   label: 'want to pay with a gift card?',
  //   name: 'giftCard',
  //   val: 'giftCard',
  //   required: true,
  // },
  {
    type: 'checkbox',
    label: 'get it shipped?',
    name: 'getItShipped',
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


export function orderForm(cartData) {
  const env = getEnvironment();
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
      getItShipped: false,
    }));
  }

  const populateFields = (fields) => {
    const modal = document.querySelector('.modal.cart');
    const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
    const cartKey = getLastCartKey();
    
    const fieldsToDisplay = [];
    
    const visibleFields = [];
    alwaysVisibleFields.forEach((field) => {
      const visibleField = fields.find((f) => f.name === field);
      if (visibleField) visibleFields.push(visibleField);
    });
    visibleFields.forEach((field) => fieldsToDisplay.push(field))
    
    const storeFields = [];
    const shippingFields = [];
    addressFields.forEach((field) => {
      const shippingField = fields.find((f) => f.name === field);
      if (shippingField) shippingFields.push(shippingField);
    });
    
    if (cartKey === 'store') {
      pickupFields.forEach((field) => {
        const pickupField = fields.find((f) => f.name === field);
        if (pickupField) storeFields.push(pickupField);
      });
      storeFields.forEach((field) => fieldsToDisplay.push(field));
    } else if (cartKey === 'shipping') {
      shippingFields.forEach((field) => fieldsToDisplay.push(field));
    } else if (cartKey === 'merch') {
      const shouldShipField = fields.find((f) => f.name === 'getItShipped');
      fieldsToDisplay.push(shouldShipField);

      const shouldShip = JSON.parse(localStorage.getItem('orderFormData'))['getItShipped'];

      if (shouldShip) {
        pickupFields.forEach((field) => {
          const pickupFieldIndex = fieldsToDisplay.findIndex((f) => f.name === field.name);
          //  remove items then refresh cart
          if (pickupFieldIndex !== -1) {
            fieldsToDisplay.splice(pickupFieldIndex, 1); // Remove the field from "fieldsToDisplay"
          }
        });

        shippingFields.forEach((field) => fieldsToDisplay.push(field));
      } else {
        pickupFields.forEach((field) => {
          const pickupField = fields.find((f) => f.name === field);
          if (pickupField) fieldsToDisplay.push(pickupField);
        });
        
        shippingFields.forEach((field) => {
          const shippingFieldIndex = fieldsToDisplay.findIndex((f) => f.name === field.name);
          //  remove items then refresh cart
          if (shippingFieldIndex !== -1) {
            fieldsToDisplay.splice(shippingFieldIndex, 1); // Remove the field from "fieldsToDisplay"
          }
        });
      }
    }
    
    return fieldsToDisplay.map((field) => {
      const value = orderFormData[field.name] || '';
      return {
        ...field,
        value,
        checked: field.type === 'checkbox' ? Boolean(orderFormData[field.name]) : undefined,
        oninput: (event) => {
          if (event.target.type === 'checkbox') {
            orderFormData[field.name] = event.target.checked;
          } else {
            orderFormData[field.name] = event.target.value;
          }
          localStorage.setItem('orderFormData', JSON.stringify(orderFormData));
          refreshCartContent(modal);
        }
      }
    })
  }
  
  async function createSquareOrder() {
    cartData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);
    });

    const orderData = new SquareOrderData(cartData, window.catalog.taxes[0]).build();

    const discounts = [];
    if (orderFormData.discountCode) {
      const discount = window.catalog.discounts.find((discount) => discount.discount_data.name === orderFormData.discountCode);
      
      if (discount) {
        if(discount.discount_data.percentage) {
          discounts.push(new SquareDiscountPercentageData(discount).build());
        } 
        if (discount.discount_data.amount_money) {
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

    const cartLocation = getCartLocation();

    // TODO - should I hit calculate order API????

    // TODO - make sure that this location qp is sending/switching properly in prod env's
    const newOrder = env === 'sandbox' 
    ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox') 
    : await createOrder(JSON.stringify(orderWrapper), `?location=${cartLocation}`);
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