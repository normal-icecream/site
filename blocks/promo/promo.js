import buildForm from '../../utils/forms/forms.js';

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

function buildGQs(params) {
  let qs = '';
  Object.keys(params).forEach((key) => {
    if (key in params) {
      if (key === 'line_items') {
        qs += `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
      } else {
        qs += `${key}=${encodeURIComponent(params[key])}`;
      }
      qs += '&';
    }
  });
  return qs;
}

const signupFields = [
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'your email',
    required: true,
  },
];

function closePopup(block, popupKey) {
  // Check the session storage for the key
  const popupSessionKey = sessionStorage.getItem(popupKey);

  // If the key doesn't exist, set it and hide the block
  if (!popupSessionKey) {
    sessionStorage.setItem(popupKey, 'true');
  }

  // Hide the block (whether the sessionKey was set or not)
  block.style.display = 'none';
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

  const promoContainerContent = block.querySelector('.promo > .promo-container > div:nth-child(2)');

  const emailSignupType = promoContainerContent?.querySelector('div:nth-child(1)');
  const type = emailSignupType?.textContent;

  if (variants.includes('signup')) {
    /* eslint-disable-next-line no-inner-declarations */
    async function signupOnSubmit(data) {
      const email = data[0].value;

      const url = `${window.location.origin}/admin/script-links.json`;
      // Grab list of script links
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        if (json.data) {
          const emailListScriptData = json.data.find((link) => link.TYPE === 'email_list');

          // Set up data we want to send to populate the wholesale-inquires sheet
          if (emailListScriptData) {
            const params = {
              email,
              forWhichList: type, // grab from sheet
            };

            try {
              const form = block.querySelector('form');
              const qs = buildGQs(params);

              const hasSuccessMessage = block.querySelector('.success-message');
              if (!hasSuccessMessage) {
                const successMessage = document.createElement('div');
                successMessage.classList.add('success-message');
                successMessage.textContent = `Yay! You've successfully signed up for our ${type}!`;
                form.append(successMessage);
              }

              // Reset form
              form.reset();

              // Add interested party to sheet
              await fetch(`${emailListScriptData.SCRIPT_LINK}?${qs}`, { method: 'POST', mode: 'no-cors' });
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error updating inventory:', error.message);
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }

    const form = buildForm(signupFields, signupOnSubmit, block);

    emailSignupType.remove();

    promoContainerContent.append(form);
  }

  if (variants.includes('banner')) {
    const hasImageContainer = block.querySelector('.img-wrapper');

    const container = block.querySelector('.promo-container > div > div');

    const bannerContentWrapper = document.createElement('div');
    bannerContentWrapper.classList.add('banner-content-wrapper');

    let promoContent;

    if (hasImageContainer) {
      promoContent = Array.from(container.children).slice(1);
    } else {
      promoContent = Array.from(container.children);
    }

    promoContent.forEach((element) => bannerContentWrapper.appendChild(element));

    container.appendChild(bannerContentWrapper);
  }

  if (variants.includes('popup')) {
    // Create and set up the close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => closePopup(block, popupKey));
    promoContainer.append(closeButton);

    // block.addEventListener('click', () => closePopup(block, popupKey), false);
  }
}
