// scripts/carousel.js
export function initCarousels() {
    function setupInfiniteCarousel(carouselSelector, leftArrowSelector, rightArrowSelector) {
        const carousel = document.querySelector(carouselSelector);
        const leftArrow = document.querySelector(leftArrowSelector);
        const rightArrow = document.querySelector(rightArrowSelector);

        if (!carousel || !leftArrow || !rightArrow) {
            console.error(`Carousel elements not found for selectors: ${carouselSelector}. Please check your HTML.`);
            return;
        }

        // Clone items for infinite effect
        const numToClone = 3;
        const items = Array.from(carousel.children);

        for (let i = numToClone - 1; i >= 0; i--) {
            carousel.prepend(items[items.length - 1 - i].cloneNode(true));
        }
        for (let i = 0; i < numToClone; i++) {
            carousel.append(items[i].cloneNode(true));
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
            return firstItem.offsetWidth
                + parseFloat(style.marginRight)
                + parseFloat(style.marginLeft)
                + parseFloat(getComputedStyle(carousel).gap || 0);
        };

        let cardWidth = getCardWidth();
        window.addEventListener('resize', () => {
            cardWidth = getCardWidth();
        });

        // ---- Infinite scroll fix ----
        function handleInfiniteScroll() {
            const currentScroll = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;

            if (currentScroll >= maxScroll - 10) {
                carousel.scrollLeft = initialScrollOffset;
            } else if (currentScroll <= 10) {
                carousel.scrollLeft = maxScroll - (numToClone * cardWidth);
            }
        }

        let scrollTimeout;
        let isManualScroll = false;

        carousel.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (!isManualScroll) {
                    handleInfiniteScroll();
                }
                isManualScroll = false;
            }, 200); // increased debounce
        });

        // ---- Auto-scroll fix ----
        let autoScrollInterval = setInterval(() => {
            if (!isManualScroll) {
                carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        }, 10000); // slower scroll

        const resetAutoScroll = () => {
            clearInterval(autoScrollInterval);
            autoScrollInterval = setInterval(() => {
                if (!isManualScroll) {
                    carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            }, 10000);
        };

        leftArrow.addEventListener('click', () => {
            isManualScroll = true;
            carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            resetAutoScroll();
        });

        rightArrow.addEventListener('click', () => {
            isManualScroll = true;
            carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
            resetAutoScroll();
        });
    }

    setupInfiniteCarousel('.newsletter-carousel', '.newsletter-carousel-arrow.left-arrow', '.newsletter-carousel-arrow.right-arrow');
    setupInfiniteCarousel('.article-carousel', '.left-arrow:not(.newsletter-carousel-arrow)', '.right-arrow:not(.newsletter-carousel-arrow)');
}
