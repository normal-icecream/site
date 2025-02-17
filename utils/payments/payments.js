/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createPayment } from '../../api/square/payments.js';
import { loadScript, loadCSS } from '../../scripts/aem.js';
import buildForm from '../forms/forms.js';
import {
  getLocalStorageCart, resetCart, getCartCard, createCartTotalContent, getLastCartKey,
} from '../../pages/cart/cart.js';
import { resetOrderForm } from '../orderForm/orderForm.js';
import { SquarePayment } from '../../constructors/constructors.js';
import { formatCurrency } from '../../helpers/helpers.js';
import { toggleModal } from '../modal/modal.js';

async function createSquarePayment(token, orderData, element) {
  const env = getEnvironment();

  const formData = JSON.parse(localStorage.getItem('orderFormData'));
  const squarePaymentData = new SquarePayment(orderData, formData, token).build();
  const SquarePaymentDataJson = JSON.stringify(squarePaymentData);

  try {
    const payment = env === 'sandbox' ? await hitSandbox(createPayment, SquarePaymentDataJson) : await createPayment(SquarePaymentDataJson);
    if (payment.payment.status === 'COMPLETED') {
      element.innerHTML = '';

      const paymentSuccessContainer = document.createElement('div');
      paymentSuccessContainer.className = 'payment-success-container';

      const iconContainer = document.createElement('div');
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon icon-logo';
      iconContainer.append(iconSpan);

      paymentSuccessContainer.append(iconContainer);

      const successMessage = document.createElement('h4');
      successMessage.className = 'payment-success-message';
      successMessage.textContent = 'great choice! your order has been placed successfully.';
      paymentSuccessContainer.append(successMessage);

      const backButton = document.createElement('button');
      backButton.textContent = `back to ${getLastCartKey()}`;
      backButton.className = 'payment-back-button';
      backButton.addEventListener('click', () => {
        toggleModal(element.parentElement);
        window.location.reload();
      });
      paymentSuccessContainer.append(backButton);
      element.append(paymentSuccessContainer);

      resetCart();
      resetOrderForm();
    }
  } catch (error) {
    const errorMessage = 'Create payment failed.';
    throw new Error(errorMessage);
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

  async function handleSubmit(formData) {
    const errorMessage = element.querySelector('.payment-failure');
    if (errorMessage) errorMessage.remove();

    if (formData[0].value === 'giftCard') {
      try {
        // eslint-disable-next-line no-use-before-define
        const result = await giftCard.tokenize();
        if (result.status === 'OK') {
          await createSquarePayment(result.token, orderData, element);
        } else {
          let gcErrorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            gcErrorMessage += ` and errors: ${JSON.stringify(
              result.errors,
            )}`;
          }
          throw new Error(gcErrorMessage);
        }
      } catch (error) {
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'payment-failure';
        errorMessageDiv.textContent = 'Payment failed, try again!';
        element.append(errorMessageDiv);
      }
    } else {
      try {
        // eslint-disable-next-line no-use-before-define
        const result = await card.tokenize();
        if (result.status === 'OK') {
          await createSquarePayment(result.token, orderData, element);
        } else {
          let ccErrorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            ccErrorMessage += ` and errors: ${JSON.stringify(
              result.errors,
            )}`;
          }

          throw new Error(ccErrorMessage);
        }
      } catch (error) {
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.classList.add('payments', 'payment-failure');
        errorMessageDiv.textContent = 'oh no! Payment failed, please try again.';
        element.append(errorMessageDiv);
      }
    }
  }

  const cartData = getLocalStorageCart();
  const currentCart = getCartCard(cartData);
  element.append(currentCart);

  const totalWrapper = element.querySelector('.cart .cart-total-wrapper');
  if (totalWrapper) totalWrapper.innerHTML = '';

  const tax = createCartTotalContent('prepared food tax (included)', formatCurrency(orderData.order.total_tax_money.amount));
  totalWrapper.append(tax);

  const total = createCartTotalContent('total', formatCurrency(orderData.order.net_amount_due_money.amount));
  totalWrapper.append(total);

  const form = buildForm(fields, handleSubmit, element);
  form.classList.add('payment-form');

  const creditCardForm = document.createElement('div');
  creditCardForm.className = 'card-payment-form';
  creditCardForm.id = 'card';

  const giftCardForm = document.createElement('div');
  giftCardForm.className = 'gift-card-payment-form';
  giftCardForm.id = 'gift-card';
  giftCardForm.style.display = 'none';

  form.prepend(creditCardForm);
  form.prepend(giftCardForm);

  element.append(form);

  // https://developer.squareup.com/docs/web-payments/customize-styles
  const cartStyles = {
    '.input-container': {
      borderColor: '#C1C8FF',
    },
    input: {
      backgroundColor: '#FFFCF3',
      color: '#0B21E0',
    },
  };

  const card = await payments.card({
    style: cartStyles,
  });
  await card.attach('#card');

  const giftCard = await payments.giftCard({
    style: cartStyles,
  });
  await giftCard.attach('#gift-card');
}

// Function to refresh the cart content
export function refreshPaymentsContent(element, orderData) {
  const modalContentSection = element.querySelector('.modal-content');
  modalContentSection.innerHTML = '';

  getCardPaymentForm(modalContentSection, orderData);
}
