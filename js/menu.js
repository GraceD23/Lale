/* =========================================================
   MENU.JS
   - Hamburger tap to open/close
   - Tap anywhere outside drawer to close
   - Tap hamburger again to close
   - ESC to close
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initMenu();
});

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
