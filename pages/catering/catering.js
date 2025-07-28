/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-cycle */
import { loadCSS } from '../../scripts/aem.js';
import buildForm from '../../utils/forms/forms.js';

const fields = [
  {
    type: 'input',
    label: 'Your Name',
    name: 'name',
    placeholder: 'Enter your name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Company',
    name: 'companyName',
    placeholder: 'your company name',
    validation: ['no-nums'],
  },
  {
    type: 'input',
    label: 'Location',
    name: 'location',
    placeholder: 'Where will this even be catered?',
    required: true,
  },
  {
    type: 'input',
    label: 'Type of event',
    name: 'eventType',
    placeholder: 'What type of event do you want catered?',
    required: true,
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    placeholder: 'your email',
    required: true,
  },
  {
    type: 'number',
    label: 'Number of people',
    name: 'numOfPeople',
    value: 0, // default value
    required: true,
  },
  {
    type: 'date',
    label: 'Event Date',
    name: 'date',
    required: true,
  },
  {
    type: 'time',
    label: 'Event Time',
    name: 'time',
    required: true,
  },
  {
    type: 'textarea',
    label: 'What are you interested in?',
    name: 'productInterest',
    placeholder: 'e.g., ice cream bars, sandos, pints, tubs to scoop etc.',
    required: true,
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

/**
* Sets up catering form
*/
export async function decorateCatering(main) {
  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/catering/catering.css`);

  const cateringFormContainer = main.querySelector('.catering > div:nth-child(2) > div > div:nth-child(2)');
  cateringFormContainer.classList.add('catering-container');

  async function handleCateringRequest(formData) {
    const name = formData.find((data) => data.field === 'name').value;
    const companyName = formData.find((data) => data.field === 'companyName').value;
    const location = formData.find((data) => data.field === 'location').value;
    const eventType = formData.find((data) => data.field === 'eventType').value;
    const email = formData.find((data) => data.field === 'email').value;
    const numOfPeople = formData.find((data) => data.field === 'numOfPeople').value;
    const date = formData.find((data) => data.field === 'date').value;
    const time = formData.find((data) => data.field === 'time').value;
    const productInterest = formData.find((data) => data.field === 'productInterest').value;

    const subject = encodeURIComponent('catering request');
    const body = encodeURIComponent(
      `Name: ${name}\nCompany Name: ${companyName}\nLocation: ${location}\nEvent Type: ${eventType}\nEmail: ${email}\nNumber of People: ${numOfPeople}\nEvent Date: ${date}\nEvent Time: ${time}\nProduct Interest: ${productInterest}`,
    );

    const mailtoLink = `mailto:catering@normal.club;tatiana@normal.club?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    // get catering_inquiries script link
    const url = `${window.location.origin}/admin/script-links.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json = await response.json();
      if (json.data) {
        const cateringScriptData = json.data.find((data) => data.TYPE === 'catering_inquiry');
        // Set up data we want to send in wholesaler inquiry email and
        // to populate the wholesale-inquires sheet
        if (cateringScriptData) {
          const params = {
            name,
            company_name: companyName,
            inquiry_date: new Date(),
            location,
            email,
            event_type: eventType,
            num_of_people: numOfPeople,
            date,
            time,
            product_interest: productInterest,
          };

          try {
            const form = document.querySelector('form');
            const qs = buildGQs(params);
            // Reset form
            form.reset();

            // Add interested party to sheet
            await fetch(`${cateringScriptData.SCRIPT_LINK}?${qs}`, { method: 'POST', mode: 'no-cors' });
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

  const cateringForm = buildForm(fields, handleCateringRequest, main, 'Send catering request');
  cateringForm.classList.add('catering-form');
  cateringFormContainer.append(cateringForm);
}
