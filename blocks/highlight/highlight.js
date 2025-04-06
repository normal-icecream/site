import { decorateIcons } from '../../scripts/aem.js';
import { swapIcons } from '../../scripts/scripts.js';

function cleanString(inputString) {
  // Remove emojis using a regular expression
  const stringWithoutEmojis = inputString.replace(
    /[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
    '',
  );

  const stringWithDashes = stringWithoutEmojis
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  return stringWithDashes;
}

export default function decorate(block) {
  const highlightContainer = block.querySelector('div');
  const highlightTitle = block.querySelector('h3');
  const highlightKey = `${cleanString(highlightTitle.textContent)}-closed`;

  const sessionKey = sessionStorage.getItem(highlightKey);
  // If the session key exists, hide the block
  if (sessionKey) {
    block.style.display = 'none';
  }

  // Create and set up the close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.classList.add('close-button');
  closeButton.addEventListener('click', () => {
    // Check the session storage for the key
    const highlightSessionKey = sessionStorage.getItem(highlightKey);

    // If the key doesn't exist, set it and hide the block
    if (!highlightSessionKey) {
      sessionStorage.setItem(highlightKey, 'true');
    }

    // Hide the block (whether the sessionKey was set or not)
    block.style.display = 'none';
  });
  highlightContainer.append(closeButton);

  // Select promo message element
  const promoMessage = block.querySelector('.highlight > div:nth-child(2)');
  if (promoMessage) {
    const copy = promoMessage.querySelector('div');
    const starburstContainer = document.createElement('div');
    const starburstSpan = document.createElement('span');
    starburstSpan.className = 'icon icon-starburst';
    starburstContainer.append(starburstSpan);
    // add starburt to DOM
    copy.append(starburstContainer);
    // then decorate icons
    decorateIcons(starburstContainer);
    // then swap icons
    swapIcons();
  }
}
