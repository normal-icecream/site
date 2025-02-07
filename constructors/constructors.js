/* eslint-disable max-classes-per-file */
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

export class SquareVariation {
  constructor(data) {
    this.catalog_object_id = data.id;
  }

  build() {
    return {
      catalog_object_id: this.catalog_object_id,
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
