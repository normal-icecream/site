import { loadCSS } from '../../scripts/aem.js';
import { getCatalogItem, getCatalogList, upsertCatalogItem } from "../../api/square/catalog.js";
import { hitSandbox } from "../../api/sandboxConfig.js";

const allowedCartPages = Object.freeze([
    'store',
    'shipping',
    'merch'
]);

// carts: {
//     'store': {
//         'line_items': [
//                 {
//                     'catalog_object_id':'A1',
//                     'fp': 'A1-wholemilkId', 
//                     'quantity': 1,
//                     'modifiers': [
//                         { 'id': 'wholemilkId' },
//                     ]
//                 },
//                 {
//                     'id':'A1',
//                     'fp': 'A1-oatMilkId', 
//                     'quantity': 1,
//                     'modifiers': [
//                         { 'id': 'oatMilkId' },
//                     ]
//                 },
//         ],
//     },
//     'shipping': {
//         'last_updated': '',
//         'line_items': [],
//     },
//     'merch': {
//         'last_updated': '',
//         'line_items': [],
//     },
//     'lastcart': ''
// }

// function CartCatalogObject(id, quantity, modifiers) {
//     this.catalog_object_id = id;
//     this.quantity = quantity;
//     this.fp = id + '-' + modifiers.id; // obvi needs to be smarter
//     this.modifiers = modifiers;
// }

function getEmptyCartMessage() {
    // TODO - add styling
    const noCartDiv = document.createElement('div');
    noCartDiv.textContent = 'nothing is in your cart! go pick something!';
    return noCartDiv;
}

function getCartCard(cartItems) {
    // Fetch catalog from Square
    const cartCardWrapper = document.createElement('div');
    cartCardWrapper.className = 'cart card-wrapper';

    cartItems.forEach(item => {
        const cartCard = document.createElement('div');
        cartCard.className = 'cart card';
        cartCard.textContent = item.title;
        cartCardWrapper.append(cartCard);

        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'cart card-button-wrapper';
        
        const decrement = document.createElement('button');
        decrement.className = 'cart card-decrement';
        decrement.textContent = '-';
        decrement.addEventListener('click', () => removeFromCart(item));
        buttonWrapper.append(decrement);
        
        const increment = document.createElement('button');
        increment.className = 'cart card-increment';
        increment.textContent = '+';
        increment.addEventListener('click', () => addToCart(item));
        buttonWrapper.append(increment);

        cartCardWrapper.append(buttonWrapper);
    })

    return cartCardWrapper;
}

// function createCatalogItem(id, quantity, modifiers) {

// }

export async function upsertItemToCart(prodSquareItemId) {
    const prodItem = await getCatalogItem(prodSquareItemId);
    console.log("prodItem:", prodItem);

    const prodCatalog = await getCatalogList();
    console.log("prodCatalog:", prodCatalog);

    const sandboxCatalogItems = await hitSandbox(getCatalogList);
    console.log("sandboxCatalogItems:", sandboxCatalogItems);

    if (prodItem && sandboxCatalogItems) {
        const filteredSandboxItems = sandboxCatalogItems.filter((item) => item.type === 'ITEM');
        const prodItemIsInSandboxAccount = filteredSandboxItems.find((item) => item.item_data.name === prodItem.item_data.name)
        console.log("prodItemIsInSandboxAccount:", prodItemIsInSandboxAccount);

        if (!prodItemIsInSandboxAccount) {
            const item = await hitSandbox(upsertCatalogItem, prodItem);
            console.log("item:", item);
        }
    }

    // If on Localhost or .page URL > get prodItemId > Check to see if there is an equavalent prodItem in sandbox > if there is, use that ID for all requests, if not add one to sandbox and use that one's Id to make requests going forward.

    // If .live or .club URL ? get prodId and use that for all requests

    // Double check that worker is working properly to route requests based on URL.
    

    // const carts = JSON.parse(localStorage.getItem('carts'));
    // console.log("carts:", carts);
    // const lastCart = getLastCart();
    // console.log("lastCart:", lastCart);

    // If object doesn't already exist in line_items for cart then add to line_items
    // If it does exist, update item
    // If a mod or variation has been added then create new item in list with unique & easily queriable fp
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
