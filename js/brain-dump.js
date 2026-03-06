
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
   HANDLE SUBMIT
   ---------------------------------------------------------
   This runs when the user presses the Submit button.

   Current starter behavior:
   - gets the typed Brain Dump text
   - checks whether it is empty
   - opens the review panel
   - shows starter "detected" content

   Later this function will send the text to AI instead.
   ========================================================= */

function handleBrainDumpSubmit() {
  const brainDumpInput = document.getElementById("brain-dump-input"); /* Finds the Brain Dump textarea */

  if (!brainDumpInput) {
    return; /* Stops safely if the textarea does not exist */
  }

  const rawText = brainDumpInput.value; /* Reads the exact current typed Brain Dump text */
  const cleanedText = rawText.trim(); /* Removes extra empty spaces from the start/end */

  if (cleanedText === "") {
    showEmptyBrainDumpMessage(); /* Shows a helpful message if the user pressed Submit with nothing typed */
    return; /* Stops the submit flow so an empty note is not processed */
  }

  const reviewHtml = buildStarterReviewHtml(cleanedText); /* Creates temporary review content using the typed text */
  setReviewPanelContent(reviewHtml, true); /* Sends the starter review content into the slide-up review panel */
  openReviewPanel(); /* Makes the review panel visible */
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
