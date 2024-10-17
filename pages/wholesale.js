import { buildBlock } from '../scripts/aem.js';

function createSubmitButton() {
    // Create submit button wrapper
    const submitButtonWrapper = document.createElement('div');
    submitButtonWrapper.className = 'table-form-submit-wrapper';

    // Apply styles to the submit button wrapper
    submitButtonWrapper.style.display = 'flex';
    submitButtonWrapper.style.justifyContent = 'center';
    submitButtonWrapper.style.alignItems = 'center';
    submitButtonWrapper.style.margin = '20px 0';

    // Create submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'add to cart';
    submitButton.disabled = true;

    // Apply inline styles to the submit button
    submitButton.style.height = '50px';
    submitButton.style.width = '300px';
    submitButton.style.backgroundColor = 'var(--blue)';
    submitButton.style.color = 'var(--white)';
    submitButton.style.borderRadius = '6px';
    submitButton.style.fontFamily = 'var(--heading-font-family)';
    submitButton.style.fontSize = 'var(--heading-size-s)';
    submitButton.style.border = 'none';
    submitButton.style.cursor = 'pointer';
    submitButton.style.margin = '20px 0';
    submitButton.style.transition = 'background-color 0.3s ease';

    if (submitButton.disabled) {
        submitButton.style.backgroundColor = 'var(--blue-light)';
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.opacity = '0.6';
    }

    submitButtonWrapper.append(submitButton);
    return submitButtonWrapper
}

/**
 * Sets up wholesale static table block structure
*/
export async function decorateWholesale(main) {
    const link = main.querySelector('a[href]');
    if (link.href.endsWith('wholesale.json')) {
        const parentDiv = link.closest('div');

        const form = document.createElement('form');
        form.className = 'table-form';
    
        const submitButton = createSubmitButton();
    
        // Form handle submit
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = {};
            const inputs = form.querySelectorAll('input[type="number"]');
    
            inputs.forEach(({ id, value }) => {
            // If input value isn't empty or zero, add to formData
            if (value > 0) {
                formData[id] = {
                // TODO - Add whatever data we want to send
                quantity: value,
                };
            }
            });
    
            // Add data to cart   
            // TODO - Send form json data
            // console.log("formData:", formData);
        });

        const block = buildBlock('table', '');
        block.dataset.src = link.href;

        form.append(submitButton);
        block.append(form);
        parentDiv.append(block);

        const unusedDivs = document.querySelector('.table > div');
        unusedDivs.remove();

        const p = link.closest('p');
        // Remove link
        p.remove();
    }
}