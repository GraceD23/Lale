/* =========================================================
   BRAIN-CONFIRM.JS
   Saves ALL confirmed Brain Dump items at once.
   ========================================================= */

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

function saveConfirmedTask(item) {
  const tasks = typeof loadTasks === "function" ? loadTasks() : [];
  tasks.push({
    id: makeConfirmId(item.name),
    name: item.name,
    schedule: item.destination === "daily" ? "daily" : "weekly",
    day: item.destination === "daily" ? getConfirmTodayShort() : null,
    completed: false,
    streak: false,
    createdAt: new Date().toISOString()
  });
  if (typeof saveTasks === "function") saveTasks(tasks);
  logToHistory({ type: "task-added", name: item.name });
}

function saveConfirmedStreak(item) {
  const streaks = typeof loadStreaks === "function" ? loadStreaks() : [];
  const name = item.name.trim();
  let match = streaks.find(s => s.name === name);
  if (!match) {
    match = { id: makeConfirmId(name), name: name, count: 0, weeklyCount: 0, history: [] };
    streaks.push(match);
  }
  match.count += 1;
  match.weeklyCount += 1;
  match.history.push({ date: new Date().toISOString(), filled: true });
  if (typeof saveStreaks === "function") saveStreaks(streaks);
}

function saveConfirmedHealth(item) {
  const health = typeof loadHealth === "function" ? loadHealth() : {};
  const mk = getConfirmMonthKey();
  if (!health[mk]) health[mk] = {};
  const cat = (item.data && item.data.category) || "general";
  if (!health[mk][cat]) health[mk][cat] = [];

  const now = new Date();
  const dayKey = now.getFullYear() + "-" +
    String(now.getMonth()+1).padStart(2,"0") + "-" +
    String(now.getDate()).padStart(2,"0");

  const entry = {
    day: dayKey,
    date: now.toISOString(), /* full ISO timestamp — used for HH:MM display */
    note: item.name
  };

  if (cat === "weight" && item.data && item.data.value) entry.value = item.data.value;
  if (item.data && item.data.severity) entry.severity = item.data.severity;
  if (item.data && item.data.level) entry.level = item.data.level;

  /* Always push — multiple entries per day are allowed (e.g. two headaches, two weight logs) */
  health[mk][cat].push(entry);
  if (typeof saveHealth === "function") saveHealth(health);
}

function saveConfirmedNote(item) {
  const notes = typeof loadNotes === "function" ? loadNotes() : {};
  const mk = getConfirmMonthKey();
  if (!notes[mk]) notes[mk] = [];
  notes[mk].push({ text: item.name, date: new Date().toISOString() });
  if (typeof saveNotes === "function") saveNotes(notes);
}

function logToHistory(entry) {
  const history = typeof loadHistory === "function" ? loadHistory() : {};
  const mk = getConfirmMonthKey();
  if (!history[mk]) history[mk] = [];
  history[mk].push({ type: entry.type, name: entry.name, date: new Date().toISOString() });
  if (typeof saveHistory === "function") saveHistory(history);
}

function rerenderAll() {
  if (typeof renderDailyTasks === "function")     renderDailyTasks();
  if (typeof renderWeeklyTasks === "function")    renderWeeklyTasks();
  if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
  if (typeof renderRecentNotes === "function")    renderRecentNotes();
  if (typeof renderWeeklyHealth === "function")   renderWeeklyHealth();
}

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

function makeConfirmId(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") + "-" + Date.now();
}

function getConfirmMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getConfirmTodayShort() {
  return new Date().toLocaleString("default", { weekday: "short" });
}
