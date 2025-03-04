function stopAutoScroll(block) {
  clearInterval(block.autoScrollInterval); // get interval from block
}

function startAutoScroll(block, carousel, slides, duration = 6000) {
  stopAutoScroll(block); // clear existing interval
  block.autoScrollInterval = setInterval(() => { // store interval on block
    const slideWidth = carousel.scrollWidth / slides.length;
    if (carousel.scrollLeft + slideWidth >= carousel.scrollWidth) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' }); // scroll back to start
    } else {
      carousel.scrollBy({ left: slideWidth, behavior: 'smooth' });
    }
  }, duration);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const slides = rows;
  const text = block.querySelector('h1, h2, h3, h4, h5, h6, p');
  const title = text ? text.textContent.trim() : '';
  block.innerHTML = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', `${title} carousel`.trim());

  // determine if carousel has overlay based on content
  const overlay = rows.find((r) => r.textContent.trim() !== '');
  if (overlay) {
    slides.shift(); // remove overlay from slides
    overlay.className = 'carousel-overlay';
    block.append(overlay);
    fetch(`${window.hlx.codeBasePath}/icons/starburst.svg`).then((resp) => {
      if (resp.ok) {
        resp.text().then((svg) => {
          if (svg) {
            const temp = document.createElement('div');
            temp.innerHTML = svg;
            overlay.append(temp.querySelector('svg'));
          }
        });
      }
    });
  }

  // build slide wrapper
  const carousel = document.createElement('ul');
  carousel.className = 'carousel-slides';
  block.append(carousel);

  // append slides
  slides.forEach((s) => {
    const slide = document.createElement('li');
    slide.append(...s.children);
    carousel.append(slide);
  });

  // enable scroll only if there is more than one slide
  if (slides.length > 1) {
    // build navigation
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', `${title} carousel navigation`.trim());
    block.prepend(nav);

    // build arrows
    ['Previous', 'Next'].forEach((label, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${label} slide`);
      button.className = `nav-arrow nav-arrow-${label.toLowerCase()}`;
      button.addEventListener('click', () => {
        const slideWidth = carousel.scrollWidth / slides.length;
        const { scrollLeft } = carousel;
        if (!i && scrollLeft <= 0) { // can't scroll left
          carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' }); // reverse, scroll to last slide
        } else if (i && scrollLeft + slideWidth >= carousel.scrollWidth) { // can't scroll right
          carousel.scrollTo({ left: 0, behavior: 'smooth' }); // reverse, scroll to first slide
        } else { // normal scroll
          carousel.scrollBy({
            left: !i ? -slideWidth * 1 : slideWidth * 1,
            behavior: 'smooth',
          });
        }
      });
      nav.append(button);
    });

    // enable autoscroll
    block.addEventListener('mouseleave', () => {
      startAutoScroll(block, carousel, slides);
    });
    startAutoScroll(block, carousel, slides);

    // disable autoscroll on user interaction
    block.addEventListener('mouseenter', () => {
      stopAutoScroll(block);
    });
  }
}
