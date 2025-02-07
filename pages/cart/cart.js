// import { refreshCartContent } from '../../utils/modal/modal.js';
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

export async function addItemToCart(id, modifiers = []) {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  const cart = carts[cartKey];
  const cartItem = cart?.line_items.find((item) => item.catalog_object_id === id);

  const quantity = 1; // Default quantity for a new item
  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    const squareItem = window.catalog.byId[id];
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
    const lineItem = new SquareOrderLineItem(lineItemData);
    if (modifiers.length > 0) lineItem.modifiers = modifiers;

    cart.line_items.push(lineItem);
  }
  localStorage.setItem('carts', JSON.stringify(carts));
}

export function removeItemFromCart(id) {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  const cart = carts[cartKey];
  const cartItem = cart?.line_items.find((item) => item.catalog_object_id === id);

  if (cartItem.quantity > 1) {
    cartItem.quantity -= 1;
  } else {
    const cartIndex = cart.line_items.findIndex((item) => item.catalog_object_id === id);
    cart.line_items.splice(cartIndex, 1);
  }
  localStorage.setItem('carts', JSON.stringify(carts));
}

// Function to refresh the cart content
export function refreshCartContent(element) {
  const cartContent = element.querySelector('.card-wrapper');
  if (cartContent) cartContent.remove();

  const emptyCartMessage = element.querySelector('.empty-cart-message');
  if (emptyCartMessage) emptyCartMessage.remove();

  const cartOrderForm = element.querySelector('.cart-order-form');
  if (cartOrderForm) cartOrderForm.remove();

  // eslint-disable-next-line no-use-before-define
  const currentCart = getCart();
  element.append(currentCart);

  // Check if currentCart contains the class `card-wrapper` (cart with items)
  if (currentCart.classList.contains('card-wrapper')) {
    // If cart has items, append the order form
    const cartKey = getLastCartKey();
    const cartLocalStorageData = getLocalStorageCart();
    const hasShipping = !!((cartKey === 'shipping' || cartKey === 'merch'));

    const form = orderForm(cartLocalStorageData, hasShipping);
    element.append(form);
  }
}

function getCartCard(cartItems) {
  // Fetch catalog from Square
  const cartCardWrapper = document.createElement('div');
  cartCardWrapper.className = 'cart card-wrapper';

  cartItems.line_items.forEach((item) => {
    const cartCard = document.createElement('div');
    cartCard.className = 'cart card';
    cartCard.textContent = item.title;
    cartCardWrapper.append(cartCard);

    const quantity = document.createElement('div');
    quantity.className = 'cart cart-quantity';
    quantity.textContent = item.quantity;
    cartCardWrapper.append(quantity);

    const name = document.createElement('div');
    name.className = 'cart cart-name';
    name.textContent = item.name;
    cartCardWrapper.append(name);

    const price = document.createElement('div');
    price.classprice = 'cart cart-price';
    price.textContent = formatCurrency(item.base_price_money.amount);
    cartCardWrapper.append(price);

    const description = document.createElement('div');
    description.className = 'cart cart-description';
    description.textContent = item.description;
    cartCardWrapper.append(description);

    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'cart card-button-wrapper';

    const decrement = document.createElement('button');
    decrement.className = 'cart card-decrement';
    decrement.textContent = '-';
    decrement.addEventListener('click', () => {
      const modal = document.querySelector('.modal.cart');
      removeItemFromCart(item.catalog_object_id);
      refreshCartContent(modal);
    });
    buttonWrapper.append(decrement);

    const increment = document.createElement('button');
    increment.className = 'cart card-increment';
    increment.textContent = '+';
    increment.addEventListener('click', () => {
      const modal = document.querySelector('.modal.cart');
      addItemToCart(item.catalog_object_id);
      refreshCartContent(modal);
    });
    buttonWrapper.append(increment);
    cartCardWrapper.append(buttonWrapper);
  });

  const cartTotal = getCartTotals(cartItems);
  cartCardWrapper.append(cartTotal);

  const cartTax = document.createElement('div');
  cartTax.textContent = 'NEED TO CALC CART TAX';
  cartCardWrapper.append(cartTax);

  const shippingCost = document.createElement('div');
  shippingCost.textContent = 'NEED TO CALC SHIPPING COST';
  cartCardWrapper.append(shippingCost);

  const grandTotal = document.createElement('div');
  grandTotal.textContent = 'NEED TO GRAND TOTAL';
  cartCardWrapper.append(grandTotal);

  return cartCardWrapper;
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
