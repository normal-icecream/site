import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateBlock,
  loadBlock,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  buildBlock,
} from './aem.js';

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
          let fill = svg.querySelector('[fill]');
          if (fill) fill = fill.getAttribute('fill').toLowerCase().includes('currentcolor');
          // replace image with SVG, ensuring color inheritance
          if ((style || fill) || (!style && !fill)) icon.replaceWith(svg);
          observer.disconnect();
        }
      });
    }, { threshold: 0 });
    observer.observe(icon);
  });
}

// DONE - identify catalog json link
// DONE - fetch catalog json 
// DONE - build the lil table
// DONE - delete link
// TODO - need to read in icons (vegan & gf etc.)
// TODO - need to hide row if marked as hidden

/**
 * fetches wholesale product data and decorates page.
 */
async function decorateWholesale(main) {
  // Select json link
  const link = main.querySelector('a[href]');

  // Create a map of products from json, grouped by product type
  let wholesaleMap = {};
  if (link.href.endsWith('.json')) {
    try {
      // Fetching wholesale product data from .json URL
      const res = await fetch(link.href);
      const data = await res.json();
      const jsonData = data.data;
      
      // Building object with product type as key
      jsonData.forEach((product) => {
        // If product key doesn't already exist in map, create key with product name and add product to list
        if (!wholesaleMap[product.TYPE]) { 
          wholesaleMap[product.TYPE] = [product];
        } else {
          // If key exists in map, add product to list with matching key name
          wholesaleMap[product.TYPE].push(product);
        }
      });
    } catch (err) {
      throw new Error('no .json');
    }
  }

  // Select div with the classname .section where the link is a child, insert product tables into div
  let section;
  const sectionDivs = document.querySelectorAll('.section');
  const linkedSection = Array.from(sectionDivs).find(div => div.querySelector('a[href]'));
  if (linkedSection?.querySelector('a[href]').href === link.href) {
    section = linkedSection;
    const linkWrapper = linkedSection.querySelector('.default-content-wrapper');
    linkWrapper.remove();
  }

  // Create form
  const form = document.createElement('form');
  form.className = 'table-form';
  // form.method = 'post';
  // form.action = '' // path we want to send data to

  form.addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = {};
    const inputs = form.querySelectorAll('input[type="number"]');
  
    inputs.forEach((input) => {
      // Grab input id and value
      const id = input.id;
      const value = input.value;
  
      // If input value isn't empty or zero, add to formData
      if (value > 0) {
        formData[id] = {
          // TODO - Add whatever data we want to send 
          quantity: value 
        };
      }
    });

    console.log(formData)
    // TODO - Send form json data
    // On submit it should create a new sheet where we show what amounts of the orders should be packaged, it should deduct any quantities from original sheet.
  })

  // Create submit button wrapper
  const submitButtonWrapper = document.createElement('div');
  submitButtonWrapper.className = 'table-form-submit-wrapper';

  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'create order';
  submitButton.disabled = false;
  // TODO - should be disabled if no entries have been made
  submitButtonWrapper.append(submitButton)

  // Create table for every product group
  Object.values(wholesaleMap).forEach((productTypeGroup) => {
    // Product type table
    let table = []; 

    // Create table headers
    table.push([
      { elems: [productTypeGroup[0].TYPE] },
      { elems: ['quantity'] }
    ])

    // Add products to table
    productTypeGroup.forEach((product) => {
      // Create pleaceholder array
      let col1 = [];
      let col2 = [];

      if (product.ITEM) {
        const title = document.createElement('h3');
        title.textContent = product.ITEM;
        col1.push(title);
      }

      if (product.DESCRIPTION) {
        const description = document.createElement('p');
        description.textContent = product.DESCRIPTION;
        col1.push(description);
      }

      // Create quantity input
      const quantity = document.createElement('input');
      quantity.type = 'number'; // input type number
      quantity.min = 0; // minimum value 0
      quantity.max = product.AVAILABLE; // max amount per product
      quantity.value = 0; // starting value
      quantity.id = product.ID;
      quantity.addEventListener('change', () => {
        const value = parseInt(quantity.value, 10);
        // TODO - make sure that everything in here is working
        // const subtract = form.querySelector('.button.subtract'); 
        const min = parseInt(quantity.min, 10) || 0;
        if (value > min) subtract.removeAttribute('disabled');
        else subtract.disabled = true;

        // TODO: disable "add" if max
      });
      col2.push(quantity);

      table.push([
        { elems: col1 },
        { elems: col2 }
      ]);
    });

    const productBlockWrapper = document.createElement('div');
    const productBlock = buildBlock('table', table);
    productBlockWrapper.append(productBlock);

    form.append(productBlockWrapper);
    form.append(submitButtonWrapper);
    section.append(form);
    decorateBlock(productBlock);
    return loadBlock(productBlock)
  })
}

function decoratePageType(main) {
  // console.log(window.location.pathname);
  const wholesale = window.location.pathname.split('/').some(path => path === 'wholesale');
  // console.log("json:", json);
  
  // try {
    // build auto blocks
    // check type (is store, for example)
    // if store, load square, catalog, blah blah
    // check for specific store types
    // if store, do something
    // if truck, do something,
    // if wholesale, do something else
    if (wholesale) decorateWholesale(main);
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error('Auto Blocking failed', error);
  // }
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

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  decorateImages(main);
  // buildAutoBlocks(main);
  decoratePageType(main);
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
  const main = doc.querySelector('main');
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

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
