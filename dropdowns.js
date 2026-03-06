
/* =========================================================
   DROPDOWNS.JS
   ---------------------------------------------------------
   This file controls ALL DROPDOWN behavior on the site.

   Your rule:
   - Tap title → dropdown opens
   - Tap title again → dropdown closes

   This script is written so ANY future dropdown can use the
   same behavior, not just the Streaks dropdown.
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits until the HTML page is fully loaded before trying
   to connect dropdown behavior to elements.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeDropdowns(); /* Connect dropdown behavior */
});


/* =========================================================
   INITIALIZE DROPDOWNS
   ---------------------------------------------------------
   Finds all dropdown toggle buttons and attaches the click
   behavior to them.
   ========================================================= */

function initializeDropdowns() {

  /* Finds every dropdown toggle button on the page */
  const dropdownButtons = document.querySelectorAll(".dropdown-toggle-button");

  dropdownButtons.forEach(function(button) {

    /* Each button controls a dropdown content area */
    const targetId = button.getAttribute("aria-controls");
    const dropdownContent = document.getElementById(targetId);

    if (!dropdownContent) {
      return; /* Skip safely if the target element does not exist */
    }

    /* Click event for opening/closing dropdown */
    button.addEventListener("click", function() {
      toggleDropdown(button, dropdownContent);
    });

  });

}


/* =========================================================
   TOGGLE DROPDOWN
   ---------------------------------------------------------
   Opens the dropdown if it is closed.
   Closes it if it is open.
   ========================================================= */

function toggleDropdown(button, dropdownContent) {

  const isClosed = dropdownContent.hasAttribute("hidden");

  if (isClosed) {
    openDropdown(button, dropdownContent);
  } else {
    closeDropdown(button, dropdownContent);
  }

}


/* =========================================================
   OPEN DROPDOWN
   ========================================================= */

function openDropdown(button, dropdownContent) {

  dropdownContent.removeAttribute("hidden"); /* Makes dropdown visible */
  button.setAttribute("aria-expanded", "true"); /* Accessibility state */

}


/* =========================================================
   CLOSE DROPDOWN
   ========================================================= */

function closeDropdown(button, dropdownContent) {

  dropdownContent.setAttribute("hidden", ""); /* Hides dropdown */
  button.setAttribute("aria-expanded", "false"); /* Accessibility state */

}
