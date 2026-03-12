/* =========================================================
   BRAIN-DUMP.JS
   ---------------------------------------------------------
   Controls Brain Dump submission and multi-item review panel.

   Features:
   - Sends text to AI parser (brain-parser.js)
   - Shows ALL detected items in one review panel
   - Each task lets you choose Daily Focus or Weekly Tasks
   - Single Confirm button saves everything at once
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeBrainDump();
});

function initializeBrainDump() {
  const submitButton = document.getElementById("brain-dump-submit-button");
  if (!submitButton) return;
  submitButton.addEventListener("click", handleBrainDumpSubmit);
}

async function handleBrainDumpSubmit() {
  const input = document.getElementById("brain-dump-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  /* Show loading state on button */
  const submitButton = document.getElementById("brain-dump-submit-button");
  const originalLabel = submitButton ? submitButton.textContent : "Submit";
  if (submitButton) { submitButton.textContent = "Thinking..."; submitButton.disabled = true; }

  try {
    /* Pre-check: if every line is clearly an etsy command, skip the AI entirely */
    const chunks = text.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean);
    const etsyVerbs = /^(sold?|painted?|made?|add(ed)?|bought?)\b/i;
    const allEtsy = chunks.length > 0 && chunks.every(function(c){ return etsyVerbs.test(c); });
    const parsedItems = allEtsy
      ? chunks.map(function(c){ return { type:"etsy", name:c, destination:null, data:{} }; })
      : await parseBrainDump(text); /* From brain-parser.js */
    openBrainDumpReviewPanel(parsedItems, text);
  } catch (err) {
    console.error("Brain dump error:", err);
    openBrainDumpReviewPanel([{ type:"note", name:text, destination:null, data:{} }], text);
  } finally {
    if (submitButton) { submitButton.textContent = originalLabel; submitButton.disabled = false; }
  }
}

/* =========================================================
   BUILD + OPEN REVIEW PANEL
   Shows all detected items with destination selectors for tasks
   ========================================================= */

function openBrainDumpReviewPanel(parsedItems, originalText) {
  const panel = document.getElementById("review-panel");
  const content = document.getElementById("review-panel-content");
  const overlay = document.getElementById("global-overlay");

  if (!panel || !content) return;

  /* Store for confirm step */
  window.currentBrainDumpReview = { items: parsedItems, originalText: originalText };

  content.innerHTML = "";

  if (parsedItems.length === 0) {
    content.innerHTML = "<p>Nothing recognized. Will save as a note.</p>";
    window.currentBrainDumpReview = {
      items: [{ type:"note", name:originalText, destination:null, data:{} }],
      originalText: originalText
    };
  } else {
    /* Header */
    const header = document.createElement("p");
    header.innerHTML = "<strong>Detected " + parsedItems.length + " item" + (parsedItems.length > 1 ? "s" : "") + ":</strong>";
    content.appendChild(header);

    /* One row per item */
    parsedItems.forEach(function (item, index) {
      const row = document.createElement("div");
      row.className = "review-item-row";
      row.style.cssText = "margin-bottom:10px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.5);";

      /* Type badge */
      const badge = document.createElement("span");
      badge.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:0.05em;opacity:0.6;display:block;margin-bottom:4px;";
      badge.textContent = item.type;
      row.appendChild(badge);

      /* Item name */
      const name = document.createElement("p");
      name.style.cssText = "margin:0 0 6px 0;font-size:14px;";
      name.textContent = item.name;
      row.appendChild(name);

      /* Destination selector — only for tasks */
      if (item.type === "task") {
        const destRow = document.createElement("div");
        destRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;";

        const options = [
          { value: "daily", label: "Daily Focus" },
          { value: "weekly", label: "Weekly Tasks" }
        ];

        options.forEach(function (opt) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = opt.label;
          btn.dataset.dest = opt.value;
          btn.dataset.itemIndex = index;

          const isSelected = item.destination === opt.value ||
            (item.destination === null && opt.value === "weekly");

          btn.style.cssText = "padding:4px 10px;border-radius:20px;border:1px solid #b0977a;font-size:12px;cursor:pointer;background:" +
            (isSelected ? "#b0977a" : "white") + ";color:" + (isSelected ? "white" : "#b0977a") + ";";

          btn.addEventListener("click", function () {
            /* Update destination in stored review */
            window.currentBrainDumpReview.items[index].destination = opt.value;

            /* Update button styles in this row */
            destRow.querySelectorAll("button").forEach(function (b) {
              const sel = b.dataset.dest === opt.value;
              b.style.background = sel ? "#b0977a" : "white";
              b.style.color = sel ? "white" : "#b0977a";
            });
          });

          /* Set default destination */
          if (item.destination === null) {
            window.currentBrainDumpReview.items[index].destination = "weekly";
          }

          destRow.appendChild(btn);
        });

        row.appendChild(destRow);
      }

      content.appendChild(row);
    });
  }

  /* Wire confirm button to brain-confirm.js handler */
  const confirmBtn = document.getElementById("review-confirm-button");
  if (confirmBtn) {
    confirmBtn.onclick = async function () { await handleBrainDumpConfirm(); };
  }

  /* Wire cancel button */
  const cancelBtn = document.getElementById("review-cancel-button");
  if (cancelBtn) {
    cancelBtn.onclick = function () {
      panel.setAttribute("hidden", "");
      if (overlay) overlay.setAttribute("hidden", "");
    };
  }

  panel.removeAttribute("hidden");
  if (overlay) overlay.removeAttribute("hidden");
}
