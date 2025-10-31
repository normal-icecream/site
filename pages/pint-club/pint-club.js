/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
import { loadCSS } from '../../scripts/aem.js';
/* eslint-disable import/no-cycle */
import buildForm from '../../utils/forms/forms.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';

function stringTemplateParser(expression, valueObj) {
  const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
  const text = expression.replace(templateMatcher, (substring, value) => valueObj[value]);
  return text;
}

async function getDeliveryFee(deliveryMethod) {
  const url = `${window.location.origin}/admin/pint-club-shipping-fees.json`;
  let fee;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      fee = json.data.find((item) => item.DELIVERY_METHOD === deliveryMethod).FEE;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return fee;
}

async function getSubscriptionFee(subscriptionLength) {
  const url = `${window.location.origin}/admin/pint-club-subscription-fees.json`;
  let fee;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      fee = json.data.find((item) => item.SUBSCRIPTION_LENGTH === subscriptionLength).FEE;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return fee;
}

function getSubscriptionDates(subscriptionType) {
  const today = new Date();

  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const monthsToAdd = subscriptionType === 'three-months' ? 3
    : subscriptionType === 'six-months' ? 6
      : subscriptionType === 'twelve-months' ? 12 : 0;

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsToAdd - 1);

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .replace(',', '');

  return {
    signup_date: formatDate(today),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
  };
}

const addressFields = [
  {
    type: 'input',
    label: 'Your Address',
    name: 'address1',
    placeholder: 'your address',
    required: true,
  },
  {
    type: 'input',
    label: 'Address Line 2',
    name: 'address2',
    placeholder: 'Apt, suite, etc. (optional)',
    required: false,
  },
  {
    type: 'input',
    label: 'City',
    name: 'city',
    placeholder: 'Your city',
    required: true,
  },
  {
    type: 'input',
    label: 'State',
    name: 'state',
    placeholder: 'Your state',
    required: true,
  },
  {
    type: 'input',
    label: 'your zip code',
    name: 'zipcode',
    required: true,
    placeholder: 'your zip code',
  },
];

const pickupFields = [
  {
    type: 'select',
    label: 'pick up location',
    name: 'pickup-location',
    placeholder: 'select a pick up location',
    options: [
      {
        label: 'los angeles',
        value: 'la',
      },
      {
        label: 'salt lake city',
        value: 'slc',
      },
    ],
    required: true,
  },

];

const primaryFields = [
  {
    type: 'input',
    label: 'name',
    name: 'name',
    placeholder: 'your name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    type: 'tel',
    label: 'Phone Number',
    name: 'phone',
    placeholder: 'your cell',
    validation: ['phone:US'],
  },
  {
    type: 'select',
    label: 'delivery method',
    name: 'delivery-method',
    placeholder: 'select a delivery method',
    options: [
      {
        label: 'pickup',
        value: 'pickup',
        extraFields: pickupFields,
      },
      {
        label: `local delivery | $${await getDeliveryFee('delivery')}`,
        value: 'delivery',
        extraFields: addressFields,
      },
      {
        label: `national shipping | $${await getDeliveryFee('shipping')}`,
        value: 'shipping',
        extraFields: addressFields,
      },
    ],
    required: true,
  },

];

const fields = [
  {
    type: 'select',
    label: 'subscription length',
    name: 'pint-club',
    placeholder: 'select a subscription length',
    options: [
      {
        label: `3 month subscription @ $${await getSubscriptionFee('three-months')}/mo`,
        value: 'three-months',
      },
      {
        label: `6 month subscription @ $${await getSubscriptionFee('six-months')}/mo`,
        value: 'six-months',
      },
      {
        label: `12 month subscription @ $${await getSubscriptionFee('twelve-months')}/mo`,
        value: 'twelve-months',
      },
    ],
    required: true,
  },
  {
    type: 'submit',
    label: 'join pint club',
  },
];

export function buildGQs(params) {
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

function getFormVal(formData, fieldName) {
  const val = formData.find((data) => data.field === fieldName).value;
  return val ?? '';
}

// function singularize(str) {
//   return str.endsWith('s') ? str.slice(0, -1) : str;
// }

// function hyphenate(str) {
//   return str.replace(/\s+/g, '-');
// }

// function createInfoContent(container, titleText, subText) {
//     const infoCard = document.createElement('div');
//     infoCard.classList.add('info-card-title', hyphenate(titleText))

//     if (titleText) {
//         const title = document.createElement('h4');
//         title.textContent = titleText;
//         infoCard.append(title);
//     }

//     if (subText) {
//         const sub = document.createElement('p');
//         sub.textContent = subText;
//         infoCard.append(sub);
//     }

//     container.append(infoCard);

//     return infoCard;
//   }

const laAddress = '242 n ave 25 la, ca 90012';
const slcAddress = '169 e 900 s, salt lake city, ut 84111';

async function sendAddNewPintClubSubToSquare(subscriptionData) {
  const url = `${window.location.origin}/email-templates/email-templates.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const welcomeToPintClubTemplate = json.data.find((temp) => temp.NAME === 'pint_club_add_subscription');

      if (welcomeToPintClubTemplate) {
        const emailSubject = stringTemplateParser(
          welcomeToPintClubTemplate.SUBJECT,
          {
            name: subscriptionData.name,
            sub_length: subscriptionData.subscription_length,
          },
        );
        const emailBody = stringTemplateParser(
          welcomeToPintClubTemplate.BODY,
          {
            name: subscriptionData.name,
            phone: subscriptionData.phone,
            sub_length: subscriptionData.subscription_length,
            start_date: subscriptionData.start_date,
            end_date: subscriptionData.end_date,
            delivery_method: subscriptionData.delivery_method,
            delivery_fee: subscriptionData.delivery_fee,
            pickup_location: subscriptionData.pickup_location,
            pickup_address: subscriptionData.pickup_address,
            address: subscriptionData.address,
            subscription_fee: subscriptionData.subscription_fee,
            total: Number(subscriptionData.delivery_fee) + Number(subscriptionData.subscription_fee),
          },
        );

        const params = {
          template_name: 'pint_club_success',
          // replace with hi@normal.club
          recipient_email: 'andi.carlstrom@gmail.com',
          subject: emailSubject,
          body: emailBody,
        };

        try {
          const qs = buildGQs(params);
          await fetch(`${welcomeToPintClubTemplate.SCRIPT_LINK}?${qs}`, { method: 'POST' });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Error posting email content:', error);
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching email template data:', error);
  }
}

async function sendWelcomeToPintClub(subscriptionData) {
  const url = `${window.location.origin}/email-templates/email-templates.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const welcomeToPintClubTemplate = json.data.find((temp) => temp.NAME === 'pint_club_success');

      if (welcomeToPintClubTemplate) {
        const emailSubject = stringTemplateParser(
          welcomeToPintClubTemplate.SUBJECT,
        );
        const emailBody = stringTemplateParser(
          welcomeToPintClubTemplate.BODY,
          {
            name: subscriptionData.name,
            phone: subscriptionData.phone,
            sub_length: subscriptionData.subscription_length,
            start_date: subscriptionData.start_date,
            end_date: subscriptionData.end_date,
            delivery_method: subscriptionData.delivery_method,
            delivery_fee: subscriptionData.delivery_fee,
            address: subscriptionData.address,
            pickup_location: subscriptionData.pickup_location,
            pickup_address: subscriptionData.pickup_address,
            subscription_fee: subscriptionData.subscription_fee,
            total: Number(subscriptionData.delivery_fee) + Number(subscriptionData.subscription_fee),
          },
        );

        const params = {
          template_name: 'pint_club_success',
          recipient_email: subscriptionData.email,
          subject: emailSubject,
          body: emailBody,
        };

        try {
          const qs = buildGQs(params);
          await fetch(`${welcomeToPintClubTemplate.SCRIPT_LINK}?${qs}`, { method: 'POST' });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Error posting email content:', error);
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching email template data:', error);
  }
}

async function handleNewPintClubSubSubmit(data) {
  const pintClubSubLength = document.querySelector('[data-subscription-length]');
  const subscriptionLength = pintClubSubLength?.dataset.subscriptionLength;
  data.push({
    field: 'subscription-length',
    value: subscriptionLength,
  });

  const dates = getSubscriptionDates(subscriptionLength);

  // get pint_club script link
  const url = `${window.location.origin}/admin/script-links.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    if (json.data) {
      const pintClubData = json.data.find((pcd) => pcd.TYPE === 'pint_club');

      const deliveryMethod = getFormVal(data, 'delivery-method');

      if (pintClubData) {
        const params = {
          signup_date: dates.signup_date,
          end_date: dates.end_date,
          start_date: dates.start_date,
          subscription_length: getFormVal(data, 'subscription-length'),
          name: getFormVal(data, 'name'),
          email: getFormVal(data, 'email'),
          phone: getFormVal(data, 'phone'),
          address: deliveryMethod === 'pickup' ? 'N/A' : `${getFormVal(data, 'address1')} ${getFormVal(data, 'address2')} ${getFormVal(data, 'city')}, ${getFormVal(data, 'state')} ${getFormVal(data, 'zipcode')}`,
          delivery_method: getFormVal(data, 'delivery-method'),
          delivery_fee: await getDeliveryFee(getFormVal(data, 'delivery-method')),
          subscription_fee: await getSubscriptionFee(subscriptionLength),
          pickup_location: deliveryMethod === 'pickup' ? getFormVal(data, 'pickup-location') : 'N/A',
          pickup_address: getFormVal(data, 'pickup-location') === 'la' ? laAddress : slcAddress,
        };

        try {
          const form = document.querySelector('form');
          const qs = buildGQs(params);
          // Reset form
          form.reset();

          const modalContent = document.querySelector('.pint-club-signup.modal .modal-content');
          modalContent.innerHTML = '';

          const loadingContainer = document.createElement('div');
          loadingContainer.classList.add('loading-container', 'processing-container');
          loadingContainer.textContent = 'we are processing your order :)';

          modalContent.append(loadingContainer);

          // Add interested party to sheet
          await fetch(`${pintClubData.SCRIPT_LINK}?${qs}`, { method: 'POST', mode: 'no-cors' });

          // Send customer confirmation email
          await sendWelcomeToPintClub(params);

          // Send email to normal team to add new sub to square
          await sendAddNewPintClubSubToSquare(params);

          modalContent.innerHTML = '';

          const successContainer = document.createElement('div');
          successContainer.classList.add('success-container', 'processing-container');

          const successContent = document.createElement('h2');
          successContent.textContent = 'welcome to pint club!';
          successContainer.append(successContent);

          const successSubtext = document.createElement('p');
          successSubtext.textContent = 'you will receive a confirmation email and an invoice shortly!';
          successContainer.append(successSubtext);

          modalContent.append(successContainer);
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

// async function buildSummaryCard() {
//     const summaryCardContainer = document.createElement('div');
//     summaryCardContainer.classList.add('summary-card');

//     const pintClubSubLength = document.querySelector('[data-subscription-length]');
//     const subscriptionLength = pintClubSubLength?.dataset.subscriptionLength;

//     const subscriptionFee = await getSubscriptionFee(subscriptionLength);

//     const divider = document.createElement('div');
//     divider.classList.add('divider');

//     createInfoContent(
//         summaryCardContainer,
//         'summary',
//     )

//     summaryCardContainer.append(divider);

//     const testContent = document.createElement('div');
//     const summaryContent = document.createElement('h5');
//     summaryContent.textContent = `${singularize(subscriptionLength)} subscription`;
//     testContent.append(summaryContent);

//     const testTestingContent = document.createElement('h5');
//     testTestingContent.textContent = `$${singularize(subscriptionFee)}/mo`;
//     testContent.append(testTestingContent);

//     summaryCardContainer.append(testContent);

//     // const testsecondContent = document.createElement('div');
//     // const summarysecondContent = document.createElement('h5');
//     // summarysecondContent.textContent = 'shipping cost';
//     // testsecondContent.append(summarysecondContent);

//     // const testsecondTestingContent = document.createElement('h5');
//     // testsecondTestingContent.textContent = `$${deliveryFee}/mo`;
//     // testsecondContent.append(testsecondTestingContent);

//     // summaryCardContainer.append(testsecondContent);

//     return summaryCardContainer;
// }

// async function buildInfoCard() {
//     const pintClubSubLength = document.querySelector('[data-subscription-length]');
//     const subscriptionLength = pintClubSubLength?.dataset.subscriptionLength;

//     const subscriptionFee = await getSubscriptionFee(subscriptionLength);

//     const container = document.createElement('div');
//     container.classList.add('pint-club', 'info-card');

//     createInfoContent(
//         container,
//         `${singularize(subscriptionLength)} subscription | $${subscriptionFee}/mo`,
//         '4 pints per month',
//     )

//     const dates = await getSubscriptionDates(subscriptionLength);

//     createInfoContent(
//         container,
//         `start date`,
//         `${dates.start_date}`,
//     )

//     createInfoContent(
//         container,
//         `end date`,
//         `${dates.end_date}`,
//     )

//     return container;
// }

async function refreshPintClubSignupContent(element) {
  const modalContent = element.querySelector('.modal-content');
  modalContent.innerHTML = '';

  // const infoCard = await buildInfoCard();
  // const summaryCard = await buildSummaryCard();
  const form = buildForm(primaryFields, handleNewPintClubSubSubmit, element);

  modalContent.append(form);
  // modalContent.append(infoCard);
  // modalContent.append(summaryCard);

  // const deliveryMethodSelect = element.querySelector('.form-select > select[name="delivery-method"]');
  // deliveryMethodSelect.addEventListener('change', (event) => {
  //     const deliveryMethod = event.target.value;

  //     const pickupLocationSelect = element.querySelector('.form-select > select[name="pickup-location"]');
  //     if (pickupLocationSelect) {
  //         pickupLocationSelect.addEventListener('change', (event) => {
  //             const pickupLocationVal = event.target.value;
  //             const infoContent = element.querySelector('.info-card');

  //             if (infoContent) {
  //                 const pickupAddress = document.querySelector('.info-card-title.pickup-address');
  //                 if (pickupAddress) pickupAddress.remove();

  //                 createInfoContent(
  //                     infoContent,
  //                     `pickup address`,
  //                     `${pickupLocationVal === 'la' ? laAddress : slcAddress}`,
  //                 )
  //             }
  //         })
  //     }
  // })
}

function buildModal(element) {
  const pintClubSignupModal = document.createElement('div');
  pintClubSignupModal.classList.add('pint-club-signup', 'modal');
  createModal(pintClubSignupModal);
  element.append(pintClubSignupModal);
}

function handlePintClubSubRequest(data) {
  const pintClubSignupModal = document.querySelector('.pint-club-signup.modal');
  pintClubSignupModal.dataset.subscriptionLength = data[0].value;

  toggleModal(pintClubSignupModal, 'pint club subscription', refreshPintClubSignupContent);
}

/**
* retreives pint club page and inserts necessary forms for subscription sign ups and management
*/
export async function decoratePintClub(main) {
  // Load styles for pint-club page
  loadCSS(`${window.hlx.codeBasePath}/pages/pint-club/pint-club.css`);

  main.classList.add('pint-club');
  const monthlyPintClubSubContainer = main.querySelector('div:nth-child(2) .default-content-wrapper');
  const pintClubSubForm = buildForm(fields, handlePintClubSubRequest, main, 'pint club subscription');

  monthlyPintClubSubContainer.append(pintClubSubForm);

  const pintClubSignupModal = document.querySelector('.pint-club-signup.modal');

  if (!pintClubSignupModal) {
    buildModal(main, refreshPintClubSignupContent);
  }
}
