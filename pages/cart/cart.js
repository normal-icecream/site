/* eslint-disable import/no-cycle */
import { formatCurrency, stringExistsInAnother, convertEmailToLink } from '../../helpers/helpers.js';
import { SquareOrderLineItem } from '../../constructors/constructors.js';
import { loadCSS } from '../../scripts/aem.js';
import { getOrderFormData, orderForm } from '../../utils/order/order.js';
import { getCatalog } from '../../scripts/scripts.js';

export const allowedCartPages = Object.freeze([
  'pickup',
  'shipping',
  'merch',
]);

export function createLocalStorageCart() {
  const cartData = JSON.parse(localStorage.getItem('carts'));
  if (!cartData) {
    localStorage.setItem('carts', JSON.stringify({
      pickup: {
        line_items: [],
      },
      shipping: {
        line_items: [],
        fill_by_date: '',
      },
      merch: {
        line_items: [],
        fill_by_date: '',
      },
      lastcart: '',
    }));
  }
}

export function getLastCartKey() {
  const cart = JSON.parse(localStorage.getItem('carts'));
  return cart ? cart.lastcart : 'pickup';
}

export function getLocalStorageCart() {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  return carts[cartKey];
}

export function getCartLocation() {
  let currentLocation = '';
  const wholesale = window.location.pathname.split('/').some((path) => path === 'wholesale');

  if (wholesale) {
    currentLocation = 'wholesale';
  } else {
    const cartkey = getLastCartKey();
    const orderFormData = JSON.parse(localStorage.getItem('orderFormData'));
    if (cartkey === 'merch') {
      currentLocation = orderFormData && orderFormData.getItShipped ? 'shipping' : 'pickup';
    } else {
      currentLocation = cartkey;
    }
  }
  return currentLocation;
}

async function getEmptyCartMessage() {
  const noItemsInCartContainer = document.createElement('div');
  noItemsInCartContainer.className = 'empty-cart-container'; // Optional styling class

  const noCartDiv = document.createElement('h4');
  noCartDiv.className = 'empty-cart-message';
  noCartDiv.textContent = `Nothing is in your ${getLastCartKey()} cart, Go pick something!`;
  noCartDiv.textContent = `your ${getLastCartKey()} cart is empty! fill ’er up!`;

  noItemsInCartContainer.appendChild(noCartDiv);

  return noItemsInCartContainer; // Return the full container with SVG and message
}

function getCartTotals(cartItems) {
  const cartTotals = cartItems.line_items
    .reduce((total, item) => total + item.base_price_money.amount * item.quantity, 0);
  return formatCurrency(cartTotals);
}

export function getCartQuantity() {
  const currentCart = getLocalStorageCart();
  const quantity = 0;
  if (currentCart) {
    const cartQuantity = currentCart.line_items
      .reduce((total, item) => total + item.quantity, 0);
    if (cartQuantity > 0) {
      return cartQuantity;
    }
  }
  return quantity;
}

export async function createLineItem(squareItemId, quantity) {
  const squareItem = (await getCatalog()).byId[squareItemId];
  const lineItemData = {
    item_id: squareItem.id,
    // setting square variation id at index 0 as default for all line items,
    // to be updated later if needed
    catalog_object_id: squareItem.item_data.variations[0].id,
    quantity,
    base_price_money: {
      amount: squareItem.item_data.variations[0].item_variation_data.price_money.amount,
      currency: 'USD',
    },
    description: squareItem.item_data.description,
    name: squareItem.item_data.name,
    item_type: squareItem.type,
  };
  return new SquareOrderLineItem(lineItemData).build();
}

function updateCartQuantityUI() {
  const cartQuantityButton = document.getElementById('nav-cart-total');
  if (cartQuantityButton) cartQuantityButton.textContent = getCartQuantity();
}

export async function addItemToCart(key, squareItemId, modifiers = [], variation = {}) {
  const carts = JSON.parse(localStorage.getItem('carts'));
  const cartKey = getLastCartKey();
  const cart = carts[cartKey];
  const cartItem = cart?.line_items.find((item) => item.key === key);

  const quantity = 1; // Default quantity for a new item
  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    const lineItem = await createLineItem(squareItemId, quantity);

    if (modifiers.length > 0) {
      const compoundCartKey = modifiers.reduce((acc, curr) => `${acc}-${curr.catalog_object_id}`, '');
      lineItem.key = `${squareItemId}${compoundCartKey}`;

      lineItem.modifiers = modifiers;
    } else if (variation.name) {
      lineItem.key = `${squareItemId}-${variation.id}`;
      lineItem.catalog_object_id = variation.id;
      lineItem.variation_name = variation.name;
    } else {
      lineItem.key = squareItemId;
    }
    cart.line_items.push(lineItem);
  }
  localStorage.setItem('carts', JSON.stringify(carts));
  updateCartQuantityUI();
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
  updateCartQuantityUI();
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

export function createCartTotalContent(title, amount) {
  // Create total container
  const total = document.createElement('div');
  total.className = 'cart-total';

  // Create total title
  const totalTitle = document.createElement('h4');
  totalTitle.textContent = title;

  // Create total amount
  const totalAmount = document.createElement('h4');
  totalAmount.className = 'cart-amount';
  totalAmount.textContent = amount;

  // Append elements to total container
  total.append(totalTitle, totalAmount);
  return total;
}

function removeWholesalePrefix(str) {
  return str.startsWith('wholesale - ') ? str.replace('wholesale - ', '') : str;
}

export function getCartCard(cartItems, deliveryData) {
  // Fetch catalog from Square
  const cartCardWrapper = document.createElement('div');
  cartCardWrapper.classList.add('cart', 'cart-card-wrapper');

  cartItems.line_items.forEach((item) => {
    const cartCard = document.createElement('div');
    cartCard.className = 'cart-card';

    const cartContentWrapper = document.createElement('div');
    cartContentWrapper.className = 'cart-content-wrapper';

    const quantityWrapper = document.createElement('div');
    quantityWrapper.className = 'cart-quantity-wrapper';

    const decrement = document.createElement('button');
    decrement.classList.add('button', 'cart-button');
    decrement.textContent = '-';
    decrement.addEventListener('click', () => {
      const modal = document.querySelector('.modal.cart');
      removeItemFromCart(item.key);
      // eslint-disable-next-line no-use-before-define
      refreshCartContent(modal);
    });
    quantityWrapper.append(decrement);

    const quantity = document.createElement('h4');
    quantity.className = 'cart-quantity';
    quantity.textContent = item.quantity;
    quantityWrapper.append(quantity);

    const increment = document.createElement('button');
    increment.classList.add('button', 'cart-button');
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
    descriptionWrapper.className = 'cart-description-wrapper';

    const name = document.createElement('h4');
    name.className = 'cart-name';
    name.textContent = removeWholesalePrefix(item.name);
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

    if (item.note) {
      const isNoteInTitle = stringExistsInAnother(item.name, item.note);

      if (!isNoteInTitle) {
        const itemNote = document.createElement('div');
        itemNote.append(item.note);
        descriptionWrapper.append(itemNote);
      }
    }

    cartContentWrapper.append(descriptionWrapper);
    cartCard.append(cartContentWrapper);

    const price = document.createElement('h4');
    price.className = 'cart-price';
    price.textContent = formatCurrency(item.base_price_money.amount * item.quantity);
    cartCard.append(price);

    cartCardWrapper.append(cartCard);
  });
  // Create wrapper for total section
  const totalWrapper = document.createElement('div');
  totalWrapper.className = 'total-wrapper';

  const totalContent = createCartTotalContent('total', getCartTotals(cartItems));

  // Append total container to wrapper
  totalWrapper.append(totalContent);

  if (deliveryData) {
    const shippingDetailsContainer = document.createElement('div');
    shippingDetailsContainer.className = 'cart-shipping-details';

    const shippingDeetsLabel = document.createElement('h3');
    shippingDeetsLabel.textContent = `Estimated delivery date: ${deliveryData.DELIVERY_DATE}`;
    shippingDetailsContainer.append(shippingDeetsLabel);

    const shippingCopy = document.createElement('h4');
    shippingCopy.textContent = deliveryData.TEXT;
    shippingDetailsContainer.append(shippingCopy);

    const shippingExtra = document.createElement('p');
    shippingExtra.innerHTML = convertEmailToLink(deliveryData.HELPER_TEXT);
    shippingDetailsContainer.append(shippingExtra);

    totalWrapper.append(shippingDetailsContainer);
  }

  cartCardWrapper.append(totalWrapper);

  return cartCardWrapper;
}

// eslint-disable-next-line consistent-return
async function fetchDeliveryDetails() {
  const url = `${window.location.origin}/admin/config.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const pathSegments = window.location.pathname.split('/');
      const path = pathSegments.length > 1 ? pathSegments[1] : null;

      let deliveryData = {};
      deliveryData = json.data.find((item) => item.PAGE === path);

      const today = new Date();
      const currentDay = today.getDay();

      if (path === 'shipping') {
        // 3 = wednesday
        const daysToNextShipDate = currentDay <= 3 ? 3 - currentDay : 7 - (currentDay - 3);

        const nextShippingDate = new Date();
        nextShippingDate.setDate(today.getDate() + daysToNextShipDate);

        const deliveryDate = new Date();

        // next shipping date + number of business days + weekend days
        deliveryDate.setDate(
          nextShippingDate.getDate()
          + parseInt(deliveryData.DAYS_TO_DELIVER, 10)
          + 2,
        );

        const shippingIsoDate = deliveryDate.toISOString();

        const carts = JSON.parse(localStorage.getItem('carts'));
        carts.shipping.fill_by_date = shippingIsoDate;
        localStorage.setItem('carts', JSON.stringify(carts));

        const deliveryMonth = deliveryDate.getMonth() + 1;
        const deliverDateString = `${deliveryMonth}/${deliveryDate.getDate()}`;
        deliveryData.DELIVERY_DATE = deliverDateString;
        delete deliveryData.DAYS_TO_DELIVER;
      }

      if (path === 'merch') {
        let numberOfDaysToDeliver = 0;

        if (currentDay === 3 || currentDay === 4 || currentDay === 5) {
          // + 2 days for the weekend
          numberOfDaysToDeliver = parseInt(deliveryData.DAYS_TO_DELIVER, 10) + 2;
        } else if (currentDay === 6) {
          // +1 day for sun
          numberOfDaysToDeliver = parseInt(deliveryData.DAYS_TO_DELIVER, 10) + 1;
        } else {
          numberOfDaysToDeliver = parseInt(deliveryData.DAYS_TO_DELIVER, 10);
        }

        const deliveryDate = new Date();

        // today + number of business days to deliver
        // (including extra days for weekends depending on the day the order is made)
        deliveryDate.setDate(deliveryDate.getDate() + numberOfDaysToDeliver);

        const merchIsoDate = deliveryDate.toISOString();

        const carts = JSON.parse(localStorage.getItem('carts'));
        carts.merch.fill_by_date = merchIsoDate;
        localStorage.setItem('carts', JSON.stringify(carts));

        const deliveryMonth = deliveryDate.getMonth() + 1;
        const deliverDateString = `${deliveryMonth}/${deliveryDate.getDate()}`;
        deliveryData.DELIVERY_DATE = deliverDateString;
        delete deliveryData.DAYS_TO_DELIVER;
      }

      return deliveryData;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }
}

export async function getCart() {
  loadCSS(`${window.hlx.codeBasePath}/pages/cart/cart.css`);

  const deliveryData = await fetchDeliveryDetails();

  let cart = [];
  const cartData = JSON.parse(localStorage.getItem('carts'));
  if (!cartData) {
    createLocalStorageCart();
    cart = await getEmptyCartMessage();
  } else if (cartData.lastcart.length > 0) {
    const currentCartData = cartData[cartData.lastcart];
    if (currentCartData.line_items.length > 0) {
      cart = getCartCard(currentCartData, deliveryData);
    } else {
      cart = await getEmptyCartMessage();
    }
  } else {
    cart = await getEmptyCartMessage();
  }
  return cart;
}

// Function to refresh the cart content
export async function refreshCartContent(element) {
  const modalContentSection = element.querySelector('.modal-content');
  modalContentSection.innerHTML = '';

  // eslint-disable-next-line no-use-before-define
  const currentCart = await getCart();
  getOrderFormData();
  modalContentSection.append(currentCart);

  const hasNewCartWrapper = element.querySelector('.cart.cart-card-wrapper');
  // Check if currentCart contains the class `card-wrapper` (cart with items)
  if (hasNewCartWrapper) {
    // If cart has items, append the order form
    const cartLocalStorageData = getLocalStorageCart();
    const form = orderForm(cartLocalStorageData);
    modalContentSection.append(form);
  }
}
