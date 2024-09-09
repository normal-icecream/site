function buildCell(rowIndex) {
    const cell = rowIndex ? document.createElement('td') : document.createElement('th');
    if (!rowIndex) cell.setAttribute('scope', 'col');
    return cell;
  }
  
  export default async function decorate(block) {
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
        const icons = col.querySelector('p.img-wrapper');

        if (icons) {
            const cell = buildCell(header ? i : i + 1);

            const wrapper = document.createElement('div');
            wrapper.className = 'table-icon-wrapper';

            const contentDiv = document.createElement('div');
            const title = col.querySelector('h3');
            const content = col.querySelector('p');
            contentDiv.append(title, content);
            
            const iconsDiv = document.querySelector('p.img-wrapper');

            wrapper.append(contentDiv, iconsDiv);
            cell.append(wrapper);
            row.append(cell);
        } else {
            const cell = buildCell(header ? i : i + 1);
            cell.innerHTML = col.innerHTML;
            
            row.append(cell);
        }
      });
    });
    block.innerHTML = '';
    block.append(table);
  }