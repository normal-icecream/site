import { decorateIcons } from '../../scripts/aem.js';

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
  // If a block has a url in the data-src attribute
  if (block.hasAttribute('data-src')) {
    const link = block.dataset.src;
    const form = document.querySelector('.table-form');

    try {
      // Fetching wholesale product data from .json URL
      const res = await fetch(link);
      const data = await res.json();
      const jsonData = data.data;

      const table = document.createElement('table');

      const wholesaleMap = {};
      jsonData.forEach((product) => {
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

        // create quantity header
        const quantityTh = document.createElement('th');
        const quantityPTag = document.createElement('p');
        quantityPTag.textContent = 'quantity';
        quantityTh.append(quantityPTag);

        labelRow.append(productTh, quantityTh);
        tbody.append(labelRow);

        // Loop over each product within the group and add table row and data
        group.forEach((product) => {
          const productRow = document.createElement('tr');
          const productCell = document.createElement('td');

          // Add product name, description, and dietary icons if they exist.
          if (product.ITEM) {
            const item = document.createElement('p');
            item.textContent = product.ITEM;
            productCell.append(item);
          }

          if (product.DESCRIPTION) {
            const description = document.createElement('p');
            description.textContent = product.DESCRIPTION;
            productCell.append(description);
          }

          if (product.DIETARY) {
            const dietaryArray = product.DIETARY.toLowerCase().split(/\s*,\s*(?:,\s*)*/);

            const imageWrapper = document.createElement('p');
            imageWrapper.className = 'img-wrapper';

            // for every icon create a span and add a classname that matches the dietary item name
            dietaryArray.forEach((item) => {
              const iconSpan = document.createElement('span');
              iconSpan.className = `icon icon-${item}`;
              imageWrapper.append(iconSpan);
            });
            decorateIcons(imageWrapper);
            productCell.append(imageWrapper);
          }

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
            quantityInput.value = 0;
            quantityInput.min = 0;
            quantityInput.max = product.AVAILABLE;
            quantityInput.addEventListener('input', () => checkInput());
            quantityCell.append(quantityInput);
          }
          // Append product and quantity cells to the row.
          productRow.append(productCell, quantityCell);
          tbody.append(productRow);
        });
        // Append the tbody for this group to the table.
        table.append(tbody);
      });
      // Add table toto form in table block
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
