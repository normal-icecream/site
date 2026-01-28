import { decorateIcons } from '../../scripts/aem.js';
import { getCatalog } from '../../scripts/scripts.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

// Function to check form inputs for valid entries
function checkInput() {
  const submitButton = document.querySelector('.table-form-submit-wrapper > button');
  const inputs = document.querySelectorAll('input[type="number"]');
  let hasAddedQuantity = false;

  inputs.forEach((input) => {
    if (parseInt(input.value, 10) > 0) {
      hasAddedQuantity = true;
    }
  });

  submitButton.disabled = !hasAddedQuantity;
}

const wholesaleFields = [
  {
    type: 'input',
    label: 'Your Business Name',
    name: 'businessName',
    placeholder: 'your business name',
    required: true,
    validation: ['no-nums'],
  },
  {
    type: 'tel',
    label: 'Phone Number',
    name: 'phone',
    required: true,
    placeholder: 'your business phone number',
    validation: ['phone:US'],
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    required: true,
    placeholder: 'your business email address',
  },
  {
    type: 'textarea',
    label: 'Special Requests / Notes',
    name: 'businessNote',
    placeholder: 'Notes',
    validation: ['no-nums'],
  },
  {
    type: 'select',
    label: 'How would you like to receive your order?',
    name: 'orderType',
    placeholder: 'How would you like to receive your order?',
    options: [
      {
        label: 'delivery',
        value: 'delivery',
      },
      {
        label: 'pickup',
        value: 'pickup',
      },
    ],
  },
  {
    type: 'date',
    label: 'pickup Date',
    name: 'pickupdate',
    dependsOn: 'orderType',
    showWhen: 'pickup',
    required: true,
  },
  {
    type: 'time',
    label: 'pickup Time',
    name: 'pickuptime',
    dependsOn: 'orderType',
    showWhen: 'pickup',
    required: true,
  },
];

export default async function decorate(block) {
  const wholesalePath = window.location.pathname.split('/').some((path) => path === 'wholesale');

  // If a block has a url in the data-src attribute
  if (block.hasAttribute('data-src') && wholesalePath) {
    const link = block.dataset.src;
    const form = document.querySelector('.table-form');

    try {
      // Fetching wholesale product data from .json URL
      const res = await fetch(link);
      const data = await res.json();
      const jsonData = data.data;
      jsonData.splice(0, 2);

      const table = document.createElement('table');
      table.id = 'wholesale-table';

      const wholesaleMap = {};
      jsonData.forEach((product) => {
        if (product.HIDE !== 'x') {
          // Standardize key name format into one word, no spaces
          const formattedProduct = {};
          Object.keys(product).forEach((key) => {
            const trimmedKey = key.replace(/\s/g, '');
            formattedProduct[trimmedKey] = product[key];
          });

          // Add key to map if it doesn't already exist otherwise add product to key
          if (!wholesaleMap[formattedProduct.TYPE]) {
            wholesaleMap[formattedProduct.TYPE] = [formattedProduct];
          } else {
            wholesaleMap[formattedProduct.TYPE].push(formattedProduct);
          }
        }
      });

      // decorate tbody
      Object.values(wholesaleMap).forEach((group, groupIndex) => {
        // Create a tbody for each group of products (grouped by TYPE).
        const tbody = document.createElement('tbody');
        const labelRow = document.createElement('tr');

        // create product title header
        const productTh = document.createElement('th');
        const productPTag = document.createElement('p');
        productPTag.textContent = group[0].TYPE;
        productTh.append(productPTag);

        // create price header
        const priceTh = document.createElement('th');
        const pricePTag = document.createElement('p');
        pricePTag.textContent = 'price per case';
        priceTh.append(pricePTag);

        // create price header
        const availableTh = document.createElement('th');
        const availablePTag = document.createElement('p');
        availablePTag.textContent = 'cases available';
        availableTh.append(availablePTag);

        // create quantity header
        const quantityTh = document.createElement('th');
        const quantityPTag = document.createElement('p');
        quantityPTag.textContent = 'cases';
        quantityTh.append(quantityPTag);

        labelRow.append(productTh, availableTh, priceTh, quantityTh);
        tbody.append(labelRow);

        // Loop over each product within the group and add table row and data
        group.forEach((product, productIndex) => {
          const productRow = document.createElement('tr');
          // Setting default height to handle CLS error
          productRow.style.height = isDesktop.matches ? '100px' : '175px';
          const productCell = document.createElement('td');

          // Add product name, description, and dietary icons if they exist.
          if (product.ITEM) {
            const item = document.createElement('h4');
            item.textContent = product.ITEM;

            if (product.DIETARY) {
              const dietaryArray = product.DIETARY.toLowerCase().split(/\s*,\s*(?:,\s*)*/);
              dietaryArray.forEach((icon) => {
                const iconSpan = document.createElement('span');
                iconSpan.className = `icon icon-${icon}`;
                item.append(iconSpan);
              });
              decorateIcons(item);
            }
            productCell.append(item);
          }

          if (product.DESCRIPTION) {
            const description = document.createElement('p');
            description.textContent = product.DESCRIPTION;
            productCell.append(description);
          }

          const availableCell = document.createElement('td');
          const available = document.createElement('h4');
          available.textContent = product.STOCKREMAINING > 0 ? product.STOCKREMAINING : 0;
          availableCell.append(available);

          const priceCell = document.createElement('td');
          const price = document.createElement('h4');
          price.textContent = product.PRICE;
          priceCell.append(price);

          // Create the quantity cell, showing either "sold out" or an input field.
          const quantityCell = document.createElement('td');
          if (product.SOLDOUT || product.STOCKREMAINING <= 0) {
            const soldoutElement = document.createElement('h4');
            soldoutElement.className = 'table-soldout';
            soldoutElement.textContent = 'sold out';
            quantityCell.append(soldoutElement);
          } else {
            const wholesaleData = JSON.parse(localStorage.getItem('wholesale'));
            const key = JSON.parse(sessionStorage.getItem('wholesaleKey')).toLowerCase();

            const itemKey = `${[product.ID]}-${groupIndex}-${productIndex}`;

            const quantityInput = document.createElement('input');
            quantityInput.value = wholesaleData[key][itemKey] ? wholesaleData[key][itemKey].amount : '';
            quantityInput.type = 'number';
            quantityInput.id = product.ID;
            quantityInput.dataset.itemName = product.ITEM;
            quantityInput.dataset.itemType = product.TYPE;
            quantityInput.min = 0;
            quantityInput.max = product.STOCKREMAINING;
            quantityInput.addEventListener('change', async (event) => {
              const inputValue = Number(event.target.value);

              const wholesale = JSON.parse(localStorage.getItem('wholesale')) || {};

              // Ensure nesting exists
              wholesale[key] ||= {};

              // If wholesaler added a value greater than 0
              if (inputValue > 0) {
                try {
                  // Get square catalog list
                  const items = await getCatalog();

                  if (items) {
                    // Get this Square item data
                    const item = items?.byId?.[product.ID];

                    if (!item) return;

                    wholesale[key][itemKey] = {
                      amount: inputValue,
                    };

                    localStorage.setItem('wholesale', JSON.stringify(wholesale));
                  }
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error(error.message);
                  return;
                }
              // removed an item from the list completely
              } else {
                delete wholesale[key][itemKey];
              }

              localStorage.setItem('wholesale', JSON.stringify(wholesale));

              checkInput();
            });

            quantityCell.append(quantityInput);
          }
          // Append product and quantity cells to the row.
          productRow.append(productCell, availableCell, priceCell, quantityCell);
          tbody.append(productRow);
        });
        // Append the tbody for this group to the table.
        table.append(tbody);
      });

      // Fetch order form data
      const wholesaleOrderFormData = JSON.parse(localStorage.getItem('orderFormData'));

      const wholesaleFieldsContainer = document.createElement('div');
      wholesaleFieldsContainer.classList.add('wholesale-fields-container');

      wholesaleFields.forEach((field) => {
        const fieldWrapper = document.createElement('div');
        fieldWrapper.dataset.fieldName = field.name;

        // hide by default if this field depends on another
        if (field.dependsOn) {
          fieldWrapper.style.display = 'none';
        }

        const label = document.createElement('label');
        label.textContent = field.label || '';
        label.htmlFor = field.name || '';
        form.append(label);

        let input;

        if (field.type === 'select') {
          const select = document.createElement('select');
          select.name = field.name || '';
          select.id = field.name || '';

          field.options.forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.append(option);
          });

          select.addEventListener('change', (e) => {
            const isPickup = e.target.value === 'pickup';

            ['pickupdate', 'pickuptime'].forEach((name) => {
              const wrapper = form.querySelector(`[data-field-name="${name}"]`);
              const schedulePickupInput = wrapper?.querySelector('input');

              if (!wrapper || !schedulePickupInput) return;

              wrapper.style.display = isPickup ? '' : 'none';
              schedulePickupInput.disabled = !isPickup;
            });
          });

          input = select;
        } else {
          input = document.createElement('input');
          input.type = field.type || '';
          input.placeholder = field.placeholder || '';
          input.required = field.required || false;
          input.name = field.name || '';
          input.id = field.name || '';
          input.value = wholesaleOrderFormData[field.name] || '';

          input.addEventListener('input', (event) => {
            const orderFormFields = JSON.parse(localStorage.getItem('orderFormData'));
            orderFormFields[field.name] = event.target.value;
            localStorage.setItem('orderFormData', JSON.stringify(orderFormFields));
          });

          if (field.dependsOn) {
            input.disabled = true;
          }
        }

        fieldWrapper.append(label, input);
        form.append(fieldWrapper);
      });

      // Add table to form in table block
      form.append(table);
    } catch (err) {
      throw new Error('no .json');
    }
  } else {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const header = !block.classList.contains('no-header');
    if (header) table.append(thead);
    table.append(tbody);

    [...block.children].forEach((child, i) => {
      const row = document.createElement('tr');
      if (header && i === 0) thead.append(row);
      else tbody.append(row);

      [...child.children].forEach((col) => {
        const cell = buildCell(header ? i : i + 1);
        cell.innerHTML = col.innerHTML;

        row.append(cell);
      });
    });
    block.innerHTML = '';
    block.append(table);
  }
}
