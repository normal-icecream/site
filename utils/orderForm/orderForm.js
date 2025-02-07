import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import { getLastCartKey, getCartLocation } from '../../pages/cart/cart.js';
import {
  SquareOrderWrapper,
  SquareDiscountAmountData,
  SquareDiscountPercentageData,
  SquareOrderData,
} from '../../constructors/constructors.js';

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

export function resetOrderForm() {
  const orderData = JSON.parse(localStorage.getItem('orderFormData'));

  if (orderData) {
    orderData.pickupdate = '';
    orderData.pickuptime = '';
    orderData.discountCode = '';
    orderData.getItShipped = false;
  }

  localStorage.setItem('orderFormData', JSON.stringify(orderData));
}

export function orderForm(cartData) {
  const env = getEnvironment();
  const modal = document.querySelector('.modal.cart');
  const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
  if (!orderFormData) {
    localStorage.setItem('orderFormData', JSON.stringify({
      name: '',
      phone: '',
      email: '',
      discountCode: '',
      pickupdate: '',
      pickuptime: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipcode: '',
      getItShipped: false,
    }));
  }

  const populateFields = (formFields) => {
    const orderFormFields = JSON.parse(localStorage.getItem('orderFormData'));
    const cartKey = getLastCartKey();

    const fieldsToDisplay = [];

    const visibleFields = [];
    alwaysVisibleFields.forEach((field) => {
      const visibleField = formFields.find((f) => f.name === field);
      if (visibleField) visibleFields.push(visibleField);
    });
    visibleFields.forEach((field) => fieldsToDisplay.push(field));

    const storeFields = [];
    const shippingFields = [];
    addressFields.forEach((field) => {
      const shippingField = formFields.find((f) => f.name === field);
      if (shippingField) shippingFields.push(shippingField);
    });

    if (cartKey === 'store') {
      pickupFields.forEach((field) => {
        const pickupField = formFields.find((f) => f.name === field);
        if (pickupField) storeFields.push(pickupField);
      });
      storeFields.forEach((field) => fieldsToDisplay.push(field));
    } else if (cartKey === 'shipping') {
      shippingFields.forEach((field) => fieldsToDisplay.push(field));
    } else if (cartKey === 'merch') {
      const shouldShipField = formFields.find((f) => f.name === 'getItShipped');
      fieldsToDisplay.push(shouldShipField);

      const shouldShip = JSON.parse(localStorage.getItem('orderFormData')).getItShipped;

      if (shouldShip) {
        pickupFields.forEach((field) => {
          const pickupFieldIndex = fieldsToDisplay.findIndex((f) => f.name === field.name);
          //  remove items then refresh cart
          if (pickupFieldIndex !== -1) {
            // Remove the field from "fieldsToDisplay"
            fieldsToDisplay.splice(pickupFieldIndex, 1);
          }
        });

        shippingFields.forEach((field) => fieldsToDisplay.push(field));
      } else {
        pickupFields.forEach((field) => {
          const pickupField = formFields.find((f) => f.name === field);
          if (pickupField) fieldsToDisplay.push(pickupField);
        });

        shippingFields.forEach((field) => {
          const shippingFieldIndex = fieldsToDisplay.findIndex((f) => f.name === field.name);
          //  remove items then refresh cart
          if (shippingFieldIndex !== -1) {
            // Remove the field from "fieldsToDisplay"
            fieldsToDisplay.splice(shippingFieldIndex, 1);
          }
        });
      }
    }

    return fieldsToDisplay.map((field) => {
      const value = orderFormFields[field.name] || '';
      return {
        ...field,
        value,
        checked: field.type === 'checkbox' ? Boolean(orderFormFields[field.name]) : undefined,
        oninput: (event) => {
          if (event.target.type === 'checkbox') {
            orderFormFields[field.name] = event.target.checked;
          } else {
            orderFormFields[field.name] = event.target.value;
          }
          localStorage.setItem('orderFormData', JSON.stringify(orderFormFields));
        },
      };
    });
  };

  async function createSquareOrder() {
    const orderData = new SquareOrderData(cartData, window.taxList[0]).build();
    const currentOrderFormData = JSON.parse(localStorage.getItem('orderFormData'));

    if (currentOrderFormData.discountCode && currentOrderFormData.discountCode.trim() !== '') {
      const discounts = [];
      const discountData = window.catalog.discounts[currentOrderFormData.discountCode].id;
      const discount = window.catalog.byId[discountData];

      if (discount) {
        if (discount.discount_data.percentage) {
          discounts.push(new SquareDiscountPercentageData(discount).build());
        }
        if (discount.discount_data.amount_money) {
          discounts.push(new SquareDiscountAmountData(discount).build());
        }
        orderData.discounts = discounts;
      }
    }

    const note = [];
    if (currentOrderFormData.pickupdate && currentOrderFormData.pickupdate?.trim() !== '') {
      note.push(`Pickup Date: ${currentOrderFormData.pickupdate}`);
    }
    if (currentOrderFormData.pickuptime && currentOrderFormData.pickuptime?.trim() !== '') {
      note.push(`Pickup Time: ${currentOrderFormData.pickuptime}`);
    }

    cartData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);

      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((modifier) => {
          note.push(`${modifier.name}: ${modifier.quantity}`);
          delete modifier.quantity;
        });
      }
    });
    orderData.note = note.length > 0 ? note.join(' | ') : '';

    if (env === 'sandbox') {
      cartData.line_items.forEach((item) => {
        delete item.catalog_object_id;

        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach((modifier) => {
            delete modifier.catalog_object_id;
          });
        }
      });
    }

    const orderWrapper = new SquareOrderWrapper(orderData).build();
    const cartLocation = getCartLocation();

    // TODO - make sure that this location qp is sending/switching properly in prod env's
    const newOrder = env === 'sandbox'
      ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox')
      : await createOrder(JSON.stringify(orderWrapper), `?location=${cartLocation}`);

    if (newOrder) {
      const cartModal = document.querySelector('.modal.cart');
      toggleModal(cartModal);

      const paymentsModal = document.querySelector('.modal.payments');
      toggleModal(paymentsModal, newOrder);
    } else {
      // throw user an error
      // eslint-disable-next-line no-console
      console.log('error with creating an order');
    }
  }

  const populatedFields = populateFields(fields);
  const form = buildForm(populatedFields, createSquareOrder, modal);
  form.className = 'form cart-order-form';
  return form;
}
