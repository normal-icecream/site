export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (col.children.length === 1) {
        const pic = col.querySelector('picture');
        if (pic) {
          const picWrapper = pic.closest('div');
          picWrapper.classList.add('col-img');
        }
      } else if (col.children.length > 1) {
        const pic = col.querySelector('picture');
        const icon = col.querySelector('.icon');
        if (pic || icon) {
          col.classList.add('col-img-complex');
        }
      }
    });
  });
}
