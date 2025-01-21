import { loadCSS } from '../../scripts/aem.js';
import { getCatalogItem } from "../../api/square/catalog.js";
import { hitProduction } from "../../api/environmentConfig.js";

// TODO - fix logic so when Store page is clicked store cart is added to localstorage. same for the other cart valid pages!
const allowedCartPages = Object.freeze([
    'store',
    'shipping',
    'merch'
]);

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

export async function addItemToCart(id) {
    const carts = JSON.parse(localStorage.getItem('carts'));
    const cartKey = getLastCart();
    const cart = carts[cartKey];
    const cartItem = cart?.line_items.find((item) => item.id === id);
    
    const quantity = 1; // Default quantity for a new item
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        const prodItem = await hitProduction(getCatalogItem, id);
        cart.line_items.push({
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

export function getCart(cartKey) {
    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/pages/cart/cart.css`);

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
