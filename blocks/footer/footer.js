import { getMetadata } from '../../scripts/aem.js';
import { swapIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('section');
  footer.id = 'footer';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const classes = ['brand', 'contact', 'socials', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) {
      section.id = `footer-${c}`;
      section.classList.add(`footer-${c}`);
    }
  });

  // decorate contact
  const contact = footer.querySelector('.footer-contact');
  if (contact) {
    const buttons = contact.querySelectorAll('a.button');
    buttons.forEach((btn) => {
      btn.removeAttribute('class');
      btn.closest('p').removeAttribute('class');
    });
  }

  // decorate socials
  const socials = footer.querySelector('.footer-socials');
  if (socials) {
    const ul = socials.querySelector('ul');
    ul.className = 'button-wrapper';
    ul.querySelectorAll('a[href]').forEach((a) => {
      const { host } = new URL(a.href);
      const site = host.split('.')[1];
      a.setAttribute('aria-label', site || 'social');
      a.className = 'button outline';
    });
  }

  // decorate legal
  const legal = footer.querySelector('.footer-legal');
  if (legal) {
    const endYear = legal.querySelector('u');
    const now = new Date().getFullYear() % 100;
    endYear.textContent = now;
  }

  block.append(footer);
  block.parentElement.className = 'appear';

  swapIcons(block);
}
