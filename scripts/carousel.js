// scripts/carousel.js
// This script contains a function to set up carousels. It's meant to be called
// by another script after the carousel HTML has been added to the DOM.

/**
 * Initializes the newsletter and articles carousels with infinite looping.
 * This function should be called after the carousel HTML has loaded.
 */
export function initCarousels() {
    // --- Helper function for setting up a single carousel ---
    function setupInfiniteCarousel(carouselSelector, leftArrowSelector, rightArrowSelector) {
        const carousel = document.querySelector(carouselSelector);
        const leftArrow = document.querySelector(leftArrowSelector);
        const rightArrow = document.querySelector(rightArrowSelector);

        // This console.error will now only appear if the elements truly don't exist
        // after the script has been called, indicating an HTML issue, not a timing issue.
        if (!carousel || !leftArrow || !rightArrow) {
            console.error(`Carousel elements not found for selectors: ${carouselSelector}. Please check your HTML.`);
            return;
        }

        // Clone and prepend/append items to create the "infinite" loop effect.
        const numToClone = 3;
        const items = Array.from(carousel.children);

        for (let i = numToClone - 1; i >= 0; i--) {
            const clone = items[items.length - 1 - i].cloneNode(true);
            carousel.prepend(clone);
        }

        for (let i = 0; i < numToClone; i++) {
            const clone = items[i].cloneNode(true);
            carousel.append(clone);
        }

        let initialScrollOffset;
        setTimeout(() => {
            if (carousel.children[numToClone]) {
                initialScrollOffset = carousel.children[numToClone].offsetLeft;
                carousel.scrollLeft = initialScrollOffset;
            }
        }, 0);

        const getCardWidth = () => {
            const firstItem = carousel.firstElementChild;
            if (!firstItem) return 0;
            const style = window.getComputedStyle(firstItem);
            return firstItem.offsetWidth + parseFloat(style.marginRight) + parseFloat(style.marginLeft) + parseFloat(getComputedStyle(carousel).gap || 0);
        };

        let cardWidth = getCardWidth();

        window.addEventListener('resize', () => {
            cardWidth = getCardWidth();
        });

        leftArrow.addEventListener('click', () => {
            carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });

        function handleInfiniteScroll() {
            const currentScroll = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;

            if (currentScroll >= maxScroll - (numToClone * cardWidth) && currentScroll < maxScroll) {
                carousel.scrollLeft = initialScrollOffset;
            } else if (currentScroll <= initialScrollOffset) {
                carousel.scrollLeft = maxScroll - (numToClone * cardWidth);
            }
        }

        let isScrolling;
        carousel.addEventListener('scroll', () => {
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                handleInfiniteScroll();
            }, 50);
        });

        setInterval(() => {
            carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }, 7000);
    }

    // Call the setup function for both carousels
    setupInfiniteCarousel('.newsletter-carousel', '.newsletter-left-arrow', '.newsletter-right-arrow');
    setupInfiniteCarousel('.article-carousel', '.left-arrow', '.right-arrow');
}
