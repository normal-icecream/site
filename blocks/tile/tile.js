export default function decorate(block) {
    const picture = block.querySelector('.tile > div > div > picture');
    const card = block.querySelector('.tile > div > div:last-child');
    const icon = block.querySelector('.tile > div > div:last-child p.img-wrapper');

    const cardContainer = document.createElement('div');
    const cardContent = document.createElement('div');
    cardContent.append(card, icon);
    cardContainer.append(cardContent)

    block.innerHTML = '';

    block.append(picture, cardContainer);
}