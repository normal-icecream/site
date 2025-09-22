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
  const variants = [...block.classList];

  const popupTitle = block.querySelector('h3');
  const popupKey = `${cleanString(popupTitle.textContent)}-closed`;

  const sessionKey = sessionStorage.getItem(popupKey);
  // If the session key exists, hide the block
  if (sessionKey) {
    block.style.display = 'none';
  }

  const promoContainer = document.createElement('div');
  promoContainer.classList.add('promo-container');

  const blockChildrenArr = Array.from(block.children);

  blockChildrenArr.forEach((child) => {
    promoContainer.append(child);
  });
  block.append(promoContainer);

  if (variants.includes('popup')) {
    // Create and set up the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => {
      // Check the session storage for the key
      const popupSessionKey = sessionStorage.getItem(popupKey);

      // If the key doesn't exist, set it and hide the block
      if (!popupSessionKey) {
        sessionStorage.setItem(popupKey, 'true');
      }

      // Hide the block (whether the sessionKey was set or not)
      block.style.display = 'none';
    });
    promoContainer.append(closeButton);
  }
}
