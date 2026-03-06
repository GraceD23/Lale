
/* =========================================================
   BRAIN-DUMP.JS
   ---------------------------------------------------------
   This file controls the Brain Dump submission flow.

   Current starter responsibilities:
   - read the text typed into the Brain Dump box
   - make sure something was actually typed
   - open the slide-up review panel when Submit is pressed
   - show starter review content for now

   FUTURE responsibilities:
   - send Brain Dump text to AI
   - parse tasks / health logs / new categories
   - ask relevant follow-up questions only when needed
   - route confirmed items to the correct page/category

   IMPORTANT:
   This file handles the Brain Dump flow only.
   The review panel open/close behavior itself lives in:
   - review-panel.js
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits until the HTML page is fully loaded before trying
   to attach Brain Dump behavior to the page elements.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeBrainDump(); /* Starts Brain Dump setup after page HTML is ready */
});


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Finds the Brain Dump elements and connects the Submit button.
   ========================================================= */

function initializeBrainDump() {
  const submitButton = document.getElementById("brain-dump-submit-button"); /* Finds the Submit button inside the Brain Dump card */

  if (!submitButton) {
    return; /* Stops safely if the Submit button does not exist */
  }

  submitButton.addEventListener("click", function () {
    handleBrainDumpSubmit(); /* Runs the Brain Dump submit flow when the button is tapped */
  });
}

/* =========================================================
   HANDLE BRAIN DUMP SUBMIT
   ========================================================= */

function handleBrainDumpSubmit() {

  const input = document.getElementById("brain-dump-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const parsed = parseBrainDump(text); /* uses brain-parser.js */

  openBrainReview(parsed, text);

}

 function openBrainReview(parsed, originalText) {

 const panel = document.getElementById("review-panel");
 const content = document.getElementById("review-panel-content");
 const overlay = document.getElementById("global-overlay");

   if (!panel || !content) return;

  let html = "";

   if (parsed.type === "task") {
     html += "<p><strong>Detected Task</strong></p>";
    html += "<p>" + parsed.data.name + "</p>";
   }

   else if (parsed.type === "streak") {
     html += "<p><strong>Detected Streak Action</strong></p>";
    html += "<p>" + parsed.data.name + "</p>";
 }

  else if (parsed.type === "health") {
  html += "<p><strong>Detected Health Entry</strong></p>";
html += "<p>Severity: " + (parsed.data.severity || "unknown") + "</p>";
   html += "<p>Note: " + originalText + "</p>";
  }

  else {
   html += "<p><strong>Saved as Note</strong></p>";
   html += "<p>" + originalText + "</p>";
  }
   window.currentBrainDumpReview = { parsed: parsed, originalText: originalText }; /* Stores the current review data for Confirm */
  content.innerHTML = html;

  panel.removeAttribute("hidden");
  if (overlay) overlay.removeAttribute("hidden");

 }

/* =========================================================
   SHOW EMPTY MESSAGE
   ---------------------------------------------------------
   If Submit is pressed with no text typed, this opens the
   review panel and shows a simple helpful message instead
   of trying to process empty input.
   ========================================================= */

function showEmptyBrainDumpMessage() {
  const emptyMessageHtml = `
    <p><strong>Nothing to review yet.</strong></p>
    <p>Please type something into the Brain Dump box before pressing Submit.</p>
  `; /* Simple starter message shown when the textarea is empty */

  setReviewPanelContent(emptyMessageHtml, true); /* Inserts the empty-state message into the review panel */
  openReviewPanel(); /* Opens the review panel so the user sees the message */
}


/* =========================================================
   BUILD STARTER REVIEW HTML
   ---------------------------------------------------------
   This creates temporary starter review content using the
   user's typed Brain Dump text.

   For now, it does NOT do real AI classification.
   It simply shows:
   - the text they typed
   - a placeholder "detected" type
   - a placeholder "suggested destination"

   Later, this function will be replaced by AI results.
   ========================================================= */

function buildStarterReviewHtml(userText) {
  const escapedUserText = escapeHtml(userText); /* Safely escapes typed text so it displays as text instead of raw HTML */

  return `
    <p><strong>Review your Brain Dump:</strong></p>

    <p><strong>Typed text:</strong><br>${escapedUserText}</p>

    <p><strong>Starter detected type:</strong><br>Needs AI review</p>

    <p><strong>Starter suggested location:</strong><br>Pending review</p>

    <p>This is temporary starter behavior. Later, AI will interpret whether this should become a task, health entry, streak item, or new category.</p>
  `; /* Returns formatted review HTML for the starter version of the Brain Dump flow */
}


/* =========================================================
   ESCAPE HTML
   ---------------------------------------------------------
   Converts special characters into safe display characters.

   This prevents typed text like:
   <script>
   from being treated as real HTML in the review panel.
   ========================================================= */

function escapeHtml(text) {
  const temporaryElement = document.createElement("div"); /* Creates a temporary safe element for encoding */
  temporaryElement.textContent = text; /* Stores the user text as plain text */
  return temporaryElement.innerHTML; /* Returns the safely escaped HTML version of the text */
}
