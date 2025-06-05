/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
import { getEnvironment, hitSandbox } from '../../scripts/square-client/environmentConfig.js';
import { createPayment } from '../../scripts/square-client/square/payments.js';
import { loadScript, loadCSS, decorateIcons } from '../../scripts/aem.js';
import buildForm from '../forms/forms.js';
import {
  getLocalStorageCart,
  resetCart,
  getCartCard,
  createCartTotalContent,
  getLastCartKey,
} from '../../pages/cart/cart.js';
import {
  resetOrderForm,
  getOrderFormData,
  handleNewCustomer,
} from '../order/order.js';
import { SquarePayment } from '../../constructors/constructors.js';
import { getTotals } from '../../helpers/helpers.js';
import { toggleModal } from '../modal/modal.js';
import { swapIcons } from '../../scripts/scripts.js';

async function createSquarePayment(token, orderData, element) {
  const env = getEnvironment();

  const formData = getOrderFormData();
  const squarePaymentData = new SquarePayment(orderData, formData, token).build();
  const SquarePaymentDataJson = JSON.stringify(squarePaymentData);

  try {
    const payment = env === 'sandbox'
      ? await hitSandbox(createPayment, SquarePaymentDataJson)
      : await createPayment(SquarePaymentDataJson);

    if (payment.payment.status === 'COMPLETED') {
      // Create a new custoner if they haven't already been added
      await handleNewCustomer(orderData.idempotency_key, formData);

      element.innerHTML = '';

      const paymentSuccessContainer = document.createElement('div');
      paymentSuccessContainer.className = 'payment-content-container';

      const iconContainer = document.createElement('div');
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon icon-logo';
      iconContainer.append(iconSpan);
      paymentSuccessContainer.append(iconContainer);
      element.append(paymentSuccessContainer);
      // then decorate icons
      decorateIcons(element);
      // then swap icons
      swapIcons();

      const successMessage = document.createElement('h4');
      successMessage.className = 'payment-success-message';
      successMessage.textContent = 'great choice! your order has been placed successfully.';
      paymentSuccessContainer.append(successMessage);

      const backButton = document.createElement('button');
      backButton.textContent = `back to ${getLastCartKey()}`;
      backButton.className = 'payment-back-button';
      backButton.addEventListener('click', () => {
        const paymentsModal = document.querySelector('.modal.payments');
        if (paymentsModal) {
          toggleModal(paymentsModal, '');
          window.location.reload();
        }
      });
      paymentSuccessContainer.append(backButton);

      resetCart();
      resetOrderForm();
    }
  } catch (error) {
    const errorMessages = error.responseMessages;
    const errorContainer = element.querySelector('.payment-error-container');
    if (errorContainer) {
      errorContainer.innerHTML = '';
      errorMessages.forEach((message) => {
        const errorMessage = document.createElement('p');
        errorMessage.className = 'payment-error';
        errorMessage.textContent = message;
        errorContainer.append(errorMessage);
      });
    } else {
      const newErrorContainer = document.createElement('div');
      newErrorContainer.className = 'payment-error-container';
      errorMessages.forEach((message) => {
        const errorMessage = document.createElement('p');
        errorMessage.className = 'payment-error';
        errorMessage.textContent = message;
        newErrorContainer.append(errorMessage);
      });
      element.append(newErrorContainer);
    }
  }
}

function togglePaymentForms(event) {
  const isChecked = event.target.checked;

  const giftCardForm = document.getElementById('gift-card');
  const creditCardForm = document.getElementById('card');

  if (isChecked) {
    giftCardForm.style.display = 'block';
    creditCardForm.style.display = 'none';
  } else {
    giftCardForm.style.display = 'none';
    creditCardForm.style.display = 'block';
  }
}

const fields = [
  {
    type: 'checkbox',
    label: 'want to pay with a gift card?',
    name: 'giftCard',
    val: 'giftCard',
    oninput: togglePaymentForms,
  },
];

// https://developer.squareup.com/reference/square/payments-api/create-payment
// https://developer.squareup.com/reference/sdks/web/payments/card-payments
// https://developer.squareup.com/docs/web-payments/quickstart/add-sdk-to-web-client
export async function getCardPaymentForm(element, orderData) {
  loadCSS(`${window.hlx.codeBasePath}/utils/payments/payments.css`);
  const env = getEnvironment();
  const paymentsSdkUrl = env === 'sandbox' ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js';

  await loadScript(paymentsSdkUrl);
  const payments = window.Square.payments(orderData.applicationId, orderData.order.location_id);
  let card;
  let giftCard;

  async function handleSubmit(formData) {
    const errorMessage = element.querySelector('.payment-failure');
    if (errorMessage) errorMessage.remove();

    if (formData[0].value === 'giftCard') {
      try {
        // eslint-disable-next-line no-use-before-define
        const result = await giftCard.tokenize();
        if (result.status === 'OK') await createSquarePayment(result.token, orderData, element);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error:', error);
      }
    } else {
      try {
        // eslint-disable-next-line no-use-before-define
        const result = await card.tokenize();
        if (result.status === 'OK') await createSquarePayment(result.token, orderData, element);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error:', error);
      }
    }
  }

  element.innerHTML = ''; // Clear previous content

  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'payment-content-container';

  const iconContainer = document.createElement('div');
  const iconSpan = document.createElement('span');
  iconSpan.className = 'icon icon-wholesale';
  iconContainer.append(iconSpan);
  loadingContainer.append(iconContainer);

  // add container to DOM first
  element.append(loadingContainer);
  // then decorate icons
  decorateIcons(element);
  // then swap icons
  swapIcons();

  const loadingMessage = document.createElement('h4');
  loadingMessage.className = 'payment-loading-message';
  loadingMessage.textContent = 'We are processing your order :)';
  loadingContainer.append(loadingMessage);

  element.append(loadingContainer);

  // https://developer.squareup.com/docs/web-payments/customize-styles
  const cardStyles = {
    '.input-container': {
      borderColor: '#C1C8FF',
    },
    input: {
      backgroundColor: '#FFFCF3',
      color: '#0B21E0',
    },
  };
  try {
    card = await payments.card({
      style: cardStyles,
    });

    giftCard = await payments.giftCard({
      style: cardStyles,
    });

    if (card) {
      element.innerHTML = ''; // Clear previous content

      const cartData = getLocalStorageCart();
      const currentCart = getCartCard(cartData);
      element.append(currentCart);

      getTotals(element, orderData, createCartTotalContent);

      const form = buildForm(fields, handleSubmit, element);
      form.classList.add('payment-form');

      const creditCardForm = document.createElement('div');
      creditCardForm.className = 'card-payment-form';
      creditCardForm.id = 'card';

      form.prepend(creditCardForm);

      if (giftCard) {
        const giftCardForm = document.createElement('div');
        giftCardForm.className = 'gift-card-payment-form';
        giftCardForm.id = 'gift-card';
        giftCardForm.style.display = 'none';

        form.prepend(giftCardForm);
      }

      element.append(form);
      await card.attach('#card');
      await giftCard.attach('#gift-card');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
}

// Function to refresh the cart content
export function refreshPaymentsContent(element, orderData) {
  const modalContentSection = element.querySelector('.modal-content');
  modalContentSection.innerHTML = '';

  getCardPaymentForm(modalContentSection, orderData);
}
