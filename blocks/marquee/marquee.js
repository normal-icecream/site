export default function decorate (block) {
    const marqueeContainer = document.querySelector('.marquee > div');
    marqueeContainer.className = 'marquee-container';

    const marqueeContent = document.querySelector('.marquee > div > div');
    marqueeContent.className = 'marquee-content';

    const marqueeCloned = marqueeContainer.innerHTML;
    // marqueeCloned.className = 'marquee-clone';
    marqueeContainer.innerHTML += marqueeCloned;

    console.log("marqueeCloned:", marqueeCloned);
}

{/* <div className='marquee-container'>
    <div className='marquee-content'>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
        <p></p>
    </div>
</div> */}