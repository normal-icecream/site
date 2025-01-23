import { loadCSS } from '../../scripts/aem.js';

// TODO - fix logic so when Store page is clicked store cart is added to localstorage. same for the other cart valid pages!
export const allowedCartPages = Object.freeze([
    'store',
    'shipping',
    'merch'
]);

function getLocalStorageCatalogItem(id) {
    const list = JSON.parse(localStorage.getItem('catalogList'));
    const item = list.find((item) => item.id === id);
    if (item) {
        return item
    } else {
        return {};
    }
}

function getLocalStorageCart() {
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    return carts[cartKey];
}

function getEmptyCartMessage() {
    const noCartDiv = document.createElement('div');
    noCartDiv.className = 'empty-cart-message';
    noCartDiv.textContent = 'nothing is in your cart! go pick something!';
    return noCartDiv;
}

function getCartCard(cartItems) {
    console.log("cartItems:", cartItems);
    // Fetch catalog from Square
    const cartCardWrapper = document.createElement('div');
    cartCardWrapper.className = 'cart card-wrapper';

    cartItems.line_items.forEach(item => {
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

        const description = document.createElement('div');
        description.className = 'cart cart-description';
        description.textContent = item.description;
        cartCardWrapper.append(description);

        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'cart card-button-wrapper';
        
        const decrement = document.createElement('button');
        decrement.className = 'cart card-decrement';
        decrement.textContent = '-';
        decrement.addEventListener('click', () => removeItemFromCart(item.id));
        buttonWrapper.append(decrement);
        
        const increment = document.createElement('button');
        increment.className = 'cart card-increment';
        increment.textContent = '+';
        increment.addEventListener('click', () => addItemToCart(item.id));
        buttonWrapper.append(increment);

        cartCardWrapper.append(buttonWrapper);
    })

    return cartCardWrapper;
}

export function addItemToCart(id) {
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    const cart = carts[cartKey];
    const cartItem = cart?.line_items.find((item) => item.id === id);
    
    const quantity = 1; // Default quantity for a new item
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        const prodItem = getLocalStorageCatalogItem(id);
        cart?.line_items.push({
            id: prodItem.id,
            quantity: quantity,
            price: prodItem.item_data.variations[0].item_variation_data.price_money.amount,
            description: prodItem.item_data.description,
            name: prodItem.item_data.name
        });
    }
    localStorage.setItem(`carts`, JSON.stringify(carts));
}

export function removeItemFromCart(id) {
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    const cart = carts[cartKey];
    const cartItem = cart?.line_items.find((item) => item.id === id);

    if (cartItem.quantity > 1) {
        cartItem.quantity--;
    } else {
        const cartIndex = cart.line_items.findIndex((item) => item.id === id);
        cart.line_items.splice(cartIndex, 1);
    }
    localStorage.setItem(`carts`, JSON.stringify(carts));
}

export function getCartItemQuantity(prodId) {
    const cart = getLocalStorageCart();
    const itemQuantity = cart?.line_items.find((item) => item.id === prodId)?.quantity;
    const quantity = itemQuantity ? itemQuantity : 0;

    return quantity;
}

export function setLastCart(pageName) {
    const normalCart = JSON.parse(localStorage.getItem('carts'));
    if (normalCart && allowedCartPages.includes(pageName)) {
        normalCart['lastcart'] = pageName;
        localStorage.setItem('carts', JSON.stringify(normalCart));
    }
}

export function getLastCart() {
    const normalCart = JSON.parse(localStorage.getItem('carts'));
    return normalCart ? normalCart['lastcart'] : '';
}

export function getCart() {
    loadCSS(`${window.hlx.codeBasePath}/pages/cart/cart.css`);

    let cart = [];
    const cartData = JSON.parse(localStorage.getItem('carts'));
    if (!cartData) {
        localStorage.setItem('carts', JSON.stringify({
            'store': {
                'line_items': [],
            },
            'shipping': {
                'line_items': [],
            },
            'merch': {
                'line_items': [],
            },
            'lastcart': ''
        }));
        cart = getEmptyCartMessage();
    } else {
        if (cartData['lastcart'].length > 0) {
            const currentCartData = cartData[cartData['lastcart']];
            if (currentCartData.line_items.length > 0) {
                cart = getCartCard(currentCartData);
            } else {
                cart = getEmptyCartMessage();
            }
        } else {
            cart = getEmptyCartMessage();
        }
    }
    return cart;
}
