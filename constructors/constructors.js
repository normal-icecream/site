/* eslint-disable max-classes-per-file */
/* eslint-disable camelcase */
import { formatPhoneNumberToE164 } from '../helpers/helpers.js';

function getDueDate() {
  const today = new Date();
  today.setDate(today.getDate() + 14); // Add 14 days (2 weeks)

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export class SquareBasePriceMoney {
  constructor(data) {
    this.amount = Math.round(Number(data.amount));
    this.currency = data.currency;
  }

  build() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}

export class SquareModifier {
  constructor(data) {
    this.base_price_money = new SquareBasePriceMoney(data.base_price_money).build();
    this.catalog_object_id = data.catalog_object_id;
    this.name = data.name;
    this.quantity = String(data.quantity);
  }

  build() {
    return {
      base_price_money: this.base_price_money,
      catalog_object_id: this.catalog_object_id,
      name: this.name,
      quantity: this.quantity,
    };
  }
}

export class SquareDiscountAmountData {
  constructor(data) {
    this.name = data.discount_data.name;
    this.amount_money = new SquareBasePriceMoney(data.discount_data.amount_money).build();
    this.scope = 'ORDER';
    this.type = data.discount_data.discount_type;
  }

  build() {
    return {
      name: this.name,
      amount_money: this.amount_money,
      scope: this.scope,
      type: this.type,
    };
  }
}

export class SquareDiscountPercentageData {
  constructor(data) {
    this.name = data.discount_data.name;
    this.percentage = data.discount_data.percentage;
    this.scope = 'ORDER';
    this.type = data.discount_data.discount_type;
  }

  build() {
    return {
      name: this.name,
      percentage: this.percentage,
      scope: this.scope,
      type: this.type,
    };
  }
}

export class SquareTaxData {
  constructor(data) {
    this.name = data.tax_data.name;
    this.percentage = data.tax_data.percentage;
    this.scope = 'ORDER';
    this.type = data.tax_data.inclusion_type;
  }

  build() {
    return {
      name: this.name,
      percentage: this.percentage,
      scope: this.scope,
      type: this.type,
    };
  }
}

export class SquareOrderLineItem {
  constructor(data) {
    this.catalog_object_id = data.catalog_object_id;
    this.quantity = data.quantity;
    this.base_price_money = new SquareBasePriceMoney(data.base_price_money).build();
    this.name = data.name;
    this.item_type = data.item_type;
  }

  build() {
    return {
      catalog_object_id: this.catalog_object_id,
      quantity: this.quantity,
      base_price_money: this.base_price_money,
      name: this.name,
      item_type: this.item_type,
    };
  }
}

export class SquareOrderData {
  constructor(orderData, taxData) {
    this.line_items = orderData.line_items;
    this.state = orderData.state || 'OPEN';
    this.taxes = [new SquareTaxData(taxData).build()];
  }

  build() {
    return {
      line_items: this.line_items,
      state: this.state,
      taxes: this.taxes,
    };
  }
}

export class SquareOrderWrapper {
  constructor(data) {
    this.order = data;
  }

  build() {
    return {
      order: this.order,
    };
  }
}

export class SquarePaymentAddress {
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

export class SquarePayment {
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

export class SquareInvoice {
  constructor(orderData) {
    this.idempotency_key = orderData.idempotency_key;
    this.location_id = orderData.order.location_id;
    this.order_id = orderData.order.id;
    this.delivery_method = 'EMAIL';
    this.payment_requests = [
      {
        tipping_enabled: true,
        request_type: 'BALANCE',
        due_date: getDueDate(),
      },
    ];
    this.accepted_payment_methods = {
      card: true,
      square_gift_card: true,
      // TODO - check what payment methods they current accept
      // bank_account: true,
    };
  }

  build() {
    return {
      // idempotency_key: this.idempotency_key,
      location_id: this.location_id,
      order_id: this.order_id,
      delivery_method: this.delivery_method,
      payment_requests: this.payment_requests,
      accepted_payment_methods: this.accepted_payment_methods,
    };
  }
}

export class SquareInvoiceWrapper {
  constructor(data, idempotency_key) {
    this.invoice = data;
    this.idempotency_key = idempotency_key;
  }

  build() {
    return {
      invoice: this.invoice,
      idempotency_key: this.idempotency_key,
    };
  }
}
