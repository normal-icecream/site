/* eslint-disable import/no-cycle */
import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import { createInvoice } from '../../api/square/invoice.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import {
  getLastCartKey,
  getCartLocation,
  refreshCartContent,
  getCartCard,
  createCartTotalContent,
} from '../../pages/cart/cart.js';
import {
  SquareOrderWrapper,
  SquareDiscountAmountData,
  SquareDiscountPercentageData,
  SquareOrderData,
  SquareInvoice,
  SquareInvoiceWrapper,
} from '../../constructors/constructors.js';
import { refreshPaymentsContent } from '../customize/customize.js';
import { getTotals } from '../../helpers/helpers.js';
import { loadCSS } from '../../scripts/aem.js';

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

function getOrderFormData() {
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
  return orderFormData;
}

function addDiscountToOrder(order, orderFormData) {
    const discounts = [];
    const discountData = window.catalog.discounts[orderFormData.discountCode].id;
    const discount = window.catalog.byId[discountData];

    if (discount) {
      if (discount.discount_data.percentage) {
        discounts.push(new SquareDiscountPercentageData(discount).build());
      }
      if (discount.discount_data.amount_money) {
        discounts.push(new SquareDiscountAmountData(discount).build());
      }
      order.discounts = discounts;
    }
}

function populateFormFields(formFields, key, modal) {
  const orderFormFields = getOrderFormData();
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

  if (key === 'store') {
    pickupFields.forEach((field) => {
      const pickupField = formFields.find((f) => f.name === field);
      if (pickupField) storeFields.push(pickupField);
    });
    storeFields.forEach((field) => fieldsToDisplay.push(field));
  } else if (key === 'shipping') {
    shippingFields.forEach((field) => fieldsToDisplay.push(field));
  } else if (key === 'wholesale') {
    shippingFields.forEach((field) => fieldsToDisplay.push(field));
  } else if (key === 'merch') {
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
          localStorage.setItem('orderFormData', JSON.stringify(orderFormFields));
          refreshCartContent(modal);
        } else {
          orderFormFields[field.name] = event.target.value;
          localStorage.setItem('orderFormData', JSON.stringify(orderFormFields));
        }
      },
    };
  });
}

export function wholesaleOrderForm(wholesaleData, modal) {
  loadCSS(`${window.hlx.codeBasePath}/utils/order/order.css`);
  modal.classList.add('order');
  const env = getEnvironment();
  const orderFormFields = getOrderFormData();
  const modalContent = modal.querySelector('.modal-content');
  const wholesaleCartCard = getCartCard(wholesaleData);
  modalContent.append(wholesaleCartCard);

  async function createSquareWholesaleOrder() {
    const orderData = new SquareOrderData(wholesaleData, window.taxList[0]).build();

    if (orderFormFields.discountCode && orderFormFields.discountCode.trim() !== '') {
      addDiscountToOrder(orderData, orderFormFields);
    }
      console.log("orderFormFields:", orderFormFields);
      console.log("orderData:", orderData);

    const note = [];
    if (wholesaleData.note) note.push(wholesaleData.note);
    orderData.note = note.length > 0 ? note.join(' | ') : '';
    orderData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);
    });

    if (env === 'sandbox') {
      orderData.line_items.forEach((item) => delete item.catalog_object_id);
    }

    const orderWrapper = new SquareOrderWrapper(orderData).build();
    const cartLocation = getCartLocation();

    const newOrder = env === 'sandbox'
      ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox')
      : await createOrder(JSON.stringify(orderWrapper), `?location=${cartLocation}`);

    if (newOrder) {
      const wholesaleModalContent = modal.querySelector('.modal-content');
      wholesaleModalContent.querySelector('.wholesale-order-form').remove();

      getTotals(modal, newOrder, createCartTotalContent);

      const invoiceData = new SquareInvoice(newOrder).build();
      const invoice = new SquareInvoiceWrapper(invoiceData, newOrder.idempotency_key).build();

      const createInvoiceButton = document.createElement('button');
      createInvoiceButton.className = 'wholesale-button';
      createInvoiceButton.textContent = 'create invoice';
      createInvoiceButton.addEventListener('click', async (event) => {
        event.preventDefault();

        try {
          const newInvoice = env === 'sandbox'
            ? await hitSandbox(createInvoice, JSON.stringify(invoice), '?location=sandbox')
            : await createInvoice(JSON.stringify(invoice));

          if (newInvoice) {
            wholesaleModalContent.innerHTML = '';

            const successContainer = document.createElement('div');
            successContainer.className = 'wholesale-success-container';

            const iconContainer = document.createElement('div');
            const iconSpan = document.createElement('span');
            iconSpan.className = 'icon icon-logo';
            iconContainer.append(iconSpan);

            successContainer.append(iconContainer);

            const successMessage = document.createElement('h4');
            successMessage.className = 'wholesale-success-message';
            successMessage.textContent = 'great choice! your order has been placed successfully.';
            successContainer.append(successMessage);

            const backButton = document.createElement('button');
            backButton.textContent = 'back to wholesale';
            backButton.className = 'wholesale-button';
            backButton.addEventListener('click', () => toggleModal(modal));
            successContainer.append(backButton);
            modal.append(successContainer);

            document.querySelector('.wholesale-form').reset();
          }
        } catch (error) {
          const errorMessage = 'Create invoice failed.';
          throw new Error(errorMessage);
        }
      });
      wholesaleModalContent.append(createInvoiceButton);
    } else {
      // throw user an error
      // eslint-disable-next-line no-console
      console.log('error with creating an order');
    }
  }
  const populatedFields = populateFormFields(fields, 'wholesale', modal);
  const form = buildForm(populatedFields, createSquareWholesaleOrder, modal);
  form.className = 'form wholesale-order-form';
  modalContent.append(form);
}

export function orderForm(cartData) {
  const env = getEnvironment();
  const modal = document.querySelector('.modal.cart');
  const orderFormFields = getOrderFormData();

  async function createSquareOrder() {
    const orderData = new SquareOrderData(cartData, window.taxList[0]).build();

    console.log("orderFormFields:", orderFormFields);
    console.log("orderData:", orderData);
    if (orderFormFields.discountCode && orderFormFields.discountCode.trim() !== '') {
      addDiscountToOrder(orderData, orderFormFields);
    }

    const note = [];
    if (orderFormFields.pickupdate && orderFormFields.pickupdate?.trim() !== '') {
      note.push(`Pickup Date: ${orderFormFields.pickupdate}`);
    }
    if (orderFormFields.pickuptime && orderFormFields.pickuptime?.trim() !== '') {
      note.push(`Pickup Time: ${orderFormFields.pickuptime}`);
    }

    // TODO - make sure the switch from cartData to orderData isn't breaking this
    orderData.line_items.forEach((item) => {
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
      // TODO - make sure the switch from cartData to orderData isn't breaking this
      orderData.line_items.forEach((item) => {
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
      toggleModal(cartModal, `your ${getLastCartKey()} order`, refreshCartContent);

      const paymentsModal = document.querySelector('.modal.payments');
      toggleModal(paymentsModal, `your ${getLastCartKey()} order`, refreshPaymentsContent, newOrder);
    } else {
      // throw user an error
      // eslint-disable-next-line no-console
      console.log('error with creating an order');
    }
  }

  const populatedFields = populateFormFields(fields, getLastCartKey(), modal);
  const form = buildForm(populatedFields, createSquareOrder, modal);
  form.className = 'form cart-order-form';
  return form;
}
