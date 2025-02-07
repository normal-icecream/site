/* eslint-disable import/prefer-default-export */
import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createPayment } from '../../api/square/payments.js';
import { loadScript } from '../../scripts/aem.js';
import buildForm from '../forms/forms.js';
import { resetCart } from '../../pages/cart/cart.js';
import { resetOrderForm } from '../orderForm/orderForm.js';
import { SquarePayment } from '../../constructors/constructors.js';

// Function to refresh the cart content
export function refreshPaymentsContent(element, orderData) {
  const paymentForm = element.querySelector('.card-payment-form');
  if (paymentForm) paymentForm.remove();

  getCardPaymentForm(element, orderData);
}

async function createSquarePayment(token, orderData, element) {
  const env = getEnvironment();

  const formData = JSON.parse(localStorage.getItem('orderFormData'));
  const squarePaymentData = new SquarePayment(orderData, formData, token).build();
  const SquarePaymentDataJson = JSON.stringify(squarePaymentData);

  try {
    const payment = env === 'sandbox' ? await hitSandbox(createPayment, SquarePaymentDataJson) : await createPayment(SquarePaymentDataJson);
    if (payment.payment.status === 'COMPLETED') {
      const form = element.querySelector('form');
      form.remove();

      const successMessage = document.createElement('div');
      successMessage.classList.add('payments', 'payment-success');
      successMessage.textContent = 'Payment was successful!';
      element.append(successMessage);

      resetCart();
      resetOrderForm();
    }
  } catch (error) {
    let errorMessage = `Create payment failed.`;
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
        errorMessageDiv.classList.add('payments', 'payment-failure');
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
        errorMessageDiv.textContent = 'Payment failed, try again!';
        element.append(errorMessageDiv);
      }
    }
  }

  const form = buildForm(fields, handleSubmit, element);

  const creditCardForm = document.createElement('div');
  creditCardForm.className = 'payments card-payment-form';
  creditCardForm.id = 'card';

  const giftCardForm = document.createElement('div');
  giftCardForm.className = 'payments gift-card-payment-form';
  giftCardForm.id = 'gift-card';
  giftCardForm.style.display = 'none';

  form.append(creditCardForm);
  form.append(giftCardForm);
  
  element.append(form);

  const card = await payments.card();
  await card.attach('#card');

  const giftCard = await payments.giftCard();
  await giftCard.attach('#gift-card');
}
