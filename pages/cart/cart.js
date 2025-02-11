/* eslint-disable import/no-cycle */
import { formatCurrency } from '../../helpers/helpers.js';
import { SquareOrderLineItem } from '../../constructors/constructors.js';
import { loadCSS } from '../../scripts/aem.js';
import { orderForm } from '../../utils/orderForm/orderForm.js';

export const allowedCartPages = Object.freeze([
  'store',
  'shipping',
  'merch',
]);

export function getLastCartKey() {
  const cart = JSON.parse(localStorage.getItem('carts'));
  return cart ? cart.lastcart : '';
}

export function getLocalStorageCart() {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  return carts[cartKey];
}

export function getCartLocation() {
  const cartkey = getLastCartKey();
  const { getItShipped } = JSON.parse(localStorage.getItem('orderFormData'));
  let currentLocation = '';
  if (cartkey === 'merch') {
    currentLocation = getItShipped ? 'shipping' : 'store';
  } else {
    currentLocation = cartkey;
  }
  return currentLocation;
}

function getEmptyCartMessage() {
  const noCartDiv = document.createElement('div');
  noCartDiv.className = 'empty-cart-message';
  noCartDiv.textContent = 'nothing is in your cart! go pick something!';
  return noCartDiv;
}

function getCartTotals(cartItems) {
  const cartTotals = cartItems.line_items
    .reduce((total, item) => total + item.base_price_money.amount * item.quantity, 0);
  return formatCurrency(cartTotals);
}

function createLineItem(catalogItemId, quantity) {
  const squareItem = window.catalog.byId[catalogItemId];
  const lineItemData = {
    catalog_object_id: squareItem.id,
    quantity,
    base_price_money: {
      amount: squareItem.item_data.variations[0].item_variation_data.price_money.amount,
      currency: 'USD',
    },
    description: squareItem.item_data.description,
    name: squareItem.item_data.name,
    item_type: squareItem.type,
  };
  return new SquareOrderLineItem(lineItemData);
}

export async function addItemToCart(key, catalogObjectId, modifiers = [], variation = {}) {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  const cart = carts[cartKey];
  const cartItem = cart?.line_items.find((item) => item.key === key);

  const quantity = 1; // Default quantity for a new item
  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    const lineItem = createLineItem(catalogObjectId, quantity);

    if (modifiers.length > 0) {
      const compoundCartKey = modifiers.reduce((acc, curr) => `${acc}-${curr.catalog_object_id}`, '');
      lineItem.key = `${catalogObjectId}${compoundCartKey}`;

      lineItem.modifiers = modifiers;
    } else if (variation.name) {
      lineItem.key = `${catalogObjectId}-${variation.id}`;
      lineItem.variation_name = variation.name;
    } else {
      lineItem.key = catalogObjectId;
    }
    cart.line_items.push(lineItem);
  }
  localStorage.setItem('carts', JSON.stringify(carts));
}

export function removeItemFromCart(key) {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  const cart = carts[cartKey];
  const cartItem = cart?.line_items.find((item) => item.key === key);

  if (cartItem.quantity > 1) {
    cartItem.quantity -= 1;
  } else {
    const cartIndex = cart.line_items.findIndex((item) => item.key === key);
    cart.line_items.splice(cartIndex, 1);
  }
  localStorage.setItem('carts', JSON.stringify(carts));
}

export function getCartItemQuantity(prodId) {
  const cart = getLocalStorageCart();
  const itemQuantity = cart?.line_items.find((item) => item.catalog_object_id === prodId)?.quantity;
  const quantity = itemQuantity || 0;
  return quantity;
}

export function setLastCart(pageName) {
  const cart = JSON.parse(localStorage.getItem('carts'));
  if (cart && allowedCartPages.includes(pageName)) {
    cart.lastcart = pageName;
    localStorage.setItem('carts', JSON.stringify(cart));
  }
}

export function resetCart() {
  const cartKey = getLastCartKey();
  const carts = JSON.parse(localStorage.getItem('carts'));
  carts[cartKey] = { line_items: [] };
  localStorage.setItem('carts', JSON.stringify(carts));
}

function getCartCard(cartItems) {
  // Fetch catalog from Square
  const cartCardWrapper = document.createElement('div');
  cartCardWrapper.classList.add('cart', 'cart-card-wrapper');

  cartItems.line_items.forEach((item) => {
    const cartCard = document.createElement('div');
    cartCard.className = 'cart cart-card';

    const cartContentWrapper = document.createElement('div');
    cartContentWrapper.className = 'cart cart-content-wrapper';

    const quantityWrapper = document.createElement('div');
    quantityWrapper.classList.add('cart', 'cart-quantity-wrapper');

    const decrement = document.createElement('button');
    decrement.classList.add('cart', 'button', 'cart-button');
    decrement.textContent = '-';
    decrement.addEventListener('click', () => {
      const modal = document.querySelector('.modal.cart');
      removeItemFromCart(item.key);
      // eslint-disable-next-line no-use-before-define
      refreshCartContent(modal);
    });
    quantityWrapper.append(decrement);

    const quantity = document.createElement('h3');
    quantity.classList.add('cart', 'cart-quantity');
    quantity.textContent = item.quantity;
    quantityWrapper.append(quantity);

    const increment = document.createElement('button');
    increment.classList.add('cart', 'button', 'cart-button');
    increment.textContent = '+';
    increment.addEventListener('click', () => {
      const modal = document.querySelector('.modal.cart');
      addItemToCart(item.key, item.catalog_object_id);
      // eslint-disable-next-line no-use-before-define
      refreshCartContent(modal);
    });
    quantityWrapper.append(increment);
    cartContentWrapper.append(quantityWrapper);

    const descriptionWrapper = document.createElement('div');
    descriptionWrapper.classList.add('cart', 'cart-description-wrapper');

    const name = document.createElement('h3');
    name.className = 'cart cart-name';
    name.textContent = item.name;
    descriptionWrapper.append(name);

    if (item.variation_name) {
      const itemVariation = document.createElement('div');
      itemVariation.textContent = item.variation_name;
      descriptionWrapper.append(itemVariation);
    }

    if (item.modifiers) {
      const itemDetails = [];
      const itemMods = document.createElement('div');

      item.modifiers.forEach((modifier) => {
        itemDetails.push(`${modifier.name} x ${modifier.quantity}`);
      });

      itemMods.textContent = itemDetails.join(' • ');
      descriptionWrapper.append(itemMods);
    }

    cartContentWrapper.append(descriptionWrapper);
    cartCard.append(cartContentWrapper);

    const price = document.createElement('h3');
    price.classList.add('cart', 'cart-price');
    price.textContent = formatCurrency(item.base_price_money.amount * item.quantity);
    cartCard.append(price);

    cartCardWrapper.append(cartCard);
  });

  const totalWrapper = document.createElement('div');
  totalWrapper.classList.add('cart', 'cart-total-wrapper');

  const totalTitle = document.createElement('h3');
  totalTitle.textContent = 'total';
  totalWrapper.append(totalTitle);

  const totalAmount = document.createElement('h3');
  totalAmount.classList.add('cart', 'cart-amount');
  totalAmount.textContent = getCartTotals(cartItems);
  totalWrapper.append(totalAmount);
  cartCardWrapper.append(totalWrapper);

  return cartCardWrapper;
}

export function getCart() {
  loadCSS(`${window.hlx.codeBasePath}/pages/cart/cart.css`);

  let cart = [];
  const cartData = JSON.parse(localStorage.getItem('carts'));
  if (!cartData) {
    localStorage.setItem('carts', JSON.stringify({
      store: {
        line_items: [],
      },
      shipping: {
        line_items: [],
      },
      merch: {
        line_items: [],
      },
      lastcart: '',
    }));
    cart = getEmptyCartMessage();
  } else if (cartData.lastcart.length > 0) {
    const currentCartData = cartData[cartData.lastcart];
    if (currentCartData.line_items.length > 0) {
      cart = getCartCard(currentCartData);
    } else {
      cart = getEmptyCartMessage();
    }
  } else {
    cart = getEmptyCartMessage();
  }
  return cart;
}

// Function to refresh the cart content
export function refreshCartContent(element) {
  const cartContent = element.querySelector('.cart-card-wrapper');
  if (cartContent) cartContent.remove();

  const emptyCartMessage = element.querySelector('.empty-cart-message');
  if (emptyCartMessage) emptyCartMessage.remove();

  const cartOrderForm = element.querySelector('.cart-order-form');
  if (cartOrderForm) cartOrderForm.remove();

  // eslint-disable-next-line no-use-before-define
  const currentCart = getCart();
  element.append(currentCart);

  const hasNewCartWrapper = element.querySelector('.cart.cart-card-wrapper');

  // Check if currentCart contains the class `card-wrapper` (cart with items)
  if (hasNewCartWrapper) {
    // If cart has items, append the order form
    const cartKey = getLastCartKey();
    const cartLocalStorageData = getLocalStorageCart();
    const hasShipping = !!((cartKey === 'shipping' || cartKey === 'merch'));

    const form = orderForm(cartLocalStorageData, hasShipping);
    element.append(form);
  }
}
