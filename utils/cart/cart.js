import { loadCSS } from '../../scripts/aem.js';

const allowedCartPages = Object.freeze([
    'pick-up',
    'catering',
    'shipping',
    'wholesale',
    'merch'
]);

function getEmptyCartMessage() {
    // TODO - add styling
    const noCartDiv = document.createElement('div');
    noCartDiv.textContent = 'nothing is in your cart! go pick something!';
    return noCartDiv;
}

function getCartCard(cartItems) {
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

export function addToCart(itemId, title) {
    const normalCart = JSON.parse(localStorage.getItem('normal-cart'));
    const lastCart = getLastCart();
    const cartToUpdate = normalCart[lastCart];
    // console.log("cartToUpdate:", cartToUpdate);
    
    // if (cartToUpdate['line_items'].length > 0) {
    //     const itemToUpdate = cartToUpdate['line_items'][itemId];
    //     console.log("itemToUpdate:", itemToUpdate);


    // } else {
    //     cartToUpdate['line_items'].push({
    //         id: itemId,
    //         quantity: 1,
    //         title,
    //     })
    // }

    // console.log(cartToUpdate)

    // adds new item if it doesn't already exist
    // if it does exist then update item by one
}

export function removeFromCart(itemId, title) {
    // console.log('hitting removeItemFromCart');
    const lastCart = getLastCart();
    // console.log("lastCart:", lastCart);

    // Decrements item quantity by one it it exists
    // removes last item from cart
}

export function setLastCart(pageName) {
    const normalCart = JSON.parse(localStorage.getItem('normal-cart'));
    if (normalCart && allowedCartPages.includes(pageName)) {
        normalCart['last-cart'] = pageName;
        localStorage.setItem('normal-cart', JSON.stringify(normalCart));
    }
}

export function getLastCart() {
    const normalCart = JSON.parse(localStorage.getItem('normal-cart'));
    return normalCart ? normalCart['last-cart'] : '';
}

export function getCart(cartKey) {
    // Load styles for form
    loadCSS(`${window.hlx.codeBasePath}/utils/cart/cart.css`);

    const isCartPage = cartKey.length > 0 && cartKey !== 'about';
    if (isCartPage) setLastCart(cartKey);

    let cart = [];
    const cartData = JSON.parse(localStorage.getItem('normal-cart'));
    if (!cartData) {
        localStorage.setItem('normal-cart', JSON.stringify({
            'pick-up': {
                'last_updated': '',
                'line_items': [],
            },
            'shipping': {
                'last_updated': '',
                'line_items': [],
            },
            'wholesale': {
                'last_updated': '',
                'line_items': [],
            },
            'catering': {
                'last_updated': '',
                'line_items': [],
            },
            'merch': {
                'last_updated': '',
                'line_items': [],
            },
            'last-cart': ''
        }));
        cart = getEmptyCartMessage();
    } else {
        if (cartData['last-cart'].length > 0) {
            const currentCartData = cartData[cartData['last-cart']];
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



// {
//     "location_id": "RXJXAWG01MBF5",
//     "customer_id": "",
//     'pick-up': [
//         'last-updated': ''
//         "line_items": [
//             'quantity': '3'
//         ],
//     ],
//     'shipping': [
//         'last-updated': ''
//         "line_items": [],
//     ],
//     'wholesale': [
//         'last-updated': ''
//         "line_items": [],
//     ],
//     'catering': [
//         'last-updated': ''
//         "line_items": [],
//     ],
//     'last-cart': '',
//     'meta-data': {
//         'cart-total': '',

//     }
// }
