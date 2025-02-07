import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createPayment } from '../../api/square/payments.js';
import { loadScript } from "../../scripts/aem.js";
import buildForm from '../forms/forms.js';
import { resetCart } from '../../pages/cart/cart.js';
import { resetOrderForm } from '../orderForm/orderForm.js';

function formatPhoneNumberToE164(phoneNumber, countryCode = '1') {
    // Remove all non-numeric characters
    const digits = phoneNumber.replace(/\D/g, '');
  
    // Ensure the phone number has at least 10 digits (US standard)
    if (digits.length < 10) {
      throw new Error('Invalid phone number. Must contain at least 10 digits.');
    }
  
    // Add the country code prefix if not already included
    if (digits.startsWith(countryCode)) {
      return `+${digits}`; // Already in E.164 format
    } else {
      return `+${countryCode}${digits}`;
    }
}

// https://developer.squareup.com/docs/build-basics/common-data-types/working-with-addresses
class SquarePaymentAddress {
    constructor(formData) {
        this.address_line_1 = formData.address1;
        this.address_line_2 = formData.address2;
        this.first_name = formData.name;
        this.locality = formData.city; // city
        this.administrative_district_level_1 = formData.state; // state
        this.postal_code = formData.zipcode;
    }

    build() {
        return {
            address_line_1: this.address_line_1,
            address_line_2: this.address_line_2,
            first_name: this.first_name,
            locality: this.locality,
            administrative_district_level_1: this.administrative_district_level_1,
            postal_code: this.postal_code,
        };
    }
}

class SquarePayment {
    constructor(orderData, formData, token) {
        this.idempotency_key = orderData.idempotency_key;
        this.source_id = token;
        this.amount_money = orderData.order.total_money;
        this.buyer_email_address = formData.email;
        this.buyer_phone_number = formatPhoneNumberToE164(formData.phone);
        this.location_id = orderData.order.location_id;
        this.order_id = orderData.order.id;
        this.initializeAddresses(formData);
        // this.tip_money = {}
    }

    initializeAddresses(formData) {
        console.log("formData:", formData);
        if (formData.getItShipped) {
          this.shipping_address = new SquarePaymentAddress(formData).build();
          this.billing_address = new SquarePaymentAddress(formData).build();
        } else {
          this.shipping_address = null;
          this.billing_address = null;
        }
      }
  
    build() {
        return {
            idempotency_key: this.idempotency_key,
            source_id: this.source_id,
            amount_money: this.amount_money,
            billing_address: this.billing_address,
            buyer_email_address: this.buyer_email_address,
            buyer_phone_number: this.buyer_phone_number,
            location_id: this.location_id,
            order_id: this.order_id,
            shipping_address: this.shipping_address,
        };
    }
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
        successMessage.textContent = 'Payment was successful!'
        element.append(successMessage);
        
        resetCart();
        resetOrderForm();
      }
    } catch (error) {
        let errorMessage = `Create payment failed with status: ${payment.status}`;
        if (payment.errors) {
          errorMessage += ` and errors: ${JSON.stringify(
            payment.errors
          )}`;
        }

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
]

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
          const result = await giftCard.tokenize();
          if (result.status === 'OK') {
            await createSquarePayment(result.token, orderData, element);
          } else {
            let errorMessage = `Tokenization failed with status: ${result.status}`;
            if (result.errors) {
              errorMessage += ` and errors: ${JSON.stringify(
                result.errors
              )}`;
            }
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error(error);
          const errorMessageDiv = document.createElement('div');
          errorMessageDiv.classList.add('payments', 'payment-failure');
          errorMessageDiv.textContent = 'Payment failed, try again!'
          element.append(errorMessageDiv);
        }
      } else {
        try {
          const result = await card.tokenize();
          if (result.status === 'OK') {
            await createSquarePayment(result.token, orderData, element);
          } else {
            let errorMessage = `Tokenization failed with status: ${result.status}`;
            if (result.errors) {
              errorMessage += ` and errors: ${JSON.stringify(
                result.errors
              )}`;
            }
  
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error(error);
          const errorMessageDiv = document.createElement('div');
          errorMessageDiv.classList.add('payments', 'payment-failure');
          errorMessageDiv.textContent = 'Payment failed, try again!'
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