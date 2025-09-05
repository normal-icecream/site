/* eslint-disable import/no-cycle */
/* eslint-disable max-len */
import {
  buildBlock,
  decorateBlock,
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
import { decorateWholesale } from '../pages/wholesale/wholesale.js';
import { decorateCatering } from '../pages/catering/catering.js';
import { getCatalogListJson } from './square-client/square/catalog.js';
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
 * Creates accordion block from data-accordion sections
 * @param {HTMLElement} main - Main container
 */
function createAccordionBlock(main) {
  const accordions = main.querySelectorAll('.section[data-accordion]');
  if (!accordions.length) return;

  const firstSection = accordions[0];
  const accordionContent = [];

  // add each section's content to accordions array
  accordions.forEach((accordion) => {
    const title = accordion.dataset.accordion;
    const content = document.createElement('div');
    content.append(...accordion.children);
    accordionContent.push([title, content]);
    accordion.removeAttribute('data-accordion');
  });

  // create the accordions block and append to the first section
  const wrapper = document.createElement('div');
  const block = buildBlock('accordion', accordionContent);
  wrapper.append(block);
  firstSection.appendChild(wrapper);
  decorateBlock(block);

  // remove all other sections if empty
  accordions.forEach((accordion) => {
    if (!accordion.children.length) accordion.remove();
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
  createAccordionBlock(main);
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
  const json = await getCatalogListJson();
  let catalogData;
  if (json) {
    const catalog = {
      byId: {},
      discounts: {},
      taxList: [],
    };
    json.forEach((e) => {
      if (!catalog.byId[e.id]) {
        catalog.byId[e.id] = e;
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
      if (e.type === 'TAX') {
        catalog.taxList.push(e);
      }
    });
    catalogData = catalog;
  }
  return catalogData;
}

export async function organizeCatalog(json) {
  let catalogData;
  if (json) {
    const catalog = {
      byId: {},
      discounts: {},
      taxList: [],
    };
    json.forEach((e) => {
      if (!catalog.byId[e.id]) {
        catalog.byId[e.id] = e;
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
      if (e.type === 'TAX') {
        catalog.taxList.push(e);
      }
    });
    catalogData = catalog;
  }
  return catalogData;
}

/**
 * @function openSquareCatalogDb
 * @description Opens (or creates, if it doesn't exist) the `normalStore` IndexedDB database
 * and ensures a `catalog` object store exists. Provides a database connection for
 * performing read/write transactions on the catalog.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the open IndexedDB database connection.
 * @throws {DOMException} If the database fails to open or an IndexedDB error occurs.
 */
export function openSquareCatalogDb() {
  return new Promise((resolve, reject) => {
    // open a connection with indexedDB
    const openRequest = indexedDB.open('normalStore', 1);

    // Handle upgrade to db if necessary
    openRequest.onupgradeneeded = (event) => {
      const db = event.target.result;

      // If catalog store DOESN'T exist then create catalog store
      if (!db.objectStoreNames.contains('catalog')) {
        db.createObjectStore('catalog', { keyPath: 'id' });
      }
    };

    // Set onSuccess response handler if connection is successful
    openRequest.onsuccess = (event) => {
      resolve(event.target.result); // returns the db connection
    };

    // Set onError response handler if connection is not successful
    openRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Retrieves Square Catalog data from Square API and adds data to IndexedDB catalog store
 * @async
 * @function refreshCatalog
 * @returns {Promise<Object[]>} A promise that resolves with an array of organized catalog items.
 * @throws {DOMException} If an error occurs while reading from IndexedDB.
* */
async function refreshCatalog() {
  // get database
  const db = await openSquareCatalogDb();

  // fetch square catalog data
  const squareCatalog = await getCatalogListJson();

  // open database for a transaction/modification
  const transaction = db.transaction('catalog', 'readwrite');

  // get store where an update is to be made
  const store = transaction.objectStore('catalog');

  // add data to store
  squareCatalog.forEach((squareCatalogItem) => {
    store.add(squareCatalogItem);
  });

  // return organized catalog array
  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = async () => {
      if (request.result !== undefined) {
        // const catalogData = request.result;
        const organizedCatalog = await organizeCatalog(request.result);
        // catalog = organizedCatalog;
        resolve(organizedCatalog);

        // close db connection
        db.close();
      }
    };

    // Set onError response handler if fetching catalog data is not successful
    request.onerror = (event) => {
      reject(event.target.error);

      // close db connection
      db.close();
    };
  });
}

/**
 * @async
 * @function deleteAndReloadCatalog
 * @description Deletes the entire IndexedDB database (`normalStore`) and reloads it with fresh catalog data.
 * This ensures a clean slate by wiping all stored data, avoiding versioning issues, and reinitializing with the latest catalog.
 * Also resets the catalog timestamp in `localStorage` to the current time.
 * @returns {Promise<void>} A promise that resolves when the database has been deleted and the reload process has started.
 * @throws {DOMException} If an error occurs while attempting to delete the database.
 */
async function deleteAndReloadCatalog() {
  return new Promise((resolve, reject) => {
    // Run delete database, we want to wipe all data and create new store to avoid indexedDB versioning.
    const deleteReq = indexedDB.deleteDatabase('normalStore');
    deleteReq.onsuccess = async () => {
      // reset timestamp
      const now = new Date().getTime();
      localStorage.setItem('catalogTimestamp', JSON.stringify(now));

      // I'm not awaiting this call, I want this to run in the background
      await refreshCatalog();

      resolve();
    };

    deleteReq.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.error('Error deleting DB', e);
      reject(e.target.error);
    };

    deleteReq.onblocked = () => {
      // eslint-disable-next-line no-console
      console.warn('Delete blocked — make sure all DB connections are closed!');
    };
  });
}

/**
 * Retrieves and organizes the Square catalog data stored in IndexedDB.
 * @async
 * @function getCatalogFromIndexedDB
 * @returns {Promise<Object[]>} A promise that resolves with an array of organized catalog items.
 * @throws {DOMException} If an error occurs while reading from IndexedDB.
* */
async function getCatalogFromIndexedDB() {
  const db = await openSquareCatalogDb();

  // open database for a transaction/modification
  const transaction = db.transaction('catalog', 'readwrite');

  // get store where an update is to be made
  const store = transaction.objectStore('catalog');

  return new Promise((resolve, reject) => {
    // fetch all catalog items from indexedDB store
    const request = store.getAll();

    request.onsuccess = async () => {
      if (request.result !== undefined) {
        // request.result is the entire raw list of Square catalog items that are stored in the catalog IndexedDB store
        // reformat catalog data for the main app
        const organizedCatalog = await organizeCatalog(request.result);

        // return catalog data
        resolve(organizedCatalog);

        // close db connection
        db.close();
      }
    };

    // if an error occurs, return error message
    request.onerror = (event) => {
      reject(event.target.error);

      // close db connection
      db.close();
    };
  });
}

/**
 * Fetches the square catalog data.
 * @documentation https://javascript.info/indexeddb
 * @returns {Promise<Array>} A promise that resolves to an array of catalog item objects.
 * @throws {Error} - Throws an error if the catalog retreival fails.
*/
// rename getCatalog
export async function getCatalog() {
  const catalogTimestamp = JSON.parse(localStorage.getItem('catalogTimestamp'));
  let catalog;

  // If a catalog timestamp exists
  if (catalogTimestamp) {
    const now = new Date().getTime();
    const twentyFourHoursFromTimeStamp = Number(catalogTimestamp) + (1 * 24 * 60 * 60 * 1000);

    // If current time and date is less than 24 hours from timestamp
    if (now < twentyFourHoursFromTimeStamp) {
      catalog = await getCatalogFromIndexedDB();

    // If current time is greater than or equal to 24 hours from timestamp
    } else if (now >= twentyFourHoursFromTimeStamp) {
      // grab stored catalog data for use before it is replaced by updated Square catalog data
      catalog = await getCatalogFromIndexedDB();

      // Delete catalog timestamp to be reset below
      localStorage.removeItem('catalogTimestamp');

      // delete catalog store, re-add it and then populate it with newly fetched square catalog data
      await deleteAndReloadCatalog();
    }

  // brand new customer with no timestamp, create new catalog store in db, populate it with data and return catalog data
  } else {
    const now = new Date().getTime();
    // set timestamp in local storage
    localStorage.setItem('catalogTimestamp', JSON.stringify(now));

    // Fetch Square catalog
    catalog = await refreshCatalog();
  }

  return catalog;
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
async function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  await loadDelayed();
}

loadPage();
