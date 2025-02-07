export default function decorate(block) {
  const variants = [...block.classList];
  [...block.children].forEach((row) => {
    // TODO - need to add counter to title, should be set up when doing Square integration

    // decorate price tag
    if (variants.includes('price')) {
      const price = row.querySelector('p > strong');
      if (price) {
        const svgPath = '../../icons/pricetag.svg';

        const divContainer = row.querySelector('.title.price > div > div');

        const p = divContainer.querySelector('p:has(strong)');
        p.className = 'title-price';

        // separate out price tag amount & subtext
        const dollarAmount = price.textContent.match(/\$\d+/)[0];
        const subtext = price.textContent.replace(dollarAmount, '').trim();

        // containing div to prevent content from rotating with the animated price tag
        const contentDiv = document.createElement('div');
        contentDiv.className = 'title-price-content';

        const amountDiv = document.createElement('div');
        amountDiv.textContent = dollarAmount;
        amountDiv.className = 'title-price-amount';

        const textContentLength = price.textContent.length;
        const subtextDiv = document.createElement('div');
        subtextDiv.textContent = subtext;
        subtextDiv.className = textContentLength > 10 ? 'title-price-subtext title-price-long-subtext' : 'title-price-subtext';

        contentDiv.append(amountDiv, subtextDiv);

        const strongElement = p.querySelector('strong');
        strongElement.replaceWith(contentDiv);

        const span = document.createElement('span');

        fetch(svgPath)
          .then((response) => response.text())
          .then((svgContent) => {
            span.innerHTML = svgContent;
            p.append(span);
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.log('error loading svg:', error);
          });
      }
    }
  });
}
