
/* =========================================================
   LABELS.JS
   ---------------------------------------------------------
   This file stores VISIBLE TEXT used across the site.

   Edit this file when you want to rename things like:
   - page names
   - card titles
   - button text
   - menu labels
   - review panel labels
   - placeholder text

   Keeping labels here means you do NOT have to search through
   multiple HTML or JS files just to rename a title later.
   ========================================================= */


/* =========================================================
   MAIN LABEL OBJECT
   ---------------------------------------------------------
   Each property below controls text shown somewhere in the UI.
   The comment next to each line explains what screen element
   the label is meant for.
   ========================================================= */

window.APP_LABELS = {

  /* =========================
     PAGE / MENU LABELS
     ========================= */
  homePage: "Home", /* Hamburger menu label for the homepage */
  streaksPage: "Streaks", /* Hamburger menu label for the full Streaks page */
  healthPage: "Health", /* Hamburger menu label for the Health page */
  historyPage: "History", /* Hamburger menu label for the monthly History page */
  addPage: "Add", /* Hamburger menu label for the Add page */

  /* =========================
     HOMEPAGE CARD TITLES
     ========================= */
  dailyFocusTitle: "Daily Focus", /* Title shown on the left homepage card */
  weeklyTasksTitle: "Weekly Tasks", /* Title shown on the right homepage card */
  streaksTitle: "Streaks", /* Title shown on the homepage dropdown card */
  brainDumpTitle: "Brain Dump", /* Title shown above the Brain Dump input area */

  /* =========================
     BUTTON LABELS
     ========================= */
  submitButton: "Submit", /* Text shown on the Brain Dump submit button */
  confirmButton: "Confirm", /* Text shown on the review panel confirm button */
  editButton: "Edit", /* Text shown on the review panel edit button */
  cancelButton: "Cancel", /* Text shown on the review panel cancel button */

  /* =========================
     MENU / DRAWER LABELS
     ========================= */
  menuTitle: "Menu", /* Title shown at the top of the hamburger navigation drawer */

  /* =========================
     REVIEW PANEL LABELS
     ========================= */
  reviewPanelTitle: "Review", /* Title shown on the slide-up review panel */
  reviewPlaceholder: "Detected item details will appear here.", /* Placeholder text shown before AI review content is loaded */

  /* =========================
     INPUT PLACEHOLDERS
     ========================= */
  brainDumpPlaceholder: "Type here...", /* Placeholder text shown inside the Brain Dump textarea */

  /* =========================
     EXAMPLE / STARTER TEXT
     These are placeholder items used while the layout is
     being built before real data is connected.
     ========================= */
  exampleDailyTask: "Example daily task", /* Temporary sample task shown in Daily Focus */
  exampleWeeklyTask: "Example weekly task", /* Temporary sample task shown in Weekly Tasks */
  exampleStreakName: "Vitamin", /* Temporary sample streak name shown in homepage Streaks */
  exampleStreakStars: "★★★" /* Temporary sample stars shown until real star rendering is added */
};


/* =========================================================
   OPTIONAL HELPER FUNCTION
   ---------------------------------------------------------
   This helper makes it easier for future JS files to fetch
   labels safely.

   Example:
   getLabel("dailyFocusTitle")
   ========================================================= */

window.getLabel = function(labelKey) {
  return window.APP_LABELS[labelKey] || ""; /* Returns the requested label, or a blank string if not found */
};
