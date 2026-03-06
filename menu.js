
/* =========================================================
   MENU.JS
   ---------------------------------------------------------
   This file controls the HAMBURGER MENU behavior.

   Its job is to:
   - open the mobile navigation drawer
   - close the mobile navigation drawer
   - keep the hamburger button accessibility state updated
   - support the right-side mobile drawer you requested

   IMPORTANT:
   This file only handles menu behavior.
   It does NOT control menu colors or layout styling.
   Those belong in:
   - theme.css
   - layout.css
   - components.css
   ========================================================= */


/* =========================================================
   SAFE MENU START
   ---------------------------------------------------------
   Waits for the page HTML to finish loading before trying to
   connect menu behavior to page elements.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeMobileMenu(); /* Starts hamburger menu behavior after the page is ready */
});


/* =========================================================
   MAIN MENU INITIALIZER
   ---------------------------------------------------------
   Finds the menu elements and connects the open/close events.
   ========================================================= */

function initializeMobileMenu() {
  const menuButton = document.getElementById("hamburger-menu-button"); /* Finds the top-right hamburger button */
  const navigationDrawer = document.getElementById("mobile-navigation-drawer"); /* Finds the hidden mobile menu drawer */

  if (!menuButton || !navigationDrawer) {
    return; /* Stops safely if the expected menu elements are missing */
  }

  menuButton.addEventListener("click", function () {
    toggleMobileMenu(menuButton, navigationDrawer); /* Opens or closes the menu when the hamburger button is tapped */
  });
}


/* =========================================================
   TOGGLE MOBILE MENU
   ---------------------------------------------------------
   Checks whether the menu is currently open or closed, then
   switches it to the opposite state.

   This creates the behavior you wanted:
   - tap once = open
   - tap again = close
   ========================================================= */

function toggleMobileMenu(menuButton, navigationDrawer) {
  const menuIsHidden = navigationDrawer.hasAttribute("hidden"); /* True when the drawer is currently closed */

  if (menuIsHidden) {
    openMobileMenu(menuButton, navigationDrawer); /* Opens the menu if it is currently hidden */
  } else {
    closeMobileMenu(menuButton, navigationDrawer); /* Closes the menu if it is currently open */
  }
}


/* =========================================================
   OPEN MOBILE MENU
   ---------------------------------------------------------
   Makes the hidden drawer visible and updates accessibility
   attributes so screen readers know the menu is open.
   ========================================================= */

function openMobileMenu(menuButton, navigationDrawer) {
  navigationDrawer.removeAttribute("hidden"); /* Makes the mobile drawer visible on screen */
  menuButton.setAttribute("aria-expanded", "true"); /* Announces that the hamburger button now controls an open menu */
}


/* =========================================================
   CLOSE MOBILE MENU
   ---------------------------------------------------------
   Hides the drawer and updates accessibility state so
   screen readers know the menu is closed again.
   ========================================================= */

function closeMobileMenu(menuButton, navigationDrawer) {
  navigationDrawer.setAttribute("hidden", ""); /* Hides the mobile drawer again */
  menuButton.setAttribute("aria-expanded", "false"); /* Announces that the menu is now closed */
}
