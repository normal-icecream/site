import { removeEmptyElements } from '../../helpers/helpers.js';

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function buildTable(block, table) {
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

export default async function decorate(block) {
  const tableElement = document.querySelectorAll('table');

  // Create a new table element and add block table content to it.
  if (tableElement.length === 0) {
    const table = document.createElement('table');
    buildTable(block, table);
  }

  // If a table exists in the dom, add to it instead of creating a
  // new one and then add block table content to it.
  if (tableElement.length === 1) {
    buildTable(block, tableElement[0]);
  }

  // Remove empty '.table.block' and '.table-wrapper' elements
  removeEmptyElements('.table-container .table.block');
  removeEmptyElements('.table-wrapper');
}
