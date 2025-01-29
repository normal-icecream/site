import { getEnvironment, hitSandbox } from '../../api/environmentConfig.js';
import { createPayment } from '../../api/square/payments.js';
import { loadScript } from "../../scripts/aem.js";

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
        console.log("formData:", formData);
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

async function createSquarePayment(token, orderData) {
    const env = getEnvironment();
    
    const formData = JSON.parse(localStorage.getItem('orderFormData'));
    const squarePaymentData = new SquarePayment(orderData, formData, token).build();
    const SquarePaymentDataJson = JSON.stringify(squarePaymentData);

    const payment = env === 'sandbox' ? await hitSandbox(createPayment, SquarePaymentDataJson) : await createPayment(SquarePaymentDataJson);

    // TODO - Set up success and failure reasons & then clear cart!
    if (payment) {
        const successMessage = document.createElement('div');
        successMessage.textContent = 'SUCCESS!!'
        // Add clear cart

        return successMessage;
    } else {
        const failureMessage = document.createElement('div');
        failureMessage.textContent = 'FAILURE REASONS!!'
        return failureMessage;
    }
}

// https://developer.squareup.com/reference/square/payments-api/create-payment

// https://developer.squareup.com/reference/sdks/web/payments/card-payments
// https://developer.squareup.com/docs/web-payments/quickstart/add-sdk-to-web-client
export async function getCardPaymentForm(element, orderData) {
    const env = getEnvironment();
    const paymentsSdkUrl = env === 'sandbox' ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js';
    // QUESTION - is this something that I only need to do once if it doesn't exist or is this something I need to do every time a payment is initiated? 
    const test = await loadScript(paymentsSdkUrl);
    console.log("test:", test);

      // TODO - check if form element already exists, if it does the remove all elements under it. otherwise create a new one
    const cardForm = document.createElement('div');
    cardForm.className = 'payments card-payment-form';
    cardForm.id = 'card';
    element.append(cardForm);
    
    const cardButtonElement = document.createElement('button');
    cardButtonElement.id = 'card-button';
    cardButtonElement.textContent = 'pay paweese :)'
    cardButtonElement.className = 'payments card-payment-button';
    element.append(cardButtonElement);

    const payments = window.Square.payments(orderData.applicationId, orderData.order.location_id);
    const card = await payments.card();
    await card.attach('#card');

    const cardButton = document.getElementById('card-button');
    cardButton.addEventListener('click', async () => {
        // TODO - handle 
    //   const statusContainer = document.getElementById('payment-status-container');

      try {
        const result = await card.tokenize();
        if (result.status === 'OK') {
          createSquarePayment(result.token, orderData);
        //   statusContainer.innerHTML = "Payment Successful";
        } else {
          let errorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            errorMessage += ` and errors: ${JSON.stringify(
              result.errors
            )}`;
          }

          throw new Error(errorMessage);
        }
      } catch (e) {
        console.error(e);
        // statusContainer.innerHTML = "Payment Failed";
      }






    });
}