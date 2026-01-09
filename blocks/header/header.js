import { getMetadata } from '../../scripts/aem.js';
import { swapIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { createModal, toggleModal } from '../../utils/modal/modal.js';
import {
  getCart,
  getLastCartKey,
  refreshCartContent,
  getCartQuantity,
} from '../../pages/cart/cart.js';
import { wrapRegisteredWithSup } from '../../helpers/helpers.js';

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

function buildModals(block, button) {
  const modal = document.createElement('div');
  modal.classList.add('cart');
  createModal(modal, '', getCart(getLastCartKey()));
  block.append(modal);

  const paymentModal = document.createElement('div');
  paymentModal.classList.add('payments');
  createModal(paymentModal);
  block.append(paymentModal);

  toggleModal(modal, `your ${getLastCartKey()} order`, refreshCartContent);
  button.addEventListener('click', () => {
    toggleModal(modal, `your ${getLastCartKey()} order`, refreshCartContent);
  });
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

  // Initialize counter, this is used to track the number of interactions with an open submenu
  let menuOpenCount = 0;
  // Add an event listener to the document to detect clicks outside the nav-section submenu
  document.addEventListener('click', (event) => {
    // Select all nav-section submenu buttons that are currently expanded
    const expandedNavSection = document.querySelectorAll('.nav-sections .subsection button[aria-expanded="true"]');

    // Check if there is at least one open submenu
    if (expandedNavSection.length > 0) {
      // Increment the counter to track the current interaction
      menuOpenCount += 1;

      // If the menu has been opened 3 or more times, proceed to close it on click outside
      if (menuOpenCount >= 3) {
        // Check if the click happened outside the menu (outside 'header' and the submenu itself)
        if (!event.target.matches('header') || !event.target.closest('.section ul li ul')) {
          // If the click is outside the submenu, close it by setting 'aria-expanded' to false
          const expandedButton = document.querySelector('.nav-sections .subsection button[aria-expanded="true"]');
          // Close the expanded menu
          expandedButton.setAttribute('aria-expanded', 'false');
        }

        // Reset count so that the logic can be triggered again on the next interaction
        menuOpenCount = 0;
      }
    }
  });

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('section');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['title', 'sections'];

  const { pathname } = window.location;
  const isWholesale = pathname.split('/').some((path) => path === 'wholesale');

  // Add cart button to header IF not on a wholesale path
  if (!isWholesale) classes.push('cart');

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
      const subsection = li.querySelector('ul');
      if (subsection) {
        li.className = 'subsection';
        subsection.id = `subsection-${i + 1}`;
        subsection.setAttribute('role', 'menu');
        [...subsection.children].forEach((subli) => {
          const span = subli.querySelector('span');
          if (span) {
            const aTag = subli.querySelector('a');
            aTag.classList.add('header-link-icon');
            aTag.prepend(span);
          }

          const sup = subli.querySelector('sup');
          if (sup) {
            const aTag = subli.querySelector('a');
            const { textContent } = subli;
            aTag.innerHTML = '';
            sup.remove();

            aTag.classList.add('header-link-tm');
            if (span) { aTag.append(span); }

            const newSpan = wrapRegisteredWithSup(textContent);
            aTag.append(newSpan);
          }
          subli.setAttribute('role', 'menuitem');
        });
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

          // Reset menuOpenCount to 1 so that the logic for detecting outside menu clicks
          // can be triggered again on the next interaction
          menuOpenCount = 1;
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
    // build button
    const icon = cart.querySelector('.icon');
    const wrapper = icon.closest('p');
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.innerHTML = icon.outerHTML;
    button.addEventListener('click', () => {
      buildModals(block, button);
    }, { once: true });
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

  // Remove cart icon from header if user is on any wholesale page
  if (isWholesale) {
    const normalCartIcon = document.querySelector('span.icon-normal-cart').closest('div.section');
    normalCartIcon.remove();
  }

  swapIcons(block);
}
