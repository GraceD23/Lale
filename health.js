
/* =========================================================
   HEALTH.JS
   ---------------------------------------------------------
   Controls starter behavior for the Health page.

   Current starter features:
   - open/close health detail panel
   - allow tapping a day box to show placeholder details
   - structured so future health entries (headaches, etc.)
     can be injected without rewriting this file

   Future features planned:
   - store health entries
   - severity + location + notes
   - month navigation
   - weight logging
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   Runs when the page finishes loading.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  initializeHealthPage();

});


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeHealthPage(){

  attachDayBoxHandlers();   /* enables tapping weekly boxes */
  attachDetailCloseButton(); /* enables closing the detail panel */

}


/* =========================================================
   DAY BOX TAP HANDLING
   When a weekly symptom box is tapped,
   the detail panel slides up with information.
   ========================================================= */

function attachDayBoxHandlers(){

  const dayBoxes = document.querySelectorAll(".health-day-box");

  dayBoxes.forEach(function(box){

    box.addEventListener("click", function(){

      const text = box.textContent.trim();

      openHealthDetailPanel(text);

    });

  });

}


/* =========================================================
   OPEN DETAIL PANEL
   Shows the slide-up detail panel.
   ========================================================= */

function openHealthDetailPanel(contentText){

  const panel = document.getElementById("health-detail-panel");
  const content = document.getElementById("health-detail-content");

  if(!panel || !content){
    return;
  }

  content.innerHTML = buildDetailHTML(contentText);

  panel.removeAttribute("hidden");

}


/* =========================================================
   BUILD DETAIL HTML
   Creates the visible content inside the detail panel.
   ========================================================= */

function buildDetailHTML(text){

  return `
    <p><strong>Entry:</strong> ${escapeHTML(text)}</p>
    <p>This area will later show:</p>
    <ul>
      <li>Severity (1–5)</li>
      <li>Location</li>
      <li>Notes</li>
    </ul>
  `;

}


/* =========================================================
   CLOSE BUTTON
   Handles closing the health detail panel.
   ========================================================= */

function attachDetailCloseButton(){

  const closeButton = document.getElementById("health-detail-close-button");

  if(!closeButton){
    return;
  }

  closeButton.addEventListener("click", function(){

    closeHealthDetailPanel();

  });

}


/* =========================================================
   CLOSE DETAIL PANEL
   ========================================================= */

function closeHealthDetailPanel(){

  const panel = document.getElementById("health-detail-panel");

  if(panel){
    panel.setAttribute("hidden","");
  }

}


/* =========================================================
   HTML ESCAPE
   Prevents injected text from breaking HTML.
   ========================================================= */

function escapeHTML(value){

  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;

}
