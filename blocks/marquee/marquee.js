export default function decorate (block) {
    const marqueeContainer = document.querySelector('.marquee > div');
    marqueeContainer.className = 'marquee-container';

    const marqueeContent = document.querySelector('.marquee > div > div');
    marqueeContent.className = 'marquee-content';

    const marqueeCloned = marqueeContainer.innerHTML;
    marqueeContainer.innerHTML += marqueeCloned;

    console.log("marqueeCloned:", marqueeCloned);
}