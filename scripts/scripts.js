import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  getMetadata,
  toClassName,
} from './aem.js';
// eslint-disable-next-line import/no-cycle
import { decorateWholesale } from '../pages/wholesale/wholesale.js';
import { decorateCatering } from '../pages/catering/catering.js';
import { getCatalogListJson, getCatalogTaxList } from '../api/square/catalog.js';
import { createLocalStorageCart, setLastCart } from '../pages/cart/cart.js';

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Replaces image icons with inline SVGs when they enter the viewport.
 */
export function swapIcons() {
  document.querySelectorAll('span.icon > img').forEach((icon) => {
    if (icon.dataset.hasObserver) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const resp = await fetch(icon.src);
          const temp = document.createElement('div');
          temp.innerHTML = await resp.text();
          const svg = temp.querySelector('svg');
          temp.remove();
          // check if svg has inline styles
          let style = svg.querySelector('style');
          if (style) style = style.textContent.toLowerCase().includes('currentcolor');
          const fill = [...svg.querySelectorAll('[fill]')].some((s) => s.getAttribute('fill').toLowerCase().includes('currentcolor'));
          // replace image with SVG, ensuring color inheritance
          if ((style || fill) || (!style && !fill)) icon.replaceWith(svg);
          observer.disconnect();
        }
      });
    }, { threshold: 0 });
    icon.dataset.hasObserver = true;
    observer.observe(icon);
  });
}

/**
 * Decorates main with custom blocks based on url path
 * @param {HTMLElement} main The main container element
 */
function decoratePageType(main) {
  const { pathname } = window.location;
  const cartPath = toClassName(pathname.replace('/', '') || 'home');
  main.classList.add(pathname.replace('/', '') || 'home'); // label page based on path;

  const template = getMetadata('template');
  if (template === 'cart') setLastCart(cartPath);

  const wholesale = pathname.split('/').some((path) => path === 'wholesale');
  const catering = pathname.split('/').some((path) => path === 'catering');

  try {
    if (wholesale) decorateWholesale(main);
    if (catering) decorateCatering(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// function buildAutoBlocks(main) {
//   try {
//     // build auto blocks
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('Auto Blocking failed', error);
//   }
// }

/**
 * Decorates links with appropriate classes to style them as buttons
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    // identify standalone links
    if (a.href !== a.textContent && p.textContent === a.textContent) {
      a.className = 'button';
      const strong = a.closest('strong');
      const em = a.closest('em');
      const double = !!strong && !!em;
      if (double) a.classList.add('accent');
      else if (strong) a.classList.add('emphasis');
      else if (em) a.classList.add('outline');
      p.innerHTML = a.outerHTML;
      p.className = 'button-wrapper';
    }
  });
}

function decorateImages(main) {
  main.querySelectorAll('p img').forEach((img) => {
    const p = img.closest('p');
    p.className = 'img-wrapper';
  });
}

function decorateLabels(main) {
  main.querySelectorAll('h2 .icon').forEach((icon) => {
    const label = icon.closest('h2');
    label.classList.add('label');
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  decorateImages(main);
  decorateLabels(main);
  // buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  createLocalStorageCart();

  const main = doc.querySelector('main');
  decoratePageType(main);
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  swapIcons(main);
}

export async function fetchCatalog() {
  if (!window.catalog) {
    const json = await getCatalogListJson();
    if (json) {
      const catalog = {
        byId: {},
        items: [],
        categories: [],
        discounts: {},
      };
      json.forEach((e) => {
        if (!catalog.byId[e.id]) {
          catalog.byId[e.id] = e;
        }
        if (e.type === 'ITEM') {
          catalog.items.push(e);
          if (e.item_data.variations) {
            e.item_data.variations.forEach((v) => {
              catalog.byId[v.id] = v;
            });
          }
        }
        if (e.type === 'MODIFIER_LIST') {
          if (e.modifier_list_data.modifiers) {
            e.modifier_list_data.modifiers.forEach((m) => {
              m.modifier_data.modifier_list_id = e.id;
              catalog.byId[m.id] = m;
            });
          }
        }
        if (e.type === 'DISCOUNT') {
          if (e.discount_data.name) {
            catalog.discounts[e.discount_data.name.toLowerCase()] = { id: e.id };
          }
        }
        if (e.type === 'CATEGORY') {
          catalog.categories.push(e);
        }
      });
      window.catalog = catalog;
    }
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
async function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
  fetchCatalog();
  // TODO - do i even need this?
  getCatalogTaxList();
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await loadDelayed();
}

loadPage();
