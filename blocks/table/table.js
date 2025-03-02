import { decorateIcons } from '../../scripts/aem.js';

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

export default async function decorate(block) {
  const wholesale = window.location.pathname.split('/').some((path) => path === 'wholesale');

  // If a block has a url in the data-src attribute
  if (block.hasAttribute('data-src') && wholesale) {
    const link = block.dataset.src;
    const form = document.querySelector('.table-form');

    try {
      // Fetching wholesale product data from .json URL
      const res = await fetch(link);
      const data = await res.json();
      const jsonData = data.data;
      jsonData.splice(0, 2);

      const table = document.createElement('table');

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
      Object.values(wholesaleMap).forEach((group) => {
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
        pricePTag.textContent = 'price';
        priceTh.append(pricePTag);

        // create price header
        const availableTh = document.createElement('th');
        const availablePTag = document.createElement('p');
        availablePTag.textContent = 'available';
        availableTh.append(availablePTag);

        // create quantity header
        const quantityTh = document.createElement('th');
        const quantityPTag = document.createElement('p');
        quantityPTag.textContent = 'quantity';
        quantityTh.append(quantityPTag);

        labelRow.append(productTh, availableTh, priceTh, quantityTh);
        tbody.append(labelRow);

        // Loop over each product within the group and add table row and data
        group.forEach((product) => {
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
          available.textContent = product.AVAILABLE;
          availableCell.append(available);

          const priceCell = document.createElement('td');
          const price = document.createElement('h4');
          price.textContent = product.PRICE;
          priceCell.append(price);

          // Create the quantity cell, showing either "sold out" or an input field.
          const quantityCell = document.createElement('td');
          if (product.SOLDOUT) {
            const soldoutElement = document.createElement('p');
            soldoutElement.className = 'table-soldout';
            soldoutElement.textContent = 'sold out';
            quantityCell.append(soldoutElement);
          } else {
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = product.ID;
            quantityInput.dataset.itemName = product.ITEM;
            quantityInput.dataset.itemType = product.TYPE;
            quantityInput.min = 0;
            quantityInput.max = product.AVAILABLE;
            quantityInput.addEventListener('input', () => checkInput());
            quantityCell.append(quantityInput);
          }
          // Append product and quantity cells to the row.
          productRow.append(productCell, availableCell, priceCell, quantityCell);
          tbody.append(productRow);
        });
        // Append the tbody for this group to the table.
        table.append(tbody);
      });
      // Add table to form in table block
      form.prepend(table);
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
