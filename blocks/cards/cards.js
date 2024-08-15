import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'cards-card-content'
    const li = document.createElement('li');

    while (row.firstElementChild) contentWrapper.append(row.firstElementChild);

    [...contentWrapper.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    li.append(contentWrapper);

    // Card Update
    const cartUpdateWrapper = document.createElement('div');
    cartUpdateWrapper.className = 'cards-card-cart-update';

    const decrementWrapper = document.createElement('div');
    decrementWrapper.className = 'cards-card-circle-button';
    const decrementButton = document.createElement('button');
    decrementButton.setAttribute('type', 'button');
    decrementButton.innerHTML = '-'
    decrementButton.addEventListener('click', () => console.log('decrement clicked'));
    decrementWrapper.append(decrementButton)
    cartUpdateWrapper.append(decrementWrapper);

    const cartItemCount = document.createElement('div');
    cartItemCount.setAttribute('type', 'text');
    cartItemCount.className = 'cards-card-cart-item-count'
    cartItemCount.innerHTML = '0'; // TODO - dynamically add item count
    cartUpdateWrapper.append(cartItemCount);

    const incrementWrapper = document.createElement('div');
    incrementWrapper.className = 'cards-card-circle-button';
    const incrementButton = document.createElement('button');
    incrementButton.setAttribute('type', 'button');
    incrementButton.innerHTML = '+'
    incrementButton.addEventListener('click', () => console.log('increment clicked'));
    incrementWrapper.append(incrementButton)
    cartUpdateWrapper.append(incrementWrapper);

    li.append(cartUpdateWrapper);
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}

{/* <ul>
  <li>
    <div class='cards-card-content'>
      <div class='cards-card-image'></div>
      <div class='cards-card-body'></div>
    </div>
    <div class='cards-card-cart-update'>
      <div class='cards-card-decrement-button'></div>
      <div class='cards-card-itemcount'></div>
      <div class='cards-card-increment-button'></div>
    </div>
  </li>
</ul> */}
