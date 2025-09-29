// load-header.js – injects shared header and modal, and auto‑fixes paths
// ---------------------------------------------------------------------
// • Injects ../pages/partials/header.html and auth-modal.html
// • Auto-corrects all relative src/href paths
// • Keeps hamburger toggle and highlights active nav links
// ---------------------------------------------------------------------

// Load header and initialize any header-specific functionality
import { initializeThemeSystem, applyThemesToExistingContent } from './theme-utilities.js';

const HEADER_URL = new URL("../pages/partials/header.html", import.meta.url).href;
const MODAL_URL = new URL("../pages/partials/auth-modal.html", import.meta.url).href;

async function insertHeader() {
    try {
        // 1. Fetch header
        const res = await fetch(HEADER_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Header fetch failed: ${res.status}`);
        const headerHTML = await res.text();

        // 2. Inject header
        const placeholder = document.getElementById("header-placeholder");
        if (!placeholder) throw new Error("header-placeholder div not found");
        placeholder.innerHTML = headerHTML;

        // 3. Fix relative paths in header
        const depth = (() => {
            const parts = window.location.pathname
                .replace(/\\+/g, "/")
                .split("/")
                .filter(Boolean);
            // Adjust depth calculation if index.html is at root and partials are deeper
            // For /index.html -> [] -> depth = 0
            // For /pages/article.html -> [pages] -> depth = 1
            const pathSegments = window.location.pathname.replace(/\/+/g, "/").split('/').filter(s => s.length > 0);
            return pathSegments.length > 0 && pathSegments[pathSegments.length - 1].includes('.') ? pathSegments.length -1 : pathSegments.length;
        })();
        const prefix = depth ? "../".repeat(depth) : "";

        function needsFix(val) {
            return (
                val &&
                !val.startsWith("http") &&
                !val.startsWith("/") &&
                !val.startsWith("#") &&
                !val.match(/^\w+:/)
            );
        }

        placeholder.querySelectorAll("img[src]").forEach(img => {
            const src = img.getAttribute("src");
            if (needsFix(src)) img.setAttribute("src", prefix + src);
        });

        placeholder.querySelectorAll("a[href]").forEach(a => {
            const href = a.getAttribute("href");
            if (needsFix(href)) a.setAttribute("href", prefix + href);
        });

        // 4. Hamburger menu toggle
        const navBtn = placeholder.querySelector(".nav-toggle");
        const header = placeholder.querySelector("header");
        navBtn?.addEventListener("click", () => {
            const isOpen = header.classList.toggle("nav-open");
            navBtn.setAttribute("aria-expanded", isOpen);
            navBtn.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
        });

        // 5. Highlight active nav link
        const currentPath = window.location.pathname.replace(/\/+/g, "/");
        placeholder.querySelectorAll("nav a").forEach(link => {
            const fullPath = new URL(link.getAttribute("href"), window.location.origin).pathname;
            if (currentPath.endsWith(fullPath)) link.classList.add("active");
        });

        // 6. Signal header is ready
        document.dispatchEvent(new Event("header:loaded"));
        console.log("Header loaded and event dispatched.");

    } catch (err) {
        console.error("[load-header] Error loading header:", err.message);
    }
}

async function insertModal() {
    try {
        const res = await fetch(MODAL_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Modal fetch failed: ${res.status}`);
        const modalHTML = await res.text();

        // Target the new placeholder div instead of appending to body
        const placeholder = document.getElementById("auth-modal-placeholder");
        if (!placeholder) throw new Error("auth-modal-placeholder div not found");

        placeholder.innerHTML = modalHTML;
        console.log("Auth modal loaded into placeholder.");

        // Dispatch a custom event after the modal is loaded
        // This is what auth-modal.js will listen for
        document.dispatchEvent(new CustomEvent("authModal:loaded"));

    } catch (err) {
        console.error("[load-modal] Error loading modal:", err.message);
    }
}

// Run both header and modal insertion once DOM is ready
// Ensure modal insertion happens *after* header insertion
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
        insertHeader()
            .then(() => insertModal()) // Ensure insertModal is called after insertHeader resolves
            .catch(err => console.error("Error in loading sequence:", err));
    });
} else {
    // If DOM is already ready (e.g., script loaded late)
    insertHeader()
        .then(() => insertModal())
        .catch(err => console.error("Error in loading sequence:", err));
}

// Mode Toggle Logic - Runs AFTER header is loaded
// This listener remains the same, as it depends on header elements
document.addEventListener("header:loaded", () => {
    const modeToggle = document.getElementById("mode-toggle");
    const body = document.body;

    if (!modeToggle) {
        console.warn("Mode toggle button not found after header load.");
        return;
    }

    // Check for saved preference or system preference
    const savedMode = localStorage.getItem("theme");
    if (savedMode) {
        body.classList.add(savedMode);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        body.classList.add("dark-mode");
    } else {
        body.classList.add("light-mode"); // Default to light if no preference
    }

    // Update the icon based on current mode
    function updateModeToggleIcon() {
        if (body.classList.contains("dark-mode")) {
            modeToggle.classList.add("dark");
        } else {
            modeToggle.classList.remove("dark");
        }
    }
    updateModeToggleIcon(); // Call initially

    modeToggle.addEventListener("click", () => {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
            localStorage.setItem("theme", "light-mode");
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark-mode");
        }
        updateModeToggleIcon(); // Update icon after toggle
    });
});

// No need to export insertHeader if it's solely managed internally for loading
// export { insertHeader };