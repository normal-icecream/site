export default function decorate(block) {
    const variants = [...block.classList];
    [...block.children].forEach((row) => {

        // TODO - need to add counter to title, should be set up when doing Square integration

        // decorate price tag
        if (variants.includes('price')) {
            const price = row.querySelector('p > strong');
            if(price) {
                const p = price.closest('p');
                if(p.textContent === price.textContent) {
                    p.className = 'title-price';

                    const textContentLength = price.textContent.length;
                    console.log("textContentLength:", textContentLength);

                    const dollarAmount = price.textContent.match(/\$\d+/)[0];
                    const remainingContent = price.textContent.replace(dollarAmount, '').trim();
                    
                    const amountDiv = document.createElement('div');
                    amountDiv.textContent = dollarAmount;
                    amountDiv.className = 'title-price-amount';

                    const remainingContentDiv = document.createElement('div');
                    remainingContentDiv.textContent = remainingContent;
                    remainingContentDiv.className = textContentLength > 10 ? 'title-price-long-content' : 'title-price-content';

                    const strongElement = p.querySelector('strong');
                    strongElement.replaceWith(amountDiv, remainingContentDiv);
                }   
            }
        }
    })
}