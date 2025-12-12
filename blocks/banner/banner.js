export default function decorate(block) {
  const bannerContainer = block.querySelector('.banner > div');

  if (bannerContainer.children.length > 1) {
    const bannerElements = [...bannerContainer.children];

    bannerElements.forEach((div) => {
      const divChildren = [...div.children];
      let isGraphic;

      if (divChildren.length === 1) {
        const element = divChildren[0];

        isGraphic = Boolean(element.tagName.toLowerCase('picture') || element.querySelector('span'));
      }

      if (isGraphic) {
        div.classList.add('banner-graphic');
      } else {
        div.classList.add('banner-content');
      }
    });
  }
}
