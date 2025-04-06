export default async function decorate(block) {
  // get all rows in the block
  const rows = [...block.children];

  // process each row as an accordion using details/summary
  rows.forEach((row, i) => {
    const [title, content] = [...row.children];

    // create details element (accordion item)
    const details = document.createElement('details');

    // create summary element (accordion header)
    const summary = document.createElement('summary');
    summary.textContent = title.textContent.trim();

    // create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'accordion-content';
    const flat = [...content.firstElementChild.children].map((c) => c.firstElementChild);
    contentContainer.append(...flat);

    // replace row with details element
    details.append(summary, contentContainer);
    row.replaceWith(details);

    // scroll open summary into view
    details.addEventListener('toggle', () => {
      if (details.open) {
        summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
