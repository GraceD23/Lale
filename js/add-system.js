/* =========================================================
   ADD-SYSTEM.JS
   ---------------------------------------------------------
   Controls starter behavior for the Add page.

   Current starter features:
   - reads the typed command input
   - opens the Add review panel
   - shows starter review content
   - keeps overlay behavior clean so the panel feels separate

   Future features planned:
   - parse typed commands
   - ask only relevant follow-up questions
   - create tasks, streaks, health trackers, and new pages
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   Runs when the page finishes loading.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeAddSystem();
});


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeAddSystem() {
  attachAddSubmitHandler(); /* connects the Add page submit button */
  attachAddReviewButtons(); /* connects the Add review panel buttons */
}


/* =========================================================
   SUBMIT BUTTON HANDLER
   ========================================================= */

function attachAddSubmitHandler() {
  const submitButton = document.getElementById("add-command-submit-button"); /* Add page submit button */

  if (!submitButton) {
    return;
  }

  submitButton.addEventListener("click", function () {
    handleAddCommandSubmit();
  });
}


/* =========================================================
   HANDLE ADD COMMAND SUBMIT
   Reads the typed command and opens the review panel.
   ========================================================= */

function handleAddCommandSubmit() {
  const input = document.getElementById("add-command-input"); /* typed command textarea */

  if (!input) {
    return;
  }

  const rawText = input.value; /* exact typed text */
  const cleanedText = rawText.trim(); /* trimmed text */

  if (cleanedText === "") {
    openAddReviewPanel(`
      <p><strong>Nothing to review yet.</strong></p>
      <p>Please type a command before pressing Submit.</p>
    `);
    return;
  }

  openAddReviewPanel(buildAddReviewHtml(cleanedText));
}


/* =========================================================
   BUILD REVIEW HTML
   Creates starter review content for the Add page.
   ========================================================= */

function buildAddReviewHtml(userText) {
  const safeText = escapeHTML(userText); /* safe display text */

  return `
    <p><strong>Review your typed command:</strong></p>
    <p><strong>Typed text:</strong><br>${safeText}</p>
    <p><strong>Starter detected action:</strong><br>Needs command parsing</p>
    <p><strong>Starter next step:</strong><br>Relevant follow-up questions will appear here later.</p>
  `;
}


/* =========================================================
   OPEN ADD REVIEW PANEL
   Shows the Add review panel and the global overlay.
   ========================================================= */

function openAddReviewPanel(html) {
  const panel = document.getElementById("add-review-panel"); /* Add review panel */
  const content = document.getElementById("add-review-content"); /* Add review panel content area */
  const overlay = document.getElementById("global-overlay"); /* page dim overlay */

  if (!panel || !content) {
    return;
  }

  content.innerHTML = html; /* inserts review content */
  panel.removeAttribute("hidden"); /* shows the review panel */

  if (overlay) {
    overlay.removeAttribute("hidden"); /* dims the page behind the panel */
  }
}


/* =========================================================
   CLOSE ADD REVIEW PANEL
   Hides the Add review panel and the global overlay.
   ========================================================= */

function closeAddReviewPanel() {
  const panel = document.getElementById("add-review-panel"); /* Add review panel */
  const overlay = document.getElementById("global-overlay"); /* page dim overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* hides the review panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* hides the page dim overlay */
  }
}


/* =========================================================
   REVIEW BUTTONS
   Connects Confirm / Edit / Cancel behavior.
   ========================================================= */

function attachAddReviewButtons() {
  const confirmButton = document.getElementById("add-review-confirm-button"); /* confirm button */
  const editButton = document.getElementById("add-review-edit-button"); /* edit button */
  const cancelButton = document.getElementById("add-review-cancel-button"); /* cancel button */

  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      handleAddReviewConfirm();
    });
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      handleAddReviewEdit();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      handleAddReviewCancel();
    });
  }
}


/* =========================================================
   CONFIRM BUTTON
   Starter behavior:
   - clears the typed command
   - closes the review panel
   ========================================================= */

function handleAddReviewConfirm() {
  const input = document.getElementById("add-command-input"); /* typed command textarea */

  if (input) {
    input.value = ""; /* clears command after confirm */
  }

  closeAddReviewPanel();
}


/* =========================================================
   EDIT BUTTON
   Starter behavior:
   - leaves the panel open
   - lets the user keep editing the typed command
   ========================================================= */

function handleAddReviewEdit() {
  console.log("Add review edit clicked."); /* starter debug message */
}


/* =========================================================
   CANCEL BUTTON
   Starter behavior:
   - closes the review panel
   - keeps the typed command text
   ========================================================= */

function handleAddReviewCancel() {
  closeAddReviewPanel();
}


/* =========================================================
   HTML ESCAPE
   Prevents typed text from being treated as real HTML.
   ========================================================= */

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
