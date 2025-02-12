/* eslint-disable import/no-cycle */
import { addItemToCart } from '../../pages/cart/cart.js';
import buildForm from '../forms/forms.js';
import { toggleModal } from '../modal/modal.js';
import { SquareModifier } from '../../constructors/constructors.js';
import { getCardPaymentForm } from '../payments/payments.js';

// TODO - do I need this? see helpers formatCurrency
export function formatMoney(num) {
  return Number(num / 100).toFixed(2);
}

export function toClassName(name) {
  return name && typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
    : '';
}

// Function to refresh the cart content
export function refreshPaymentsContent(element, orderData) {
  const modalContentSection = element.querySelector('.modal-content');
  modalContentSection.innerHTML = '';
  getCardPaymentForm(modalContentSection, orderData);
}

export function removeStoreFromString(str) {
  const stores = ['lab', 'truck', 'store', 'composed cone', 'pack'];
  stores.forEach((store) => {
    if (str.toLowerCase().startsWith(store) || str.toLowerCase().endsWith(store)) {
      // eslint-disable-next-line no-param-reassign
      str = str.toLowerCase().replace(store, '').trim();
    }
  });
  return str;
}

function writeLabelText(str, vari) {
  let text = removeStoreFromString(str);
  if (text === 'soft serve') {
    text += ' flavor (select 1)';
  } else if (text === 'topping') {
    text += 's (select up to 3)';
  } else if ((vari && vari.includes(' size'))
      || (vari && vari.includes(' oz'))) {
    text = 'select a size';
  } else if (text.endsWith('-')) {
    text = text.replace('-', '').trim();
  }
  return text;
}

function getLimits(description) {
  const options = description.replace('select ', '').split(',').map((t) => t.trim());
  const limits = {};
  options.forEach((option) => {
    const limit = Number(option.match(/\d+/)[0]);
    const text = option.replace(limit, '').trim();
    limits[text] = limit;
  });
  return limits;
}

/**
 * Decreases the value of an input element by 1 (while observing the min value).
 * @param {HTMLInputElement} input - Input element whose value will be decremented.
 */
function decrement(input, groupName, groupSelections) {
  const total = parseInt(input.value, 10);
  const min = parseInt(total.min, 10) || 0;
  if (total > min) {
    input.value = total - 1;
    input.dispatchEvent(new Event('change'));

    groupSelections.set(groupName, groupSelections.get(groupName) - 1);
  }
}

/**
   * Increases the value of an input element by 1 (while observing the max value).
   * @param {HTMLInputElement} input - Input element whose value will be incremented.
   */
function increment(input, groupName, groupSelections) {
  const total = parseInt(input.value, 10);
  const max = parseInt(total.max, 10) || null;
  if (!max || total < max) {
    input.value = total + 1;
    input.dispatchEvent(new Event('change'));
    groupSelections.set(groupName, groupSelections.get(groupName) + 1);
  }
}

function resetCustomizeForm() {
  const form = document.querySelector('.customize-form');
  if (!form) return;
  // Reset all input fields
  form.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = 0;
    input.dispatchEvent(new Event('change'));
  });
}

// Function to refresh the cart content
export function refreshCustomizeContent(element) {
  const modalContentSection = element.querySelector('.modal-content');
  modalContentSection.innerHTML = '';
  // eslint-disable-next-line no-use-before-define
  const customizeContent = getCustomize(element);
  modalContentSection.append(customizeContent);
}

function createCustomizeForm(data, itemId, limits) {
  // Create the form element
  const form = document.createElement('form');
  form.className = 'customize-form';

  // Track selected items per group
  const groupSelections = new Map();

  data.forEach((group) => {
    const fieldset = document.createElement('fieldset');
    fieldset.classList.add('customize-group', `customize-${group.name}`);
    fieldset.dataset.max = limits[group.name];
    fieldset.dataset.min = limits[group.name];

    // Initialize selection count for this group
    groupSelections.set(group.name, 0);

    group.options.forEach((option) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'customize-item';
      wrapper.dataset.id = option.id;

      const label = document.createElement('label');
      label.textContent = option.name;

      // build total field
      const total = document.createElement('input');
      total.type = 'number';
      total.min = 0;
      total.value = 0;
      total.step = 1;
      total.min = 0;
      total.max = limits[group.name];
      total.readOnly = true;
      total.addEventListener('change', () => {
        const value = parseInt(total.value, 10);
        const subtract = form.querySelector('.button.subtract');
        const min = parseInt(total.min, 10) || 0;
        if (value > min) subtract.removeAttribute('disabled');
        else subtract.disabled = true;
        // TODO: disable "add" if max
      });

      const decrementBtn = document.createElement('button');
      decrementBtn.classList.add('button', 'subtract');
      decrementBtn.textContent = '-';
      decrementBtn.type = 'button';
      decrementBtn.disabled = true;
      decrementBtn.addEventListener('click', () => decrement(total, group.name, groupSelections));

      const incrementBtn = document.createElement('button');
      decrementBtn.classList.add('button', 'add');
      incrementBtn.textContent = '+';
      incrementBtn.type = 'button';
      incrementBtn.addEventListener('click', () => increment(total, group.name, groupSelections));

      wrapper.append(label, decrementBtn, total, incrementBtn);
      fieldset.appendChild(wrapper);
    });

    form.appendChild(fieldset);
  });

  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.className = 'customize-submit';
  submitButton.type = 'submit';
  submitButton.textContent = 'add to cart';

  function checkFormValidity() {
    let isFormValid = true;

    const customizeSubmitBtn = document.querySelector('.customize-submit');
    const existingErrorContainer = document.querySelector('.customize-submit-validation-errors');
    if (existingErrorContainer) {
      existingErrorContainer.remove();
    }
    const errorMessages = [];

    /* eslint-disable no-restricted-syntax */
    for (const [groupName, selectedCount] of groupSelections.entries()) {
      const maxAllowedSelections = limits[groupName];

      if (selectedCount < maxAllowedSelections) {
        isFormValid = false;
        const remainingSelections = maxAllowedSelections - selectedCount;
        errorMessages.push(`You need ${remainingSelections} more selection${remainingSelections > 1 ? 's' : ''} for "${groupName}".`);
      } else if (selectedCount > maxAllowedSelections) {
        isFormValid = false;
        const excessSelections = selectedCount - maxAllowedSelections;
        errorMessages.push(`"${groupName}" exceeds the limit by ${excessSelections} selection${excessSelections > 1 ? 's' : ''}.`);
      }
    }

    if (errorMessages.length > 0) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'customize-submit-validation-errors';
      errorMessages.forEach((message) => {
        const errorMessageElement = document.createElement('p');
        errorMessageElement.textContent = message;

        errorContainer.append(errorMessageElement);
      });
      customizeSubmitBtn.after(errorContainer);
    }

    return isFormValid;
  }
  /* eslint-enable no-restricted-syntax */

  form.appendChild(submitButton);
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const isValid = checkFormValidity();
    if (isValid) {
      const selectedItems = [];
      form.querySelectorAll('.customize-group').forEach((formGroup) => {
        formGroup.querySelectorAll('.customize-item').forEach((input) => {
          const quantity = parseInt(input.querySelector('input[type="number"]').value, 10);
          if (quantity > 0) {
            const modOptions = data.flatMap((mods) => mods.options);
            const modData = modOptions.find((mod) => mod.id === input.dataset.id);

            const modifierData = {
              base_price_money: {
                amount: modData.price,
                currency: modData.currency,
              },
              catalog_object_id: input.dataset.id,
              name: modData.name,
              quantity,
            };

            const modifier = new SquareModifier(modifierData).build();
            selectedItems.push(modifier);
          }
        });
      });
      const compoundCartKey = selectedItems.reduce((acc, curr) => `${acc}-${curr.catalog_object_id}`, '');

      addItemToCart(`${itemId}${compoundCartKey}`, itemId, selectedItems);
      resetCustomizeForm();
      const customizeModal = document.querySelector('.modal.customize');
      const customizeTitle = window.catalog.byId[itemId].item_data.name;
      toggleModal(customizeModal, customizeTitle, refreshCustomizeContent);
    }
  });

  return form;
}

export function getCustomize(element) {
  const item = window.catalog.byId[element?.dataset.id];
  const { name, variations, modifier_list_info: modifiers } = item.item_data;
  // const customizeLabel = writeLabelText(name, variations[0].item_variation_data.name);

  let form;
  if (modifiers) {
    const modifierGroups = [];
    const limits = getLimits(item.item_data.description);
    modifiers.forEach((mod) => {
      const modData = window.catalog.byId[mod.modifier_list_id].modifier_list_data;
      const modName = modData.name.replace('SHIPPING', '').trim();
      const modLabel = writeLabelText(modName);
      const modMods = modData.modifiers;

      const field = {
        category: 'square-modifier',
        label: modLabel,
        name: modName,
        title: toClassName(modName),
        options: [],
      };

      modMods.forEach((m) => {
        const mName = m.modifier_data.name;
        const option = {
          id: m.id,
          name: mName,
          label: mName,
          price: formatMoney(m.modifier_data.price_money.amount),
          currency: m.modifier_data.price_money.currency,
        };
        field.options.push(option);
      });

      modifierGroups.push(field);
    });

    form = createCustomizeForm(modifierGroups, item.id, limits);
  }

  if (variations.length > 1) {
    const label = writeLabelText(name, variations[0].item_variation_data.name);

    const fields = [];
    const field = {
      type: 'radio',
      label,
      name,
      required: true,
      options: [],
    };
    variations.forEach((variation) => {
      const option = {
        label: `${variation.item_variation_data.name} ($${formatMoney(variation.item_variation_data.price_money.amount)})`,
        id: variation.id,
        name: variation.item_variation_data.name,
      };
      field.options.push(option);
    });
    fields.push(field);

    // eslint-disable-next-line no-inner-declarations
    function handleSubmit(formData) {
      const variation = variations.find((vari) => vari.id === formData[0].id);
      const variationData = {
        id: variation.id,
        name: variation.item_variation_data.name,
      };
      const key = `${item.id}-${variation.id}`;
      addItemToCart(key, item.id, [], variationData);
    }

    form = buildForm([field], handleSubmit, element);
  }
  return form;
}
