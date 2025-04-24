/* eslint-disable import/no-cycle */
import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createOrder } from '../../api/square/order.js';
import { createInvoice, publishInvoice } from '../../api/square/invoice.js';
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
  SquareTaxData,
  SquareInvoice,
  SquareInvoiceWrapper,
  SquareCustomerWrapper,
  SquareCustomer,
  SquarePickupData,
  SquareShippingData,
} from '../../constructors/constructors.js';
import { refreshPaymentsContent } from '../customize/customize.js';
import { getTotals } from '../../helpers/helpers.js';
import { swapIcons } from '../../scripts/scripts.js';
import { loadCSS, decorateIcons } from '../../scripts/aem.js';
import { updateWholesaleGoogleSheet } from '../../pages/wholesale/wholesale.js';
import { createCustomer, findCustomer } from '../../api/square/customer.js';

const alwaysVisibleFields = [
  'name',
  'phone',
  'email',
  'discountCode',
];

const wholesaleSpecificFields = [
  'businessName',
  'businessNote',
  'businessSpecialReqs',
  'businessMethod',
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
    label: 'Notes',
    name: 'businessNote',
    placeholder: 'Notes',
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
    required: true,
  },
  {
    type: 'time',
    label: 'pickup Time',
    name: 'pickuptime',
    required: true,
  },
  {
    type: 'checkbox',
    label: 'get it delivered?',
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
      getItShipped: false,
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
    orderData.getItShipped = false;
  }

  localStorage.setItem('orderFormData', JSON.stringify(orderData));
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

function populateWholesaleFormFields(formFields, modal, wholesaleData) {
  const orderFormFields = getOrderFormData();
  const fieldsToDisplay = [];

  const visibleFields = [];
  alwaysVisibleFields.forEach((field) => {
    const visibleField = formFields.find((f) => f.name === field);
    if (visibleField) visibleFields.push(visibleField);
  });
  visibleFields.forEach((field) => fieldsToDisplay.push(field));

  const wholesaleFields = [];
  wholesaleSpecificFields.forEach((field) => {
    const wholesaleField = formFields.find((f) => f.name === field);
    if (wholesaleField) wholesaleFields.push(wholesaleField);
  });
  wholesaleFields.forEach((field) => fieldsToDisplay.push(field));

  const methods = wholesaleData.deliveryMethods.split(',').map((item) => item.trim());
  const pickupAllowed = methods.includes('pickup');

  if (pickupAllowed) {
    const shouldShipField = formFields.find((f) => f.name === 'getItShipped');
    fieldsToDisplay.push(shouldShipField);
  }

  const shouldShip = getOrderFormData().getItShipped;
  if (shouldShip || !pickupAllowed) {
    const shippingFields = [];
    addressFields.forEach((field) => {
      const addressField = formFields.find((f) => f.name === field);
      if (addressField) shippingFields.push(addressField);
    });
    shippingFields.forEach((field) => fieldsToDisplay.push(field));
  } else {
    const forPickupFields = [];
    pickupFields.forEach((field) => {
      const pickupField = formFields.find((f) => f.name === field);
      if (pickupField) forPickupFields.push(pickupField);
    });
    forPickupFields.forEach((field) => fieldsToDisplay.push(field));
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

          // Clearing modal content so we can display the form with the correct shouldShip fields
          const modalContentSection = modal.querySelector('.modal-content');
          modalContentSection.innerHTML = '';
          // eslint-disable-next-line no-use-before-define
          wholesaleOrderForm(wholesaleData, modal);
        } else {
          orderFormFields[field.name] = event.target.value;
          localStorage.setItem('orderFormData', JSON.stringify(orderFormFields));
        }
      },
    };
  });
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
  } else if (key === 'shipping') {
    shippingFields.forEach((field) => fieldsToDisplay.push(field));
  } else if (key === 'merch') {
    const shouldShipField = formFields.find((f) => f.name === 'getItShipped');
    fieldsToDisplay.push(shouldShipField);

    const shouldShip = getOrderFormData().getItShipped;

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

export async function handleNewCustomer(idempotencyKey, orderFormData) {
  const env = getEnvironment();
  const cartLocation = getCartLocation();
  const customerWrapper = new SquareCustomerWrapper(orderFormData.email).build();

  let normalCustomer;
  normalCustomer = env === 'sandbox'
    ? await hitSandbox(findCustomer, JSON.stringify({ query: customerWrapper }), '?location=sandbox')
    : await findCustomer(JSON.stringify(customerWrapper), `?location=${cartLocation}`);

  async function createSquareCustomer() {
    try {
      const squareCustomer = new SquareCustomer({
        idempotency_key: idempotencyKey,
        orderFormData,
      }).build();

      let customer;
      if (env === 'sandbox') {
        customer = await hitSandbox(createCustomer, JSON.stringify(squareCustomer), '?location=sandbox');
      } else {
        customer = await createCustomer(JSON.stringify(squareCustomer), `?location=${cartLocation}`);
      }
      return customer;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // If multiple customers share the same email,
  // check if their name or business name matches the order form.
  if (normalCustomer.customers) {
    let hasMatch = false;
    if (normalCustomer.customers.length > 1) {
      hasMatch = normalCustomer.customers.some((c) => (c.given_name === orderFormData.name)
      || (c.company_name === orderFormData.businessName));
    }
    if (!hasMatch) {
      normalCustomer = await createSquareCustomer();
    }
  } else {
    // otherwise create a customer if there isn't one
    normalCustomer = await createSquareCustomer();
  }

  return normalCustomer;
}

export function wholesaleOrderForm(wholesaleData, modal) {
  loadCSS(`${window.hlx.codeBasePath}/utils/order/order.css`);
  modal.classList.add('order');
  const env = getEnvironment();
  getOrderFormData();

  const modalContent = modal.querySelector('.modal-content');
  const wholesaleCartCard = getCartCard(wholesaleData);
  modalContent.append(wholesaleCartCard);

  async function createSquareWholesaleOrder() {
    const orderFormFields = getOrderFormData();
    // eslint-disable-next-line max-len
    const orderData = new SquareOrderData(wholesaleData).build();

    if (orderFormFields.discountCode && orderFormFields.discountCode.trim() !== '') {
      addDiscountToOrder(orderData, orderFormFields);
    }

    const note = [];
    if (wholesaleData.note) note.push(wholesaleData.note);
    orderData.note = note.length > 0 ? note.join(' | ') : '';
    orderData.line_items.forEach((item) => {
      item.quantity = String(item.quantity);
    });

    if (env === 'sandbox') {
      orderData.line_items.forEach((item) => {
        item.id = item.catalog_object_id;
        delete item.catalog_object_id;
      });
    }

    const newOrderObject = new SquareOrderWrapper(orderData).build();
    const cartLocation = getCartLocation();

    try {
      let newOrder;
      if (env === 'sandbox') {
        newOrder = await hitSandbox(createOrder, JSON.stringify(newOrderObject), '?location=sandbox');
      } else {
        newOrder = await createOrder(JSON.stringify(newOrderObject), `?location=${cartLocation}`);
      }

      if (newOrder) {
        const customer = await handleNewCustomer(newOrder.idempotency_key, orderFormFields);

        if (customer) {
          const wholesaleModalContent = modal.querySelector('.modal-content');
          wholesaleModalContent.querySelector('.wholesale-order-form').remove();

          getTotals(modal, newOrder, createCartTotalContent);

          let customerData;
          if (customer.customers) {
            // eslint-disable-next-line prefer-destructuring
            customerData = customer.customers[0];
          } else {
            customerData = customer.customer;
          }

          const invoiceData = new SquareInvoice(
            newOrder,
            // ANDI - which customer should be used?
            customerData,
            orderFormFields.businessName,
          ).build();
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

              // Show loading screen
              wholesaleModalContent.innerHTML = ''; // Clear previous content
              const loadingContainer = document.createElement('div');
              loadingContainer.className = 'modal-wholesale-content-container';

              const iconContainer = document.createElement('div');
              const iconSpan = document.createElement('span');
              iconSpan.className = 'icon icon-pints';
              iconContainer.append(iconSpan);
              loadingContainer.append(iconContainer);

              // add container to DOM first
              wholesaleModalContent.append(loadingContainer);
              // then decorate icons
              decorateIcons(wholesaleModalContent);
              // then swap icons
              swapIcons();

              const loadingMessage = document.createElement('h4');
              loadingMessage.className = 'wholesale-loading-message';
              loadingMessage.textContent = 'We are processing your order :)';
              loadingContainer.append(loadingMessage);

              wholesaleModalContent.append(loadingContainer);

              if (newInvoice) {
                // update google sheet
                await updateWholesaleGoogleSheet(
                  orderData,
                  orderFormFields,
                  newInvoice.invoice.id,
                );

                if (env !== 'sandbox') {
                  await publishInvoice(newInvoice.invoice.id, JSON.stringify({
                    idempotency_key: newInvoice.idempotency_key,
                    version: newInvoice.invoice.version,
                  }));
                }

                wholesaleModalContent.innerHTML = '';

                const successContainer = document.createElement('div');
                successContainer.className = 'modal-wholesale-content-container';

                const successIconContainer = document.createElement('div');
                const successIconSpan = document.createElement('span');
                successIconSpan.className = 'icon icon-logo';
                successIconContainer.append(successIconSpan);
                successContainer.append(successIconContainer);

                // add to DOM first
                wholesaleModalContent.append(successContainer);
                // then decorate
                decorateIcons(wholesaleModalContent);
                // then swap
                swapIcons();

                const successMessage = document.createElement('h4');
                successMessage.className = 'wholesale-success-message';
                successMessage.textContent = 'great choice! your order has been placed successfully.';
                successContainer.append(successMessage);

                const backButton = document.createElement('button');
                backButton.textContent = 'back to wholesale';
                backButton.className = 'wholesale-button';
                backButton.addEventListener('click', () => {
                  toggleModal(modal);
                  window.location.reload();
                });
                successContainer.append(backButton);
                wholesaleModalContent.append(successContainer);

                document.querySelector('.wholesale-form').reset();
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error processing order:', error);

              // Replace loading screen with error message
              wholesaleModalContent.innerHTML = '';

              const errorContainer = document.createElement('div');
              errorContainer.className = 'modal-wholesale-content-container';

              const iconContainer = document.createElement('div');
              const iconSpan = document.createElement('span');
              iconSpan.className = 'icon icon-error';
              iconContainer.append(iconSpan);
              errorContainer.append(iconContainer);
              decorateIcons(wholesaleModalContent);

              const errorMessage = document.createElement('h4');
              errorMessage.className = 'wholesale-error-message';
              errorMessage.textContent = 'Oops! Something went wrong while placing your wholesale order. Please try again.';
              errorContainer.append(errorMessage);

              const retryButton = document.createElement('button');
              retryButton.textContent = 'Try Again';
              retryButton.addEventListener('click', () => toggleModal(modal));

              errorContainer.append(retryButton);
              modal.append(errorContainer);
            }
          });

          wholesaleModalContent.append(createInvoiceButton);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error with creating an order:', error);
    }
  }
  const populatedFields = populateWholesaleFormFields(fields, modal, wholesaleData);
  const form = buildForm(populatedFields, createSquareWholesaleOrder, modal);
  form.className = 'form wholesale-order-form';
  modalContent.append(form);
}

export function orderForm(cartData) {
  loadCSS(`${window.hlx.codeBasePath}/utils/order/order.css`);
  const env = getEnvironment();
  const cartLocation = getCartLocation();
  const modal = document.querySelector('.modal.cart');

  async function createSquareOrder() {
    const orderFormFields = getOrderFormData();
    const orderData = new SquareOrderData(cartData).build();
    orderData.taxes = [new SquareTaxData(window.taxList[0]).build()];

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
      if (orderFormFields.getItShipped) {
        orderData.fulfillments = [
          new SquareShippingData(cartData.fill_by_date, orderFormFields).build(),
        ];
      } else {
        addPickupFulfillments();
        addPickupNote();
      }
    }

    if (orderFormFields.discountCode && orderFormFields.discountCode.trim() !== '') {
      addDiscountToOrder(orderData, orderFormFields);
    }

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
      ? await hitSandbox(createOrder, JSON.stringify(orderWrapper), '?location=sandbox')
      : await createOrder(JSON.stringify(orderWrapper), `?location=${cartLocation}`);

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
