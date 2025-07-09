// load-header.js – injects shared header and auto‑fixes its paths so it
// works from ANY folder depth (root, /pages/, /pages/foo/, etc.)
// ---------------------------------------------------------------------
// • Fetches ../pages/partials/header.html relative to this script file.
// • After insertion it prefixes every _relative_ src/href inside the header
//   with the correct number of "../" segments.
// • Keeps your existing hamburger toggle + active‑link highlight.
// ---------------------------------------------------------------------

const HEADER_URL = new URL("../pages/partials/header.html", import.meta.url).href;

async function insertHeader() {
  try {
    /* 1. Fetch fragment */
    const res = await fetch(HEADER_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const headerHTML = await res.text();

    /* 2. Inject */
    const placeholder = document.getElementById("header-placeholder");
    if (!placeholder) throw new Error("header-placeholder div not found");
    placeholder.innerHTML = headerHTML;

    /* 3. Path‑prefix logic ----------------------------------------- */
    // How many levels deep is the current page relative to project root?
    const depth = (() => {
      // e.g.  "/index.html"        → ["index.html"]           → depth 0
      //       "/pages/foo.html"    → ["pages","foo.html"]    → depth 1
      //       "/pages/nest/bar.html" → ["pages","nest","bar.html"] → depth 2
      const parts = window.location.pathname
        .replace(/\\+/g, "/")
        .split("/")
        .filter(Boolean);
      return parts.length - 1; // subtract the html file itself
    })();

    const prefix = depth ? "../".repeat(depth) : "";

    function needsFix(val) {
      return (
        val &&
        !val.startsWith("http") && // absolute URL
        !val.startsWith("/")   && // root‑relative already
        !val.startsWith("#")    && // in‑page anchor
        !val.match(/^\w+:/)        // mailto:, tel:, etc.
      );
    }

    // Add prefix to <img src> and <a href>
    placeholder.querySelectorAll("img[src]").forEach(img => {
      const src = img.getAttribute("src");
      if (needsFix(src)) img.setAttribute("src", prefix + src);
    });

    placeholder.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href");
      if (needsFix(href)) a.setAttribute("href", prefix + href);
    });

    /* 4. Hamburger / mobile nav ------------------------------------ */
    const navBtn = placeholder.querySelector(".nav-toggle");
    const header = placeholder.querySelector("header");
    navBtn?.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      navBtn.setAttribute("aria-expanded", isOpen);
      navBtn.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    /* 5. Auth modal handling --------------------------------------- */
    const modal = placeholder.querySelector("#auth-modal");
    if (modal) document.body.appendChild(modal);

    /* 6. Highlight active link ------------------------------------- */
    const currentPath = window.location.pathname.replace(/\/+/g, "/");
    placeholder.querySelectorAll("nav a").forEach(link => {
      const fullPath = new URL(link.getAttribute("href"), window.location.origin).pathname;
      if (currentPath.endsWith(fullPath)) link.classList.add("active");
    });

    /* 7. Signal ready ---------------------------------------------- */
    document.dispatchEvent(new Event("header:loaded"));
  } catch (err) {
    console.error("[load-header]", err.message);
  }
}

/* Run immediately once DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", insertHeader);
} else {
  insertHeader();
}

export { insertHeader };
