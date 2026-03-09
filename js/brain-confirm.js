/* =========================================================
   BRAIN-CONFIRM.JS
   ---------------------------------------------------------
   Saves ALL confirmed Brain Dump items at once.

   Handles: tasks (daily/weekly), notes, health, streaks
   Refreshes UI after saving.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  /* confirm button is wired dynamically in brain-dump.js */
});

function handleBrainDumpConfirm() {
  const reviewData = window.currentBrainDumpReview;
  if (!reviewData || !reviewData.items || reviewData.items.length === 0) return;

  reviewData.items.forEach(function (item) {
    if (item.type === "task")        saveConfirmedTask(item);
    else if (item.type === "streak") saveConfirmedStreak(item);
    else if (item.type === "health") saveConfirmedHealth(item);
    else                             saveConfirmedNote(item);
  });

  clearBrainDumpInput();
  window.currentBrainDumpReview = null;
  closeBrainDumpPanel();
  rerenderAll();
}

/* =========================================================
   SAVE TASK
   ========================================================= */

function saveConfirmedTask(item) {
  const tasks = typeof loadTasks === "function" ? loadTasks() : [];

  const newTask = {
    id: makeId(item.name),
    name: item.name,
    schedule: item.destination === "daily" ? "daily" : "weekly",
    day: item.destination === "daily" ? getTodayShortName() : null,
    completed: false,
    streak: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  if (typeof saveTasks === "function") saveTasks(tasks);

  /* Also log to history */
  logToHistory({ type: "task-added", name: item.name });
}

/* =========================================================
   SAVE STREAK
   ========================================================= */

function saveConfirmedStreak(item) {
  const streaks = typeof loadStreaks === "function" ? loadStreaks() : [];
  const name = item.name.trim();

  let match = streaks.find(s => s.name === name);
  if (!match) {
    match = { id: makeId(name), name: name, count: 0, weeklyCount: 0, history: [] };
    streaks.push(match);
  }

  match.count += 1;
  match.weeklyCount += 1;
  match.history.push({ date: new Date().toISOString(), filled: true });

  if (typeof saveStreaks === "function") saveStreaks(streaks);
}

/* =========================================================
   SAVE HEALTH
   ========================================================= */

function saveConfirmedHealth(item) {
  const health = typeof loadHealth === "function" ? loadHealth() : {};
  const monthKey = getMonthKey();

  if (!health[monthKey]) health[monthKey] = {};

  const category = (item.data && item.data.category) || "general";
  if (!health[monthKey][category]) health[monthKey][category] = [];

  health[monthKey][category].push({
    day: getTodayShortName(),
    date: new Date().toISOString(),
    severity: (item.data && item.data.severity) || null,
    level: (item.data && item.data.level) || null,
    note: item.name
  });

  if (typeof saveHealth === "function") saveHealth(health);
}

/* =========================================================
   SAVE NOTE
   ========================================================= */

function saveConfirmedNote(item) {
  const notes = typeof loadNotes === "function" ? loadNotes() : {};
  const monthKey = getMonthKey();

  if (!notes[monthKey]) notes[monthKey] = [];

  notes[monthKey].push({
    text: item.name,
    date: new Date().toISOString()
  });

  if (typeof saveNotes === "function") saveNotes(notes);
}

/* =========================================================
   LOG TO HISTORY
   ========================================================= */

function logToHistory(entry) {
  const history = typeof loadHistory === "function" ? loadHistory() : {};
  const monthKey = getMonthKey();
  if (!history[monthKey]) history[monthKey] = [];
  history[monthKey].push({ type: entry.type, name: entry.name, date: new Date().toISOString() });
  if (typeof saveHistory === "function") saveHistory(history);
}

/* =========================================================
   UI REFRESH
   ========================================================= */

function rerenderAll() {
  if (typeof renderDailyTasks === "function")     renderDailyTasks();
  if (typeof renderWeeklyTasks === "function")    renderWeeklyTasks();
  if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
  if (typeof renderRecentNotes === "function")    renderRecentNotes();
  if (typeof renderWeeklyHealth === "function")   renderWeeklyHealth();
}

/* =========================================================
   HELPERS
   ========================================================= */

function closeBrainDumpPanel() {
  const panel = document.getElementById("review-panel");
  const overlay = document.getElementById("global-overlay");
  if (panel) panel.setAttribute("hidden", "");
  if (overlay) overlay.setAttribute("hidden", "");
}

function clearBrainDumpInput() {
  const input = document.getElementById("brain-dump-input");
  if (input) input.value = "";
}

function makeId(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") + "-" + Date.now();
}

function getMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getTodayShortName() {
  return new Date().toLocaleString("default", { weekday: "short" });
}
