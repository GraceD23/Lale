
/* =========================================================
   REVIEW-PANEL.JS
   ---------------------------------------------------------
   This file controls the SLIDE-UP REVIEW PANEL behavior.

   Its job is to:
   - open the review panel
   - close the review panel
   - update the review content text
   - connect the Confirm / Edit / Cancel buttons
   - keep this behavior separate from Brain Dump logic

   IMPORTANT:
   This file only controls the panel itself.
   It does NOT decide what the AI detected.
   That decision will come later from brain-dump.js.
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits for the page HTML to fully load before trying to
   connect review panel behavior to page elements.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeReviewPanel(); /* Starts the review panel setup when the page is ready */
});


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Finds the review panel elements and attaches button actions.
   ========================================================= */

function initializeReviewPanel() {
  const reviewPanel = document.getElementById("review-panel"); /* Main slide-up review panel wrapper */
  const confirmButton = document.getElementById("review-confirm-button"); /* Confirm button inside the panel */
  const editButton = document.getElementById("review-edit-button"); /* Edit button inside the panel */
  const cancelButton = document.getElementById("review-cancel-button"); /* Cancel button inside the panel */

  if (!reviewPanel) {
    return; /* Stops safely if the review panel does not exist on the page */
  }

  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      handleReviewConfirm(); /* Runs the default confirm behavior */
    });
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      handleReviewEdit(); /* Runs the default edit behavior */
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      handleReviewCancel(); /* Runs the default cancel behavior */
    });
  }

  /* Makes helper functions available to other scripts like brain-dump.js later */
  window.openReviewPanel = openReviewPanel; /* Global helper for opening the panel */
  window.closeReviewPanel = closeReviewPanel; /* Global helper for closing the panel */
  window.setReviewPanelContent = setReviewPanelContent; /* Global helper for changing review text/content */
}


/* =========================================================
   OPEN REVIEW PANEL
   ---------------------------------------------------------
   Makes the hidden review panel visible.
   Later, CSS animation can make this visually slide upward.
   ========================================================= */

function openReviewPanel() {
  const reviewPanel = document.getElementById("review-panel"); /* Finds the review panel element */

  if (!reviewPanel) {
    return; /* Stops safely if the panel is not found */
  }

  reviewPanel.removeAttribute("hidden"); /* Makes the panel visible */
}


/* =========================================================
   CLOSE REVIEW PANEL
   ---------------------------------------------------------
   Hides the review panel again.
   ========================================================= */

function closeReviewPanel() {
  const reviewPanel = document.getElementById("review-panel"); /* Finds the review panel element */

  if (!reviewPanel) {
    return; /* Stops safely if the panel is not found */
  }

  reviewPanel.setAttribute("hidden", ""); /* Hides the panel */
}


/* =========================================================
   SET REVIEW PANEL CONTENT
   ---------------------------------------------------------
   Updates the content area inside the review panel.

   This is useful later when Brain Dump sends in something like:
   - detected task
   - detected headache
   - detected new category

   allowHtml = true lets future scripts send formatted HTML.
   ========================================================= */

function setReviewPanelContent(content, allowHtml = true) {
  const reviewContent = document.getElementById("review-panel-content"); /* Finds the content area inside the review panel */

  if (!reviewContent) {
    return; /* Stops safely if the content area is not found */
  }

  if (allowHtml) {
    reviewContent.innerHTML = content; /* Inserts formatted HTML when allowed */
  } else {
    reviewContent.textContent = content; /* Inserts plain text only */
  }
}


/* =========================================================
   DEFAULT CONFIRM ACTION
   ---------------------------------------------------------
   Current starter behavior:
   - closes the review panel
   - clears Brain Dump if config says to do that

   Later, this is where save-to-category behavior can hook in.
   ========================================================= */

function handleReviewConfirm() {
  const shouldClearBrainDump = window.getConfig && window.getConfig("clearBrainDumpAfterConfirm"); /* Reads whether Brain Dump should clear after confirm */

  if (shouldClearBrainDump) {
    clearBrainDumpInput(); /* Clears the Brain Dump text box after a successful confirmation */
  }

  closeReviewPanel(); /* Hides the review panel after confirm */
}


/* =========================================================
   DEFAULT EDIT ACTION
   ---------------------------------------------------------
   Current starter behavior:
   - keeps panel open
   - leaves Brain Dump text untouched
   - logs a message for development

   Later, this can open an editable review form.
   ========================================================= */

function handleReviewEdit() {
  console.log("Edit clicked."); /* Temporary development note so you can see the click is working */
}


/* =========================================================
   DEFAULT CANCEL ACTION
   ---------------------------------------------------------
   Current starter behavior:
   - closes the panel
   - does NOT clear Brain Dump text

   This lets you keep your typed text if you cancel.
   ========================================================= */

function handleReviewCancel() {
  closeReviewPanel(); /* Hides the review panel without deleting Brain Dump text */
}


/* =========================================================
   CLEAR BRAIN DUMP INPUT
   ---------------------------------------------------------
   Clears the multi-line Brain Dump text area after confirm,
   if that behavior is enabled in config.js.
   ========================================================= */

function clearBrainDumpInput() {
  const brainDumpInput = document.getElementById("brain-dump-input"); /* Finds the Brain Dump textarea */

  if (!brainDumpInput) {
    return; /* Stops safely if the Brain Dump input is not found */
  }

  brainDumpInput.value = ""; /* Removes the current typed Brain Dump text */
}
