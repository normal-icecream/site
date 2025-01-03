import { loadCSS } from '../../scripts/aem.js';

export function setLastCart(pageName) {
    const normalCart = JSON.parse(localStorage.getItem('normal-cart'));
    if (normalCart) {
        normalCart['last-cart'] = pageName;
        localStorage.setItem('normal-cart', JSON.stringify(normalCart));
    }
}

export function getLastCart() {
    const normalCart = JSON.parse(localStorage.getItem('normal-cart'));
    return normalCart ? normalCart['last-cart'] : '';
}

export function getEmptyCartMessage() {
    // TODO - add styling
    const noCartDiv = document.createElement('div');
    noCartDiv.textContent = 'nothing is in your cart! go pick something!';
    return noCartDiv;
}

export function getCartCard(cartItems) {
    const cartCardWrapper = document.createElement('div');
    cartCardWrapper.className = 'cart-card-wrapper';

    cartItems.forEach(item => {
        const cartCard = document.createElement('div');
        cartCard.className = 'cart-card';
        cartCard.textContent = item.title;

        cartCardWrapper.append(cartCard);
    })

    return cartCardWrapper;
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
            'pick-up': [],
            'shipping': [],
            'wholesale': [],
            'catering': [],
            'last-cart': ''
        }))
        
        cart = getEmptyCartMessage();
    } else {
        if (cartData['last-cart'].length > 0) {
            const currentCartData = cartData[cartData['last-cart']];
            console.log("currentCartData:", currentCartData);

            if (currentCartData.length > 0) {
                // const decoratedCart = getCartCard();
                cart = getCartCard(currentCartData);
            } else {
                cart = getEmptyCartMessage();
            }

            // cart = currentCartData.length > 0 ? currentCartData : getEmptyCartMessage();

        } else {
            cart = getEmptyCartMessage();
        }
    }

    console.log(cart)
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
