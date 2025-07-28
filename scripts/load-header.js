// load-header.js – injects shared header and modal, and auto‑fixes paths
// ---------------------------------------------------------------------
// • Injects ../pages/partials/header.html and auth-modal.html
// • Auto-corrects all relative src/href paths
// • Keeps hamburger toggle and highlights active nav links
// ---------------------------------------------------------------------

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
            return parts.length - 1;
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

        // 6. Signal ready for other scripts (like mode toggle)
        document.dispatchEvent(new Event("header:loaded"));
    } catch (err) {
        console.error("[load-header]", err.message);
    }
}

async function insertModal() {
    try {
        const res = await fetch(MODAL_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Modal fetch failed: ${res.status}`);
        const modalHTML = await res.text();
        const container = document.createElement("div");
        container.innerHTML = modalHTML;
        document.body.appendChild(container);
    } catch (err) {
        console.error("[load-modal]", err.message);
    }
}

// Run both once DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        insertHeader().then(insertModal);
    });
} else {
    insertHeader().then(insertModal);
}

// Mode Toggle Logic - Runs AFTER header is loaded
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

export { insertHeader };