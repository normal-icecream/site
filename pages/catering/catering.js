/* eslint-disable import/prefer-default-export */
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

/**
* Sets up catering form
*/
export async function decorateCatering(main) {
  // Load styles for form
  loadCSS(`${window.hlx.codeBasePath}/pages/catering/catering.css`);

  const cateringFormContainer = main.querySelector('.catering > div:nth-child(2) > div > div:nth-child(2)');
  cateringFormContainer.classList.add('catering-container');

  function handleCateringRequest(formData) {
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

    const mailtoLink = `mailto:hi@normal.club?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  }

  const cateringForm = buildForm(fields, handleCateringRequest, main, 'Send catering request');
  cateringForm.classList.add('catering-form');
  cateringFormContainer.append(cateringForm);
}
