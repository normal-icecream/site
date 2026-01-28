/* eslint-disable import/no-cycle */
import { getEnvironment, hitSandbox } from '../../scripts/square-client/environmentConfig.js';
import { createOrder } from '../../scripts/square-client/square/order.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import {
  getLastCartKey,
  getCartLocation,
  refreshCartContent,
} from '../../pages/cart/cart.js';
import {
  SquareOrderWrapper,
  SquareDiscountAmountData,
  SquareDiscountPercentageData,
  SquareOrderData,
  SquareTaxData,
  SquareCustomerWrapper,
  SquareCustomer,
  SquarePickupData,
  SquareShippingData,
} from '../../constructors/constructors.js';
import { refreshPaymentsContent } from '../customize/customize.js';
import { getCatalog } from '../../scripts/scripts.js';
import { loadCSS, decorateIcons } from '../../scripts/aem.js';
import { createCustomer, findCustomer } from '../../scripts/square-client/square/customer.js';

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
    type: 'input',
    label: 'Your Business Name',
    name: 'businessName',
    placeholder: 'your business name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'textarea',
    label: 'Special Requests / Notes',
    name: 'businessNote',
    placeholder: 'Notes',
    validation: ['no-nums'],
  },
  {
    type: 'tel',
    label: 'Phone Number',
    name: 'phone',
    placeholder: 'your cell',
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
  },
  {
    type: 'time',
    label: 'pickup Time',
    name: 'pickuptime',
  },
  {
    type: 'checkbox',
    label: "i'd like to pick this up at the store",
    name: 'isPickupOrder',
    val: 'pickup-order',
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

export function getOrderFormData() {
  const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
  if (!orderFormData) {
    localStorage.setItem('orderFormData', JSON.stringify({
      name: '',
      businessName: '',
      businessNote: '',
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
      isPickupOrder: false, // false for pickup, true for delivery
    }));
  }
  return orderFormData;
}

export function resetOrderForm() {
  const orderData = getOrderFormData();

  if (orderData) {
    orderData.pickupdate = '';
    orderData.pickuptime = '';
    orderData.discountCode = '';
    orderData.businessNote = '';
    orderData.isPickupOrder = false;
  }

  localStorage.setItem('orderFormData', JSON.stringify(orderData));
}

async function addDiscountToOrder(order, orderFormData) {
  const discounts = [];
  const discountData = (await getCatalog()).discounts[orderFormData.discountCode].id;
  const discount = (await getCatalog()).byId[discountData];

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

  if (key === 'pickup') {
    pickupFields.forEach((field) => {
      const pickupField = formFields.find((f) => f.name === field);
      if (pickupField) storeFields.push(pickupField);
    });
    storeFields.forEach((field) => fieldsToDisplay.push(field));

    const localStorageOrderFields = getOrderFormData();
    localStorageOrderFields.isPickupOrder = true;
    localStorage.setItem('orderFormData', JSON.stringify(localStorageOrderFields));
  } else if (key === 'shipping') {
    shippingFields.forEach((field) => fieldsToDisplay.push(field));

    const localStorageOrderFields = getOrderFormData();
    localStorageOrderFields.isPickupOrder = false;
    localStorage.setItem('orderFormData', JSON.stringify(localStorageOrderFields));
  } else if (key === 'merch') {
    const isPickupField = formFields.find((f) => f.name === 'isPickupOrder');
    fieldsToDisplay.push(isPickupField);

    const pickupOrder = getOrderFormData().isPickupOrder;

    if (pickupOrder) {
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
    } else {
      pickupFields.forEach((field) => {
        const pickupFieldIndex = fieldsToDisplay.findIndex((f) => f.name === field.name);
        //  remove items then refresh cart
        if (pickupFieldIndex !== -1) {
          // Remove the field from "fieldsToDisplay"
          fieldsToDisplay.splice(pickupFieldIndex, 1);
        }
      });

      shippingFields.forEach((field) => fieldsToDisplay.push(field));
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

export async function handleNewCustomer(idempotencyKey, orderFormData) {
  const env = getEnvironment();
  const cartLocation = getCartLocation();
  const customerWrapper = new SquareCustomerWrapper(orderFormData.email).build();

  const customerData = env === 'sandbox'
    ? await hitSandbox(findCustomer, JSON.stringify({ query: customerWrapper }), '?location=sandbox')
    : await findCustomer(JSON.stringify(customerWrapper), `?location=${cartLocation}`);

  let customer;

  async function createSquareCustomer() {
    try {
      const squareCustomerData = new SquareCustomer({
        idempotency_key: idempotencyKey,
        orderFormData,
      });
      if (cartLocation === 'wholesale') {
        squareCustomerData.attachBusinessName(orderFormData.businessName);
      } else {
        squareCustomerData.attachGivenName(orderFormData.name);
      }

      const squareCustomer = squareCustomerData.build();

      let newCustomer;
      if (env === 'sandbox') {
        newCustomer = await hitSandbox(createCustomer, JSON.stringify(squareCustomer), '?location=sandbox');
      } else {
        newCustomer = await createCustomer(JSON.stringify(squareCustomer), `?location=${cartLocation}`);
      }
      return newCustomer;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  if (customerData.customers) {
    if (customerData.customers.length > 0) {
      let matchingCustomer;
      // If a wholesale order, check business names
      if (orderFormData.businessName && cartLocation === 'wholesale') {
        // eslint-disable-next-line max-len
        const nonCompanyCustomer = !customerData.customers.some((c) => c.company_name) && customerData.customers.length === 1;

        // If this is an individual, create a company customer account
        if (nonCompanyCustomer) {
          const newCustomerData = await createSquareCustomer();
          matchingCustomer = newCustomerData.customer;
        } else { // This is the company account
          // check if normal customer has matching email address and business name
          // eslint-disable-next-line max-len
          matchingCustomer = customerData.customers.find((c) => c.company_name?.toLowerCase() === orderFormData.businessName.toLowerCase()
            && c.email_address === orderFormData.email);
        }
      // Otherwise for reqular orders select the customer who is not a business with the same email
      } else {
        matchingCustomer = customerData.customers.find((c) => !c.company_name && c);
      }

      // If there is a match, set customer to matching customer data
      if (matchingCustomer) {
        customer = matchingCustomer;
      } else { // create new customer from the same email address but with a different business name
        const newCustomerData = await createSquareCustomer();
        customer = newCustomerData.customer;
      }
    }
  } else {
    // otherwise create a customer if there isn't one
    const newCustomerData = await createSquareCustomer();
    customer = newCustomerData.customer;
  }

  return customer;
}

export function orderForm(cartData) {
  loadCSS(`${window.hlx.codeBasePath}/utils/order/order.css`);
  const env = getEnvironment();
  const cartLocation = getCartLocation();
  const modal = document.querySelector('.modal.cart');

  async function createSquareOrder() {
    const orderFormFields = getOrderFormData();
    const orderData = new SquareOrderData(cartData).build();
    orderData.taxes = [new SquareTaxData((await getCatalog()).taxList[0]).build()];

    const note = [];
    function addPickupNote() {
      if (orderFormFields.pickupdate && orderFormFields.pickupdate?.trim() !== '') {
        note.push(`Pickup Date: ${orderFormFields.pickupdate}`);
      }
      if (orderFormFields.pickuptime && orderFormFields.pickuptime?.trim() !== '') {
        note.push(`Pickup Time: ${orderFormFields.pickuptime}`);
      }
    }

    function addPickupFulfillments() {
      const fillbyDate = `${orderFormFields.pickupdate}T${orderFormFields.pickuptime}:00`;
      const pickupIsoDate = new Date(fillbyDate).toISOString();
      orderData.fulfillments = [
        new SquarePickupData(pickupIsoDate, orderFormFields).build(),
      ];
    }

    // Attach pickup fulfillment data to orderData
    if (cartLocation === 'pickup') {
      addPickupFulfillments();
      addPickupNote();
    }

    // Attach shipping fulfillment data to orderData
    if (cartLocation === 'shipping') {
      orderData.fulfillments = [
        new SquareShippingData(cartData.fill_by_date, orderFormFields).build(),
      ];
    }

    // Attach merch fulfillment data to orderData
    if (cartLocation === 'merch') {
      if (orderFormFields.isPickupOrder) {
        addPickupFulfillments();
        addPickupNote();
      } else {
        orderData.fulfillments = [
          new SquareShippingData(cartData.fill_by_date, orderFormFields).build(),
        ];
      }
    }

    if (orderFormFields.discountCode && orderFormFields.discountCode.trim() !== '') {
      await addDiscountToOrder(orderData, orderFormFields);
    }

    orderData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);

      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((modifier) => {
          modifier.name = `${modifier.name} x ${modifier.quantity}`;
          delete modifier.quantity;
        });
      }
    });
    orderData.note = note.length > 0 ? note.join(' | ') : '';

    if (env === 'sandbox') {
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

    const newOrder = env === 'sandbox'
      ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '&location=sandbox')
      : await createOrder(JSON.stringify(orderWrapper), `&location=${cartLocation}`);

    if (newOrder) {
      const cartModal = document.querySelector('.modal.cart');
      toggleModal(cartModal, `your ${getLastCartKey()} order`, refreshCartContent);

      const paymentsModal = document.querySelector('.modal.payments');
      toggleModal(paymentsModal, `your ${getLastCartKey()} order`, refreshPaymentsContent, newOrder);
    } else {
      // eslint-disable-next-line no-console
      console.log('error with creating an order');
      const cartModal = document.querySelector('.modal.cart');
      cartModal.classList.add('order');
      const cartModalContent = modal.querySelector('.modal-content');

      // Show loading screen
      cartModalContent.innerHTML = ''; // Clear previous content

      const errorContainer = document.createElement('div');
      errorContainer.className = 'order-content-container';

      const iconContainer = document.createElement('div');
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon icon-error';
      iconContainer.append(iconSpan);
      errorContainer.append(iconContainer);
      decorateIcons(iconContainer);

      const errorMessage = document.createElement('h4');
      errorMessage.className = 'wholesale-error-message';
      errorMessage.textContent = 'Oops! Something went wrong while placing your order. Please try again :)';
      errorContainer.append(errorMessage);

      const retryButton = document.createElement('button');
      retryButton.textContent = 'Try Again';
      retryButton.className = 'wholesale-button';
      retryButton.addEventListener('click', () => toggleModal(modal));

      errorContainer.append(retryButton);
      cartModalContent.append(errorContainer);
    }
  }

  const populatedFields = populateFormFields(fields, getLastCartKey(), modal);
  const form = buildForm(populatedFields, createSquareOrder, modal, 'place order');
  form.className = 'form cart-order-form';
  return form;
}
