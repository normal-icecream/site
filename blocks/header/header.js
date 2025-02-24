import { getMetadata } from '../../scripts/aem.js';
import { swapIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';
import {
  getCart,
  getLastCartKey,
  allowedCartPages,
  setLastCart,
  refreshCartContent,
  getCartQuantity,
} from '../../pages/cart/cart.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

function toggleHeader(desktop, nav, hamburger) {
  const hamburgerWrapper = hamburger.closest('div');
  const controls = hamburger.getAttribute('aria-controls').split(' ');
  const toggleControls = (ids, status) => {
    ids.forEach((id) => {
      const control = nav.querySelector(`#${id}`);
      if (control) control.setAttribute('aria-hidden', status);
    });
  };

  if (desktop) {
    nav.dataset.expanded = true;
    hamburgerWrapper.setAttribute('aria-hidden', true);
    toggleControls(controls, false);
  } else {
    nav.dataset.expanded = false;
    hamburgerWrapper.setAttribute('aria-hidden', false);
    toggleControls(controls, true);
  }
}

function toggleHamburger(hamburger, nav) {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', !expanded);
  const controls = hamburger.getAttribute('aria-controls').split(' ');
  controls.forEach((id) => {
    const control = document.getElementById(id);
    if (control) {
      control.setAttribute('aria-hidden', expanded);
    }
  });
  nav.dataset.expanded = !expanded;
  if (!expanded) document.body.dataset.scroll = 'disabled';
  else document.body.removeAttribute('data-scroll');
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/header';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('section');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['title', 'sections', 'cart'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) {
      section.id = `nav-${c}`;
      section.classList.add(`nav-${c}`);
    }
  });

  // decorate title
  const title = nav.querySelector('.nav-title');
  if (title) {
    const a = title.querySelector('a[href]');
    if (!a) {
      const content = title.querySelector('h1, h2, h3, h4, h5, h6, p');
      content.className = 'title-content';
      if (content) {
        const link = document.createElement('a');
        link.href = '/';
        link.setAttribute('aria-label', 'home');
        link.innerHTML = content.innerHTML;
        content.innerHTML = link.outerHTML;
      }
    }
  }

  // decorate sections
  const sections = nav.querySelector('.nav-sections');
  if (sections) {
    const wrapper = document.createElement('nav');
    const ul = sections.querySelector('ul');
    const clone = ul.cloneNode(true);
    wrapper.append(clone);
    [...clone.children].forEach((li, i) => {
      const isCartPage = allowedCartPages.some((cartPage) => li.textContent === cartPage);
      li.addEventListener('click', () => {
        if (isCartPage) setLastCart(li.textContent);
      });

      const subsection = li.querySelector('ul');
      if (subsection) {
        li.className = 'subsection';
        subsection.id = `subsection-${i + 1}`;
        subsection.setAttribute('role', 'menu');
        [...subsection.children].forEach((subli) => subli.setAttribute('role', 'menuitem'));
        const label = li.textContent.replace(subsection.textContent, '').trim();
        const button = document.createElement('button');
        button.setAttribute('aria-haspopup', true);
        button.setAttribute('aria-expanded', false);
        button.setAttribute('aria-controls', `subsection-${i + 1}`);
        button.textContent = label;
        button.addEventListener('click', () => {
          const expanded = button.getAttribute('aria-expanded') === 'true';
          if (isDesktop.matches) {
            wrapper.querySelectorAll('[aria-expanded="true"]').forEach((ex) => ex.setAttribute('aria-expanded', false));
          }
          button.setAttribute('aria-expanded', !expanded);
        });
        const chevron = document.createElement('i');
        chevron.className = 'symbol symbol-chevron';
        button.append(chevron);
        li.innerHTML = '';
        li.prepend(button, subsection);
      }
    });
    ul.replaceWith(wrapper);
  }

  // decorate cart
  const cart = nav.querySelector('.nav-cart');
  if (cart) {
    const modal = document.createElement('div');
    modal.classList.add('cart');
    createModal(modal, '', getCart(getLastCartKey()));
    block.append(modal);

    const paymentModal = document.createElement('div');
    paymentModal.classList.add('payments');
    createModal(paymentModal);
    block.append(paymentModal);

    const wholesaleModal = document.createElement('div');
    wholesaleModal.classList.add('wholesale', 'modal');
    createModal(wholesaleModal);
    block.append(wholesaleModal);

    // build button
    const icon = cart.querySelector('.icon');
    const wrapper = icon.closest('p');
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.innerHTML = icon.outerHTML;
    button.addEventListener('click', () => {
      toggleModal(modal, `your ${getLastCartKey()} order`, refreshCartContent);
    });
    wrapper.replaceWith(button);
    // build total placeholder
    const total = document.createElement('p');
    total.id = 'nav-cart-total';
    total.textContent = getCartQuantity();
    button.append(total);
  }

  // build mobile hamburger
  const hamburgerWrapper = document.createElement('div');
  hamburgerWrapper.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.setAttribute('type', 'button');
  hamburgerButton.setAttribute('aria-controls', 'nav-sections nav-tools');
  hamburgerButton.setAttribute('aria-expanded', false);
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  const hamburger = document.createElement('i');
  hamburger.className = 'symbol symbol-hamburger';
  hamburgerButton.append(hamburger);
  hamburgerButton.addEventListener('click', () => toggleHamburger(hamburgerButton, nav));
  hamburgerWrapper.append(hamburgerButton);
  nav.prepend(hamburgerWrapper);

  toggleHeader(isDesktop.matches, nav, hamburgerButton);
  isDesktop.addEventListener('change', (e) => toggleHeader(e.matches, nav, hamburgerButton));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  block.parentElement.className = 'appear';

  swapIcons(block);
}
