/* =========================================================
   ADD-SYSTEM.JS
   ---------------------------------------------------------
   Full Add Page controller with AI-powered command parsing.

   Features:
   - Natural language command input
   - AI parses intent and asks only relevant follow-up questions
   - Create/edit/delete task boxes (like Daily Focus)
   - Create/edit/delete health trackers
   - Create/edit/delete pages
   - All new boxes connect to Brain Dump automatically
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeAddSystem();
});

/* =========================================================
   INITIALIZER
   ========================================================= */

function initializeAddSystem() {
  renderExistingItems();
  attachAddCommandHandler();
}

/* =========================================================
   COMMAND HANDLER
   ========================================================= */

function attachAddCommandHandler() {
  const submitBtn = document.getElementById("add-command-submit-button");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", handleAddCommand);
}

async function handleAddCommand() {
  const input = document.getElementById("add-command-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const submitBtn = document.getElementById("add-command-submit-button");
  if (submitBtn) { submitBtn.textContent = "Thinking..."; submitBtn.disabled = true; }

  try {
    const parsed = await parseAddCommand(text);
    showAddReviewPanel(parsed, text);
  } catch (err) {
    console.error("Add command error:", err);
    showAddReviewPanel({ action: "unknown", raw: text }, text);
  } finally {
    if (submitBtn) { submitBtn.textContent = "Submit"; submitBtn.disabled = false; }
  }
}

/* =========================================================
   AI COMMAND PARSER
   ========================================================= */

async function parseAddCommand(text) {
  try {
    return await parseAddCommandWithAI(text);
  } catch (e) {
    console.warn("AI parse failed, using rules:", e.message);
    return parseAddCommandWithRules(text);
  }
}

async function parseAddCommandWithAI(text) {
  const WORKER_URL = "https://holy-wind-9442.doeppg.workers.dev";
  const systemPrompt = `You parse natural language commands for a productivity dashboard's Add Page.

Understand what the user wants to do — they may phrase it many ways.

Return ONLY valid JSON — no explanation, no markdown.

SUPPORTED ACTIONS:
- create_task_box: create a new checklist/task box. Needs: name
- create_health_tracker: add a new tracker to the Health Page. Needs: name, type (calendar|scale|weight|yesno). Use "calendar" by default unless the user specifies a number scale or yes/no.
- create_page: create an entirely new standalone page. Needs: name
- create_task: add a single task. Needs: name, destination (daily|weekly)
- create_note: add a note. Needs: text
- create_streak: add a new streak tracker to the Streaks page. Needs: name
- delete_item: delete something. Needs: itemType, name
- edit_item: rename something. Needs: itemType, oldName, newName
- unknown: cannot determine intent

KEY DISTINCTIONS:
- If the user mentions "streak", "habit", "daily habit", "track habit" → use "create_streak"
- If the user says anything about the Health Page, health tracking, symptoms, or adding a tracker → use "create_health_tracker"
- Only use "create_page" if the user clearly wants a brand new standalone page unrelated to health or streaks
- If the user says "add task" or "remind me to" → use "create_task"

Return format examples:
{"action":"create_streak","name":"Reading","confirmed":false}
{"action":"create_streak","name":"Morning Run","confirmed":false}
{"action":"create_health_tracker","name":"Burn Out","type":"calendar","confirmed":false}
{"action":"create_page","name":"Projects","confirmed":false}
{"action":"create_task","name":"Wash car","destination":"weekly","confirmed":false}`;

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: text }]
    })
  });

  if (!response.ok) throw new Error("Worker " + response.status);
  const d = await response.json();
  if (d.error) throw new Error("API error: " + JSON.stringify(d.error));
  const clean = d.content[0].text.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function parseAddCommandWithRules(text) {
  const lower = text.toLowerCase();

  if (lower.includes("create") || lower.includes("add") || lower.includes("new")) {
    /* Health tracker check FIRST — catches "add tracker on Health Page" before generic "page" check */
    if (lower.includes("health") || lower.includes("tracker") || lower.includes("symptom")) {
      const name = extractNameFromCommand(text, ["create","add","new","health","tracker","symptom","on","the","page","name","it","called"]);
      return { action:"create_health_tracker", name:name, type:"calendar", confirmed:false };
    }
    if (lower.includes("page")) {
      const name = extractNameFromCommand(text, ["create","add","new","page"]);
      return { action:"create_page", name:name, confirmed:false };
    }
    if (lower.includes("box") || lower.includes("list") || lower.includes("checklist")) {
      const name = extractNameFromCommand(text, ["create","add","new","box","list","checklist"]);
      return { action:"create_task_box", name:name, confirmed:false };
    }
    if (lower.includes("streak") || lower.includes("habit")) {
      const name = extractNameFromCommand(text, ["create","add","new","streak","habit","called","named","a","an"]);
      return { action:"create_streak", name:name, confirmed:false };
    }
    if (lower.includes("note")) {
      const name = extractNameFromCommand(text, ["create","add","new","note"]);
      return { action:"create_note", text:name, confirmed:false };
    }
  }

  if (lower.includes("delete") || lower.includes("remove")) {
    const name = extractNameFromCommand(text, ["delete","remove"]);
    return { action:"delete_item", name:name, itemType:"unknown", confirmed:false };
  }

  if (lower.includes("rename") || lower.includes("edit") || lower.includes("change")) {
    return { action:"edit_item", confirmed:false, raw:text };
  }

  /* Default: treat as task */
  return { action:"create_task", name:text, destination:"weekly", confirmed:false };
}

function extractNameFromCommand(text, wordsToRemove) {
  let result = text;
  wordsToRemove.forEach(w => { result = result.replace(new RegExp("\\b" + w + "\\b", "gi"), ""); });
  return result.replace(/\s+/g, " ").trim() || text.trim();
}

/* =========================================================
   REVIEW PANEL
   ========================================================= */

function showAddReviewPanel(parsed, originalText) {
  const panel = document.getElementById("add-review-panel");
  const content = document.getElementById("add-review-content");
  const overlay = document.getElementById("global-overlay");

  if (!panel || !content) return;

  window.currentAddReview = { parsed, originalText };
  content.innerHTML = "";

  const descEl = document.createElement("div");
  descEl.innerHTML = buildAddReviewHTML(parsed, originalText);
  content.appendChild(descEl);

  /* Confirm */
  const confirmBtn = document.getElementById("add-review-confirm-button");
  if (confirmBtn) confirmBtn.onclick = function () { handleAddConfirm(); };

  /* Cancel */
  const cancelBtn = document.getElementById("add-review-cancel-button");
  if (cancelBtn) cancelBtn.onclick = function () {
    panel.setAttribute("hidden","");
    if (overlay) overlay.setAttribute("hidden","");
  };

  panel.removeAttribute("hidden");
  if (overlay) overlay.removeAttribute("hidden");
}

function buildAddReviewHTML(parsed, originalText) {
  const action = parsed.action || "unknown";

  if (action === "create_streak") {
    summary = "New streak: <strong>" + escH(parsed.name || "?") + "</strong>";
  }
  if (action === "create_task_box") {
    return `<p><strong>Create new task box:</strong></p>
<p>"${escSafe(parsed.name || originalText)}"</p>
<p>This will appear on the Home Page and connect to Brain Dump.</p>`;
  }
  if (action === "create_health_tracker") {
    return `<p><strong>Create new health tracker:</strong></p>
<p>"${escSafe(parsed.name || originalText)}"</p>
<p>Type: ${escSafe(parsed.type || "calendar")} — will appear on the Health Page.</p>`;
  }
  if (action === "create_page") {
    return `<p><strong>Create new page:</strong></p>
<p>"${escSafe(parsed.name || originalText)}"</p>
<p>A new page will be added to your navigation menu.</p>`;
  }
  if (action === "create_task") {
    return `<p><strong>Add task:</strong></p>
<p>"${escSafe(parsed.name || originalText)}"</p>
<p><strong>Destination:</strong></p>
<div style="display:flex;gap:8px;margin-top:4px;">
  <button type="button" onclick="setAddDestination('daily',this)" style="padding:6px 12px;border-radius:8px;border:1.5px solid #b0977a;background:${(parsed.destination==='daily')?'#b0977a':'white'};color:${(parsed.destination==='daily')?'white':'#3a2e28'};font-size:13px;cursor:pointer;">Daily Focus</button>
  <button type="button" onclick="setAddDestination('weekly',this)" style="padding:6px 12px;border-radius:8px;border:1.5px solid #b0977a;background:${(parsed.destination!=='daily')?'#b0977a':'white'};color:${(parsed.destination!=='daily')?'white':'#3a2e28'};font-size:13px;cursor:pointer;">Weekly Tasks</button>
</div>`;
  }
  if (action === "create_note") {
    return `<p><strong>Save note:</strong></p><p>"${escSafe(parsed.text || originalText)}"</p>`;
  }
  if (action === "delete_item") {
    return `<p><strong>Delete:</strong></p><p>"${escSafe(parsed.name || originalText)}"</p>`;
  }
  if (action === "edit_item") {
    return `<p><strong>Edit/Rename item</strong></p><p>${escSafe(originalText)}</p>`;
  }

  return `<p>Could not recognize command.</p><p>${escSafe(originalText)}</p>
<p>Try: "create task box To Buy" or "create health tracker Burn Out"</p>`;
}

/* =========================================================
   CONFIRM HANDLER
   ========================================================= */

function setAddDestination(dest, btn) {
  if (window.currentAddReview && window.currentAddReview.parsed) {
    window.currentAddReview.parsed.destination = dest;
  }
  /* Update button styles */
  const parent = btn.parentElement;
  parent.querySelectorAll("button").forEach(function(b) {
    b.style.background = "white";
    b.style.color = "#3a2e28";
  });
  btn.style.background = "#b0977a";
  btn.style.color = "white";
}

function handleAddConfirm() {
  const review = window.currentAddReview;
  if (!review) return;

  const parsed = review.parsed;
  const action = parsed.action;

  if (action === "create_task_box")       createCustomTaskBox(parsed);
  else if (action === "create_streak")    createStreakFromAddPage(parsed);
  else if (action === "create_health_tracker") createHealthTracker(parsed);
  else if (action === "create_page")      createCustomPage(parsed);
  else if (action === "create_task")      createTaskFromAddPage(parsed);
  else if (action === "create_note")      createNoteFromAddPage(parsed, review.originalText);
  else if (action === "delete_item")      deleteItemByName(parsed);

  /* Clear input + close panel */
  const input = document.getElementById("add-command-input");
  if (input) input.value = "";

  const panel = document.getElementById("add-review-panel");
  const overlay = document.getElementById("global-overlay");
  if (panel) panel.setAttribute("hidden","");
  if (overlay) overlay.setAttribute("hidden","");

  window.currentAddReview = null;
  renderExistingItems(); /* Refresh the displayed list */
}

/* =========================================================
   CREATE ACTIONS
   ========================================================= */

function createStreakFromAddPage(parsed) {
  const name = (parsed.name || "").trim();
  if (!name) { alert("No streak name found."); return; }

  const existing = typeof loadStreaks === "function" ? loadStreaks() : [];
  if (existing.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    alert("A streak called \"" + name + "\" already exists.");
    return;
  }

  /* Build a simple ID from the name */
  const id = "streak-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g,"-");

  const newStreak = {
    id: id,
    name: name,
    count: 0,
    weeklyCount: 0,
    history: []
  };

  existing.push(newStreak);
  if (typeof saveStreaks === "function") saveStreaks(existing);
  alert("✅ \"" + name + "\" streak created! It will appear on the Streaks page.");
}

function createCustomTaskBox(parsed) {
  const boxes = loadCustomBoxes();
  const name = (parsed.name || "").trim();
  if (!name) return;

  if (boxes.find(b => b.name.toLowerCase() === name.toLowerCase())) {
    alert("A box called \"" + name + "\" already exists.");
    return;
  }

  boxes.push({
    id: makeAddId(name),
    name: name,
    createdAt: new Date().toISOString()
  });

  saveCustomBoxes(boxes);
  alert("✅ \"" + name + "\" task box created! It will appear on the Home Page.");
}

function createHealthTracker(parsed) {
  const trackers = loadHealthTrackers();
  const name = (parsed.name || "").trim();
  if (!name) return;

  if (trackers.find(t => t.name.toLowerCase() === name.toLowerCase())) {
    alert("A tracker called \"" + name + "\" already exists.");
    return;
  }

  trackers.push({
    id: makeAddId(name),
    name: name,
    type: parsed.type || "calendar",
    color: "#b0977a",
    icon: "◉",
    createdAt: new Date().toISOString()
  });

  saveHealthTrackers(trackers);
  alert("✅ \"" + name + "\" health tracker created! It will appear on the Health Page.");
}

function createCustomPage(parsed) {
  const pages = loadCustomPages();
  const name = (parsed.name || "").trim();
  if (!name) return;

  if (pages.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert("A page called \"" + name + "\" already exists.");
    return;
  }

  pages.push({
    id: makeAddId(name),
    name: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),
    createdAt: new Date().toISOString()
  });

  saveCustomPages(pages);
  alert("✅ \"" + name + "\" page created! It will appear in your navigation menu.");
}

function createTaskFromAddPage(parsed) {
  const tasks = loadTasks();
  const name = (parsed.name || "").trim();
  if (!name) return;

  tasks.push({
    id: makeAddId(name),
    name: name,
    schedule: parsed.destination === "daily" ? "daily" : "weekly",
    day: parsed.destination === "daily" ? new Date().toLocaleString("default",{weekday:"short"}) : null,
    completed: false,
    streak: false,
    createdAt: new Date().toISOString()
  });

  saveTasks(tasks);
  if (typeof renderDailyTasks === "function") renderDailyTasks();
  if (typeof renderWeeklyTasks === "function") renderWeeklyTasks();
}

function createNoteFromAddPage(parsed, originalText) {
  const notes = loadNotes();
  const monthKey = getAddMonthKey();
  if (!notes[monthKey]) notes[monthKey] = [];
  notes[monthKey].push({ text: parsed.text || originalText, date: new Date().toISOString() });
  saveNotes(notes);
  if (typeof renderRecentNotes === "function") renderRecentNotes();
}

function deleteItemByName(parsed) {
  const name = (parsed.name || "").trim().toLowerCase();
  if (!name) return;

  /* Try boxes */
  const boxes = loadCustomBoxes();
  const newBoxes = boxes.filter(b => b.name.toLowerCase() !== name);
  if (newBoxes.length !== boxes.length) { saveCustomBoxes(newBoxes); alert("Deleted."); return; }

  /* Try health trackers */
  const trackers = loadHealthTrackers();
  const newTrackers = trackers.filter(t => t.name.toLowerCase() !== name);
  if (newTrackers.length !== trackers.length) { saveHealthTrackers(newTrackers); alert("Deleted."); return; }

  /* Try pages */
  const pages = loadCustomPages();
  const newPages = pages.filter(p => p.name.toLowerCase() !== name);
  if (newPages.length !== pages.length) { saveCustomPages(newPages); alert("Deleted."); return; }

  alert("Could not find \"" + parsed.name + "\" to delete.");
}

/* =========================================================
   RENDER EXISTING ITEMS
   Shows current custom boxes, trackers, pages so user can see what exists
   ========================================================= */

function renderExistingItems() {
  const container = document.getElementById("existing-items-container");
  if (!container) return;

  container.innerHTML = "";

  /* Custom task boxes */
  const boxes = loadCustomBoxes();
  if (boxes.length > 0) {
    const h = document.createElement("h3");
    h.className = "card-title";
    h.textContent = "Custom Task Boxes";
    container.appendChild(h);
    boxes.forEach(box => container.appendChild(buildItemRow(box, "box")));
  }

  /* Health trackers (custom only — not defaults) */
  const trackers = loadHealthTrackers().filter(t => t.createdAt); /* Custom ones have createdAt */
  if (trackers.length > 0) {
    const h = document.createElement("h3");
    h.className = "card-title";
    h.style.marginTop = "12px";
    h.textContent = "Custom Health Trackers";
    container.appendChild(h);
    trackers.forEach(tracker => container.appendChild(buildItemRow(tracker, "tracker")));
  }

  /* Custom pages */
  const pages = loadCustomPages();
  if (pages.length > 0) {
    const h = document.createElement("h3");
    h.className = "card-title";
    h.style.marginTop = "12px";
    h.textContent = "Custom Pages";
    container.appendChild(h);
    pages.forEach(page => container.appendChild(buildItemRow(page, "page")));
  }

  if (boxes.length === 0 && trackers.length === 0 && pages.length === 0) {
    container.innerHTML = "<p style='opacity:0.6;font-size:13px;'>Nothing custom created yet. Use the command box above!</p>";
  }
}

function buildItemRow(item, type) {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.08);";

  const name = document.createElement("span");
  name.style.fontSize = "14px";
  name.textContent = item.name;
  row.appendChild(name);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "secondary-action-button";
  deleteBtn.textContent = "Delete";
  deleteBtn.style.fontSize = "12px";
  deleteBtn.style.padding = "3px 8px";
  deleteBtn.addEventListener("click", function () {
    if (confirm("Delete \"" + item.name + "\"?")) {
      deleteItemByName({ name: item.name });
      renderExistingItems();
    }
  });

  row.appendChild(deleteBtn);
  return row;
}

/* =========================================================
   HELPERS
   ========================================================= */

function makeAddId(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") + "-" + Date.now();
}

function getAddMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

function escSafe(text) {
  const d = document.createElement("div");
  d.textContent = String(text || "");
  return d.innerHTML;
}
