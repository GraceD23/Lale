/* =========================================================
   NOTES.JS
   ---------------------------------------------------------
   Notes page controller + homepage preview renderer.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("notes-list-container")) {
    initializeNotesPage();
    initFullPageNoteSave(); /* Wire the full notes page entry box */
  }
  if (document.getElementById("recent-notes-list")) {
    renderRecentNotes();
    initQuickNoteSave();
  }
});

function initFullPageNoteSave() {
  const btn = document.getElementById("new-note-save");
  const input = document.getElementById("new-note-input");
  if (!btn || !input) return;
  btn.addEventListener("click", function () {
    const text = input.value.trim();
    if (!text) return;
    const notes = typeof loadNotes === "function" ? loadNotes() : {};
    const now = new Date();
    const key = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0");
    if (!notes[key]) notes[key] = [];
    notes[key].unshift({ id: Date.now().toString(), text: text, date: now.toISOString() });
    if (typeof saveNotes === "function") saveNotes(notes);
    input.value = "";
    initializeNotesPage(); /* Refresh the list */
  });
}

function initQuickNoteSave() {
  const btn = document.getElementById("quick-note-save");
  const input = document.getElementById("quick-note-input");
  if (!btn || !input) return;
  btn.addEventListener("click", function () {
    const text = input.value.trim();
    if (!text) return;
    if (typeof saveNote === "function") {
      saveNote(text);
    } else {
      /* Fallback: save directly to storage */
      const notes = typeof loadNotes === "function" ? loadNotes() : {};
      const now = new Date();
      const key = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0");
      if (!notes[key]) notes[key] = [];
      notes[key].unshift({ id: Date.now().toString(), text: text, date: now.toISOString() });
      if (typeof saveNotes === "function") saveNotes(notes);
    }
    input.value = "";
    renderRecentNotes();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") btn.click();
  });
}

/* =========================================================
   NOTES PAGE
   ========================================================= */

let currentNotesMonth = null;

function initializeNotesPage() {
  const notes = loadNotes();
  const months = Object.keys(notes).sort().reverse();

  if (months.length === 0) {
    renderEmptyNotes();
    return;
  }

  currentNotesMonth = months[0];
  buildMonthDropdown(months, notes);
  renderNotesList(currentNotesMonth);
}

function buildMonthDropdown(months, notes) {
  const label = document.getElementById("notes-month-label");
  const dropdown = document.getElementById("notes-month-dropdown");
  if (!label || !dropdown) return;

  label.textContent = "Month: " + formatNotesMonth(currentNotesMonth);
  dropdown.innerHTML = "";

  months.forEach(function (month) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary-action-button";
    btn.style.cssText = "display:block;width:100%;text-align:left;margin-bottom:4px;";
    btn.textContent = formatNotesMonth(month);
    btn.addEventListener("click", function () {
      currentNotesMonth = month;
      label.textContent = "Month: " + formatNotesMonth(month);
      renderNotesList(month);
    });
    dropdown.appendChild(btn);
  });
}

function renderNotesList(monthKey) {
  const container = document.getElementById("notes-list-container");
  if (!container) return;

  const notes = loadNotes();
  const entries = (notes[monthKey] || []).slice().reverse(); /* Newest first */

  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = "<p style='opacity:0.5;font-size:13px;'>No notes for this month.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.style.cssText = "list-style:disc;padding-left:18px;margin:0;";

  entries.forEach(function (entry) {
    const item = document.createElement("li");
    item.style.cssText = "margin-bottom:8px;font-size:14px;";

    const dateStr = document.createElement("span");
    dateStr.style.cssText = "font-size:11px;opacity:0.5;display:block;margin-bottom:2px;";
    dateStr.textContent = formatNoteDate(entry.date);

    const text = document.createElement("span");
    text.textContent = entry.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.style.cssText = "margin-left:8px;font-size:11px;opacity:0.5;background:none;border:none;cursor:pointer;color:inherit;";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", function () {
      deleteNote(monthKey, entry.date);
    });

    item.appendChild(dateStr);
    item.appendChild(text);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });

  container.appendChild(list);
}

function deleteNote(monthKey, date) {
  const notes = loadNotes();
  if (!notes[monthKey]) return;
  notes[monthKey] = notes[monthKey].filter(n => n.date !== date);
  saveNotes(notes);
  renderNotesList(monthKey);
  renderRecentNotes();
}

function renderEmptyNotes() {
  const container = document.getElementById("notes-list-container");
  if (container) container.innerHTML = "<p style='opacity:0.5;font-size:13px;'>No notes yet. Add one from Brain Dump or the Add Page.</p>";
}

/* =========================================================
   HOMEPAGE RECENT NOTES (up to 5)
   ========================================================= */

function renderRecentNotes() {
  const container = document.getElementById("recent-notes-list");
  if (!container) return;

  const notes = loadNotes();
  const allEntries = [];

  Object.values(notes).forEach(function (monthEntries) {
    if (Array.isArray(monthEntries)) {
      monthEntries.forEach(e => allEntries.push(e));
    }
  });

  allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = allEntries.slice(0, 5);

  container.innerHTML = "";

  if (recent.length === 0) {
    container.innerHTML = "<p style='opacity:0.5;font-size:13px;'>No notes yet.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.style.cssText = "list-style:disc;padding-left:16px;margin:0;";

  recent.forEach(function (entry) {
    const item = document.createElement("li");
    item.style.cssText = "font-size:13px;margin-bottom:5px;";
    item.textContent = entry.text;
    list.appendChild(item);
  });

  container.appendChild(list);
}

/* =========================================================
   FORMATTERS
   ========================================================= */

function formatNotesMonth(key) {
  const [y, m] = String(key).split("-").map(Number);
  return new Date(y, m-1, 1).toLocaleString("default", { month:"long", year:"numeric" });
}

function formatNoteDate(dateStr) {
  return new Date(dateStr).toLocaleString("default", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
}
