
/* =========================================================
   APP.JS
   ---------------------------------------------------------
   This is the SHARED STARTUP file for the homepage.

   Its job is to:
   - read labels from labels.js
   - read settings from config.js
   - insert easy-to-edit text into the page
   - apply starter placeholder content while the real backend
     and AI systems are not connected yet
   - initialize simple page state safely

   IMPORTANT:
   This file should stay focused on startup/setup logic.
   More specific feature behavior belongs in separate files like:
   - menu.js
   - dropdowns.js
   - tasks.js
   - streaks.js
   - brain-dump.js
   ========================================================= */


/* =========================================================
   SAFE APP START
   ---------------------------------------------------------
   Waits for the HTML page to finish loading before trying to
   find or update page elements.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeApp(); /* Starts the homepage setup after the page is ready */
});


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Runs the startup steps in a clean, readable order.
   ========================================================= */

function initializeApp() {
  applyLabelsToPage(); /* Replaces hardcoded visible text with label values from labels.js */
  applyStarterPlaceholderContent(); /* Inserts starter example tasks/streaks while live data is not connected */
  applyInitialUiState(); /* Sets initial open/closed/hidden UI states based on config.js */
  logStartupSummary(); /* Prints a readable console summary for debugging during development */
}


/* =========================================================
   APPLY LABELS TO PAGE
   ---------------------------------------------------------
   This function updates visible text using values from labels.js.

   Why this matters:
   If you later rename something like "History" or "Brain Dump",
   you can change it in labels.js without hunting through HTML.
   ========================================================= */

function applyLabelsToPage() {
  setTextById("daily-focus-title", getLabel("dailyFocusTitle")); /* Updates the Daily Focus card title */
  setTextById("weekly-tasks-title", getLabel("weeklyTasksTitle")); /* Updates the Weekly Tasks card title */
  setTextById("streaks-dropdown-title", getLabel("streaksTitle")); /* Updates the homepage Streaks dropdown title */
  setTextById("brain-dump-title", getLabel("brainDumpTitle")); /* Updates the Brain Dump card title */
  setTextById("review-panel-title", getLabel("reviewPanelTitle")); /* Updates the slide-up review panel title */

  setTextById("brain-dump-submit-button", getLabel("submitButton")); /* Updates the Brain Dump Submit button text */
  setTextById("review-confirm-button", getLabel("confirmButton")); /* Updates the review Confirm button text */
  setTextById("review-edit-button", getLabel("editButton")); /* Updates the review Edit button text */
  setTextById("review-cancel-button", getLabel("cancelButton")); /* Updates the review Cancel button text */

  setTextById("review-panel-content", "<p>" + getLabel("reviewPlaceholder") + "</p>", true); /* Updates the initial placeholder inside the review panel */

  setInputPlaceholderById("brain-dump-input", getLabel("brainDumpPlaceholder")); /* Updates the Brain Dump textarea placeholder */

  setTextBySelector(".mobile-navigation-title", getLabel("menuTitle")); /* Updates the title shown at the top of the hamburger drawer */

  updateNavigationLinkText(); /* Applies menu page labels to the existing navigation links */
}


/* =========================================================
   UPDATE NAVIGATION LINK TEXT
   ---------------------------------------------------------
   Updates the hamburger menu links with labels from labels.js.
   This keeps menu titles editable from one central place.
   ========================================================= */

function updateNavigationLinkText() {
  const navigationLinks = document.querySelectorAll(".mobile-navigation-list a"); /* Finds all menu links in the hamburger drawer */

  if (navigationLinks.length < 5) {
    return; /* Stops safely if the expected links are not present */
  }

  navigationLinks[0].textContent = getLabel("homePage"); /* Sets the Home menu link label */
  navigationLinks[1].textContent = getLabel("streaksPage"); /* Sets the Streaks menu link label */
  navigationLinks[2].textContent = getLabel("healthPage"); /* Sets the Health menu link label */
  navigationLinks[3].textContent = getLabel("historyPage"); /* Sets the History menu link label */
  navigationLinks[4].textContent = getLabel("addPage"); /* Sets the Add menu link label */
}


/* =========================================================
   APPLY STARTER PLACEHOLDER CONTENT
   ---------------------------------------------------------
   While the backend/database/AI are not connected yet,
   this function fills the page with starter example content.

   This makes it easier to style and preview the interface now.
   ========================================================= */

function applyStarterPlaceholderContent() {
  if (!getConfig("useStarterPlaceholderData")) {
    return; /* Stops if starter placeholder data is disabled in config.js */
  }

  populateStarterTaskList(
    "daily-focus-list",
    getConfig("starterDailyTaskCount"),
    getLabel("exampleDailyTask"),
    "Complete daily task"
  ); /* Inserts starter tasks into the Daily Focus list */

  populateStarterTaskList(
    "weekly-tasks-list",
    getConfig("starterWeeklyTaskCount"),
    getLabel("exampleWeeklyTask"),
    "Complete weekly task"
  ); /* Inserts starter tasks into the Weekly Tasks list */

  populateStarterStreakList(
    "streaks-dropdown-content",
    getConfig("starterStreakCount"),
    getLabel("exampleStreakName"),
    getLabel("exampleStreakStars")
  ); /* Inserts starter streak rows into the homepage Streaks dropdown */
}


/* =========================================================
   POPULATE STARTER TASK LIST
   ---------------------------------------------------------
   Builds simple placeholder task rows for either:
   - Daily Focus
   - Weekly Tasks
   ========================================================= */

function populateStarterTaskList(containerId, itemCount, baseTaskLabel, buttonAriaLabel) {
  const container = document.getElementById(containerId); /* Finds the target task list container */

  if (!container) {
    return; /* Stops safely if the container is not found */
  }

  container.innerHTML = ""; /* Clears any placeholder HTML already in the list before rebuilding it */

  for (let index = 0; index < itemCount; index += 1) {
    const taskRow = document.createElement("div"); /* Creates one task row wrapper */
    taskRow.className = "task-row"; /* Applies the reusable task row styling */

    const checkButton = document.createElement("button"); /* Creates the circular complete button */
    checkButton.className = "task-check-button"; /* Applies the task button styling */
    checkButton.type = "button"; /* Keeps the button from acting like a form submit button */
    checkButton.setAttribute("aria-label", buttonAriaLabel); /* Accessibility label describing the button action */
    checkButton.textContent = "○"; /* Placeholder open-circle symbol until custom icons are added */

    const taskText = document.createElement("span"); /* Creates the visible task text element */
    taskText.className = "task-text"; /* Applies task text styling if added later */
    taskText.textContent = itemCount > 1 ? baseTaskLabel + " " + (index + 1) : baseTaskLabel; /* Adds numbering only if there is more than one starter item */

    taskRow.appendChild(checkButton); /* Adds the complete button to the row */
    taskRow.appendChild(taskText); /* Adds the task text to the row */

    container.appendChild(taskRow); /* Inserts the finished row into the target list */
  }
}


/* =========================================================
   POPULATE STARTER STREAK LIST
   ---------------------------------------------------------
   Builds simple placeholder streak rows for the homepage
   Streaks dropdown while live data is not connected yet.
   ========================================================= */

function populateStarterStreakList(containerId, itemCount, streakName, streakStars) {
  const container = document.getElementById(containerId); /* Finds the dropdown content container */

  if (!container) {
    return; /* Stops safely if the container is not found */
  }

  container.innerHTML = ""; /* Clears any placeholder HTML already inside the streak list */

  for (let index = 0; index < itemCount; index += 1) {
    const streakRow = document.createElement("div"); /* Creates one streak row wrapper */
    streakRow.className = "streak-row"; /* Applies the reusable streak row styling */

    const nameSpan = document.createElement("span"); /* Creates the streak name element */
    nameSpan.className = "streak-name"; /* Applies streak name styling if added later */
    nameSpan.textContent = itemCount > 1 ? streakName + " " + (index + 1) : streakName; /* Adds numbering only if there is more than one starter streak */

    const starsSpan = document.createElement("span"); /* Creates the star display element */
    starsSpan.className = "streak-stars"; /* Applies star styling if added later */
    starsSpan.setAttribute("aria-label", "Current weekly stars"); /* Accessibility label for the star display */
    starsSpan.textContent = getConfig("useCustomStarImage") ? getConfig("starFallbackText") : streakStars; /* Uses fallback text if image-based stars are planned later */

    streakRow.appendChild(nameSpan); /* Adds the streak name to the row */
    streakRow.appendChild(starsSpan); /* Adds the star display to the row */

    container.appendChild(streakRow); /* Inserts the streak row into the dropdown content */
  }
}


/* =========================================================
   APPLY INITIAL UI STATE
   ---------------------------------------------------------
   Sets the starting visible/hidden/open/closed state for:
   - mobile menu drawer
   - review panel
   - dropdown content

   These defaults come from config.js.
   ========================================================= */

function applyInitialUiState() {
  const mobileNavigationDrawer = document.getElementById("mobile-navigation-drawer"); /* Finds the hamburger drawer */
  const reviewPanel = document.getElementById("review-panel"); /* Finds the slide-up review panel */
  const streaksDropdownContent = document.getElementById("streaks-dropdown-content"); /* Finds the homepage streak dropdown content */
  const streaksDropdownToggle = document.getElementById("streaks-dropdown-toggle"); /* Finds the homepage streak dropdown toggle button */
  const hamburgerMenuButton = document.getElementById("hamburger-menu-button"); /* Finds the hamburger menu button */

  if (mobileNavigationDrawer && getConfig("mobileMenuStartsHidden")) {
    mobileNavigationDrawer.hidden = true; /* Keeps the navigation drawer hidden on initial page load */
  }

  if (reviewPanel && getConfig("reviewPanelStartsHidden")) {
    reviewPanel.hidden = true; /* Keeps the review panel hidden until Brain Dump is submitted */
  }

  if (streaksDropdownContent && getConfig("dropdownsStartClosed")) {
    streaksDropdownContent.hidden = true; /* Keeps the Streaks dropdown closed at startup */
  }

  if (streaksDropdownToggle && getConfig("dropdownsStartClosed")) {
    streaksDropdownToggle.setAttribute("aria-expanded", "false"); /* Marks the dropdown as closed for accessibility */
  }

  if (hamburgerMenuButton && getConfig("mobileMenuStartsHidden")) {
    hamburgerMenuButton.setAttribute("aria-expanded", "false"); /* Marks the mobile menu button as closed for accessibility */
  }
}


/* =========================================================
   HELPER: SET TEXT BY ID
   ---------------------------------------------------------
   Updates the text or HTML of an element found by ID.
   This keeps text-setting code cleaner and easier to read.
   ========================================================= */

function setTextById(elementId, value, allowHtml = false) {
  const element = document.getElementById(elementId); /* Finds the target element by its ID */

  if (!element) {
    return; /* Stops safely if the element does not exist */
  }

  if (allowHtml) {
    element.innerHTML = value; /* Inserts HTML content when explicitly allowed */
  } else {
    element.textContent = value; /* Inserts plain text only */
  }
}


/* =========================================================
   HELPER: SET TEXT BY SELECTOR
   ---------------------------------------------------------
   Updates the text content of the first element matching a
   CSS selector.
   ========================================================= */

function setTextBySelector(selector, value) {
  const element = document.querySelector(selector); /* Finds the first matching element */

  if (!element) {
    return; /* Stops safely if no element matches the selector */
  }

  element.textContent = value; /* Replaces the visible text content */
}


/* =========================================================
   HELPER: SET INPUT PLACEHOLDER BY ID
   ---------------------------------------------------------
   Updates placeholder text for inputs or textareas.
   ========================================================= */

function setInputPlaceholderById(elementId, value) {
  const element = document.getElementById(elementId); /* Finds the target input or textarea */

  if (!element) {
    return; /* Stops safely if the input is not found */
  }

  element.setAttribute("placeholder", value); /* Replaces the current placeholder text */
}


/* =========================================================
   STARTUP DEBUG SUMMARY
   ---------------------------------------------------------
   Prints a readable summary in the browser console to help
   during the early build stage.

   This is useful while wiring the project together and can be
   removed later if desired.
   ========================================================= */

function logStartupSummary() {
  console.log("App initialized."); /* Confirms the startup script ran */
  console.log("Weekly reset:", getConfig("weeklyResetLabel")); /* Shows the configured weekly reset timing */
  console.log("Brain Dump uses AI:", getConfig("brainDumpUsesAI")); /* Shows whether AI parsing is enabled in config */
  console.log("Mobile menu side:", getConfig("mobileMenuSide")); /* Shows which side the hamburger drawer should open from */
}
