/* =========================================================
   MENU.JS
   - Hamburger tap to open/close
   - Tap anywhere outside drawer to close
   - Tap hamburger again to close
   - ESC to close
   ========================================================= */

const NAV_LINKS = [
  { label: "Home",     href: "index.html" },
  { label: "Work",     href: "work.html" },
  { label: "Streaks",  href: "streaks.html" },
  { label: "Health",   href: "health.html" },
  { label: "Notes",    href: "notes.html" },
  { label: "Media",    href: "media.html" },
  { label: "Learning", href: "learning.html" },
  { label: "Export",   href: "history.html" },
];

document.addEventListener("DOMContentLoaded", function () {
  injectNav();
  initMenu();
});

function injectNav() {
  const list = document.querySelector(".mobile-navigation-list");
  if (!list) return;
  list.innerHTML = NAV_LINKS.map(function(link) {
    return '<li><a href="' + link.href + '">' + link.label + '</a></li>';
  }).join("\n");
}

function initMenu() {
  const hamburger = document.getElementById("hamburger-menu-button");
  const drawer = document.getElementById("mobile-navigation-drawer");
  const overlay = document.getElementById("global-overlay");

  if (!hamburger || !drawer) return;

  /* Toggle open/close on hamburger tap */
  hamburger.addEventListener("click", function (e) {
    e.stopPropagation();
    const isOpen = !drawer.hidden;
    if (isOpen) {
      closeMenu(drawer, overlay, hamburger);
    } else {
      openMenu(drawer, overlay, hamburger);
    }
  });

  /* Tap overlay to close */
  if (overlay) {
    overlay.addEventListener("click", function () {
      if (!drawer.hidden) closeMenu(drawer, overlay, hamburger);
    });
  }

  /* Tap ANYWHERE on page outside the drawer to close */
  document.addEventListener("click", function (e) {
    if (drawer.hidden) return;
    if (drawer.contains(e.target) || hamburger.contains(e.target)) return;
    closeMenu(drawer, overlay, hamburger);
  });

  /* ESC to close */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) {
      closeMenu(drawer, overlay, hamburger);
    }
  });
}

function openMenu(drawer, overlay, hamburger) {
  drawer.hidden = false;
  if (overlay) overlay.hidden = false;
  if (hamburger) hamburger.setAttribute("aria-expanded", "true");
}

function closeMenu(drawer, overlay, hamburger) {
  drawer.hidden = true;
  if (overlay) overlay.hidden = true;
  if (hamburger) hamburger.setAttribute("aria-expanded", "false");
}
