// scripts/carousel.js
// This script manages the functionality for the newsletter and student articles carousels,
// including navigation arrows and infinite looping.

document.addEventListener("DOMContentLoaded", () => {
    // --- Helper function for setting up carousels with infinite loop functionality ---
    function setupInfiniteCarousel(carouselSelector, leftArrowSelector, rightArrowSelector) {
        const carousel = document.querySelector(carouselSelector);
        const leftArrow = document.querySelector(leftArrowSelector);
        const rightArrow = document.querySelector(rightArrowSelector);

        if (!carousel || !leftArrow || !rightArrow) {
            console.error(`Carousel elements not found for selectors: ${carouselSelector}`);
            return;
        }

        // Clone and prepend the last few items to the beginning
        // and clone and append the first few items to the end.
        // This is the core trick for creating an "infinite" loop.
        const numToClone = 3; // The number of items to clone for the infinite loop effect
        const items = Array.from(carousel.children);

        // Prepend clones of the last items
        for (let i = numToClone - 1; i >= 0; i--) {
            const clone = items[items.length - 1 - i].cloneNode(true);
            carousel.prepend(clone);
        }

        // Append clones of the first items
        for (let i = 0; i < numToClone; i++) {
            const clone = items[i].cloneNode(true);
            carousel.append(clone);
        }

        // Initially scroll to the "real" first item, skipping the cloned ones
        let initialScrollOffset;
        // Wait for the layout to render before getting offset, using a setTimeout
        // to ensure all elements are in place.
        setTimeout(() => {
            if (carousel.children[numToClone]) {
                initialScrollOffset = carousel.children[numToClone].offsetLeft;
                carousel.scrollLeft = initialScrollOffset;
            }
        }, 0);

        // Calculate the width of a single carousel item including its gap
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


        // --- Event Listeners for Arrow Buttons ---
        leftArrow.addEventListener('click', () => {
            carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });

        rightArrow.addEventListener('click', () => {
            carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });


        // --- Infinite Loop Logic ---
        // This function jumps the scroll position to create the looping effect
        function handleInfiniteScroll() {
            // Get the current scroll position
            const currentScroll = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;

            // When scrolling past the last "real" item, jump to the start
            // The maxScroll includes the cloned items at the end.
            if (currentScroll >= maxScroll - (numToClone * cardWidth) && currentScroll < maxScroll) {
                // If we've scrolled into the cloned items at the end, jump to the real start.
                // The jump is instantaneous (behavior: 'auto') to be seamless.
                carousel.scrollLeft = initialScrollOffset;
            }
            // When scrolling past the first "real" item, jump to the end
            else if (currentScroll <= initialScrollOffset) {
                // If we've scrolled into the cloned items at the beginning, jump to the real end.
                // Subtracting the cloned items' width gives us the correct position.
                carousel.scrollLeft = maxScroll - (numToClone * cardWidth) - (carousel.children[0].offsetWidth) - 100;
            }
        }

        // Using a debounced scroll listener for performance
        let isScrolling;
        carousel.addEventListener('scroll', () => {
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                handleInfiniteScroll();
            }, 50); // Adjust debounce time as needed
        });


        // --- Auto-Scroll Interval ---
        setInterval(() => {
            carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }, 7000); // Scrolls every 7 seconds
    }

    // --- Setup both carousels ---
    setupInfiniteCarousel('.newsletter-carousel', '.newsletter-left-arrow', '.newsletter-right-arrow');
    setupInfiniteCarousel('.article-carousel', '.left-arrow', '.right-arrow');
});
