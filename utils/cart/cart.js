import { loadCSS } from '../../scripts/aem.js';
import { getCatalogItem, getCatalogList, upsertCatalogItem } from "../../api/square/catalog.js";
import { getEnvironment, hitProduction, hitSandbox } from "../../api/environmentConfig.js";

const allowedCartPages = Object.freeze([
    'store',
    'shipping',
    'merch'
]);

function getLocalStorageCarts() {
    const carts = JSON.parse(localStorage.getItem('carts'));
    return carts;
}

function getLocalStorageCart() {
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    return carts[cartKey];
}

function getEmptyCartMessage() {
    // TODO - add styling
    const noCartDiv = document.createElement('div');
    noCartDiv.textContent = 'nothing is in your cart! go pick something!';
    return noCartDiv;
}

// function getCartCard(cartItems) {
//     // Fetch catalog from Square
//     const cartCardWrapper = document.createElement('div');
//     cartCardWrapper.className = 'cart card-wrapper';

//     cartItems.forEach(item => {
//         const cartCard = document.createElement('div');
//         cartCard.className = 'cart card';
//         cartCard.textContent = item.title;
//         cartCardWrapper.append(cartCard);

//         const buttonWrapper = document.createElement('div');
//         buttonWrapper.className = 'cart card-button-wrapper';
        
//         const decrement = document.createElement('button');
//         decrement.className = 'cart card-decrement';
//         decrement.textContent = '-';
//         decrement.addEventListener('click', () => removeFromCart(item));
//         buttonWrapper.append(decrement);
        
//         const increment = document.createElement('button');
//         increment.className = 'cart card-increment';
//         increment.textContent = '+';
//         increment.addEventListener('click', () => addToCart(item));
//         buttonWrapper.append(increment);

//         cartCardWrapper.append(buttonWrapper);
//     })

//     return cartCardWrapper;
// }

export function getSandboxId(prodId) {
    const prodToSandboxMap = JSON.parse(localStorage.getItem('prodToSandboxMap')) || [];
    const item = prodToSandboxMap.find((item) => item.prodId === prodId);

    if (item) {
        return item.sandboxId;
    } else {
        return null;
    }
}

function setSandboxId(prodId, sandboxId) {
    const prodToSandboxMap = JSON.parse(localStorage.getItem('prodToSandboxMap')) || [];
    
    const match = prodToSandboxMap.find(item => item.prodId === prodId);
    if (!match) {
      prodToSandboxMap.push({ prodId, sandboxId });
    }
    localStorage.setItem('prodToSandboxMap', JSON.stringify(prodToSandboxMap))
}

export async function getSandboxOrProdItem(squareProdItemId) {
    const env = getEnvironment();
    let cardItem = {};

    // Need to make sure thism request ALWAYS hits prod
    const prodItem = await hitProduction(getCatalogItem, squareProdItemId);
        
    if (env === 'sandbox') {
        const sandboxCatalogItems = await hitSandbox(getCatalogList);
        const filteredSandboxItems = sandboxCatalogItems?.filter((item) => item.type === 'ITEM');
        const sandboxDupeOfProdItem = filteredSandboxItems?.find((item) => item.item_data.name === prodItem.item_data.name);
    
        if (!sandboxDupeOfProdItem) {
            const sandboxItem = await upsertCatalogItem(prodItem);
            cardItem = sandboxItem;
            setSandboxId(squareProdItemId, sandboxItem.id);
        } else {
            cardItem = sandboxDupeOfProdItem;
            setSandboxId(squareProdItemId, sandboxDupeOfProdItem.id);
        }
    } else {
        cardItem = prodItem
    }
    return cardItem;
}

export async function upsertItemToCart(squareProdItemId) {
    const env = getEnvironment();
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    const cart = carts[cartKey]?.line_items || [];
    const cartId = env === 'sandbox' ? getSandboxId(squareProdItemId) : squareProdItemId;
    const itemIsAlreadyInCart = cart.some((item) => env === 'sandbox' 
        ? item.id === getSandboxId(squareProdItemId) 
        : item.id === squareProdItemId);

    const quantity = 1; // Default quantity for a new item
    if (itemIsAlreadyInCart) {
        const cartItem = cart.find((item) => item.id === cartId);
        cartItem.quantity += quantity;
    } else {
        // TODO is there better logic here???
        // TODO - I think that get card item may not need to return the entire item. Maybe just the ID and quantity????
        let squareItem = await getSandboxOrProdItem(squareProdItemId);
        const cartItem = cart.find((item) => item.id === squareItem.id);

    if (cartItem) {
        // increment
        cartItem.quantity += quantity;
    } else {
        // add item to cart
        cart?.push({
            id: squareItem.id,
            quantity: quantity,
        });
    }
  }
  localStorage.setItem('carts', JSON.stringify(carts));
}

export function getCartItemQuantity(prodId) {
    const env = getEnvironment();
    const cart = getLocalStorageCart();
    const id = env === 'sandbox' ? getSandboxId(prodId) : prodId;
    const itemQuantity = cart?.line_items.find((item) => item.id === id)?.quantity;
    const quantity = itemQuantity ? itemQuantity : 0;

    return quantity;
}

export function removeFromCart(itemId) {
    console.log("itemId:", itemId);
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

export function getCart(cartKey) {
    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/utils/cart/cart.css`);

    const isCartPage = cartKey.length > 0 && cartKey !== 'about';
    if (isCartPage) setLastCart(cartKey);

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
            if (currentCartData.length > 0) {
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
