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

// export function getSandboxId(prodId) {
//     const prodToSandboxMap = JSON.parse(localStorage.getItem('prodToSandboxMap')) || [];
//     const item = prodToSandboxMap.find((item) => item.prodId === prodId);

//     if (item) {
//         return item.sandboxId;
//     } else {
//         return null;
//     }
// }

// function setSandboxId(prodId, sandboxId) {
//     const prodToSandboxMap = JSON.parse(localStorage.getItem('prodToSandboxMap')) || [];
    
//     const match = prodToSandboxMap.find(item => item.prodId === prodId);
//     if (!match) {
//       prodToSandboxMap.push({ prodId, sandboxId });
//     }
//     localStorage.setItem('prodToSandboxMap', JSON.stringify(prodToSandboxMap))
// }

// export async function getSandboxOrProdItem(squareProdItemId) {
//     const env = getEnvironment();
//     let cardItem = {};

//     // Need to make sure thism request ALWAYS hits prod
//     const prodItem = await hitProduction(getCatalogItem, squareProdItemId);
        
//     if (env === 'sandbox') {
//         const sandboxCatalogItems = await hitSandbox(getCatalogList);
//         const filteredSandboxItems = sandboxCatalogItems?.filter((item) => item.type === 'ITEM');
//         const sandboxDupeOfProdItem = filteredSandboxItems?.find((item) => item.item_data.name === prodItem.item_data.name);
    
//         if (!sandboxDupeOfProdItem) {
//             const sandboxItem = await upsertCatalogItem(prodItem);
//             cardItem = sandboxItem;
//             // setSandboxId(squareProdItemId, sandboxItem.id);
//         } else {
//             cardItem = sandboxDupeOfProdItem;
//             // setSandboxId(squareProdItemId, sandboxDupeOfProdItem.id);
//         }
//     } else {
//         cardItem = prodItem
//     }
//     return cardItem;
// }

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

// export async function upsertItemToCart(squareProdItemId) {
//     const env = getEnvironment();
//     const carts = JSON.parse(localStorage.getItem('carts'));
//     const cartKey = getLastCart();
//     const cart = carts[cartKey]?.line_items || [];
//     const cartId = env === 'sandbox' ? getSandboxId(squareProdItemId) : squareProdItemId;
//     const itemIsAlreadyInCart = cart.some((item) => env === 'sandbox' 
//         ? item.id === getSandboxId(squareProdItemId) 
//         : item.id === squareProdItemId);

//     const quantity = 1; // Default quantity for a new item
//     if (itemIsAlreadyInCart) {
//         const cartItem = cart.find((item) => item.id === cartId);
//         cartItem.quantity += quantity;
//     } else {
//         // TODO is there better logic here???
//         // TODO - I think that get card item may not need to return the entire item. Maybe just the ID and quantity????
//         let squareItem = await getSandboxOrProdItem(squareProdItemId);
//         const cartItem = cart.find((item) => item.id === squareItem.id);

//     if (cartItem) {
//         // increment
//         cartItem.quantity += quantity;
//     } else {
//         // add item to cart
//         cart?.push({
//             id: squareItem.id,
//             quantity: quantity,
//         });
//     }
//   }
//   localStorage.setItem('carts', JSON.stringify(carts));
// }

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
