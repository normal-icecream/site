export default function decorate(block) {
  const variants = [...block.classList];

  const icon = block.querySelector('p.img-wrapper');

  if (icon) {
    const blockContainer = block.querySelector('.label > div > div');
    const titleContainer = document.createElement('div');
    titleContainer.className = 'label-title-container';

    if (variants.includes('right-align')) {
      const h1 = block.querySelector('h1');
      titleContainer.append(icon);
      titleContainer.append(h1);
    } else {
      const h1 = block.querySelector('h1');
      titleContainer.append(h1);
      titleContainer.append(icon);
    }

    blockContainer.prepend(titleContainer);
  }
}
