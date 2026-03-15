/* =========================================================
   STORAGE.JS
   ---------------------------------------------------------
   Central storage system for the entire site.
   Handles: tasks, streaks, health, history, notes,
            custom pages, custom task boxes, health trackers
   ========================================================= */

const STORAGE_KEYS = {
  TASKS:          "prod_tasks",
  STREAKS:        "prod_streaks",
  HEALTH:         "prod_health",
  HISTORY:        "prod_history",
  NOTES:          "prod_notes",
  CUSTOM_PAGES:   "prod_custom_pages",
  CUSTOM_BOXES:   "prod_custom_boxes",
  HEALTH_TRACKERS:"prod_health_trackers"
};

function loadFromStorage(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { console.warn("Parse error:", key); return null; }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* Tasks */
function loadTasks()        { return loadFromStorage(STORAGE_KEYS.TASKS)   || []; }
function saveTasks(v)       { saveToStorage(STORAGE_KEYS.TASKS, v); }

/* Streaks */
function loadStreaks()      { return loadFromStorage(STORAGE_KEYS.STREAKS) || []; }
function saveStreaks(v)     { saveToStorage(STORAGE_KEYS.STREAKS, v); }

/* Health */
function loadHealth()       { return loadFromStorage(STORAGE_KEYS.HEALTH)  || {}; }
function saveHealth(v)      { saveToStorage(STORAGE_KEYS.HEALTH, v); }

/* History */
function loadHistory()      { return loadFromStorage(STORAGE_KEYS.HISTORY) || {}; }
function saveHistory(v)     { saveToStorage(STORAGE_KEYS.HISTORY, v); }

/* Notes */
function loadNotes()        { return loadFromStorage(STORAGE_KEYS.NOTES)   || {}; }
function saveNotes(v)       { saveToStorage(STORAGE_KEYS.NOTES, v); }

/* Custom Pages (created via Add Page) */
function loadCustomPages()  { return loadFromStorage(STORAGE_KEYS.CUSTOM_PAGES)  || []; }
function saveCustomPages(v) { saveToStorage(STORAGE_KEYS.CUSTOM_PAGES, v); }

/* Custom Task Boxes (like "To Buy") */
function loadCustomBoxes()  { return loadFromStorage(STORAGE_KEYS.CUSTOM_BOXES)  || []; }
function saveCustomBoxes(v) { saveToStorage(STORAGE_KEYS.CUSTOM_BOXES, v); }

/* Health Trackers (dynamic — created via Add Page) */
function loadHealthTrackers()  { return loadFromStorage(STORAGE_KEYS.HEALTH_TRACKERS) || getDefaultHealthTrackers(); }
function saveHealthTrackers(v) { saveToStorage(STORAGE_KEYS.HEALTH_TRACKERS, v); }

/* =========================================================
   DEFAULT HEALTH TRACKERS
   Pre-built starter trackers shown on the Health page.
   Each tracker has an id, name, type, and color.
   ========================================================= */
function getDefaultHealthTrackers() {
  return [
    { id: "headaches",  name: "Headaches",    type: "calendar", color: "#b0977a", icon: "◉" },
    { id: "weight",     name: "Weight",       type: "weight",   color: "#8fa98f", icon: "⚖" },
    { id: "energy",     name: "Energy Level", type: "scale",    color: "#a09fc0", icon: "⚡", min:1, max:5 },
    { id: "moon",       name: "Moon",         type: "calendar", color: "#7a9cbf", icon: "◉" },
    { id: "annoyance",  name: "Annoyance",    type: "calendar", color: "#b07a9c", icon: "◉" }
  ];
}

/* Clear all — for testing */
function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}
