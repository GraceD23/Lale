/* =========================================================
   BRAIN-CONFIRM.JS
   Saves ALL confirmed Brain Dump items at once.
   ========================================================= */

async function handleBrainDumpConfirm() {
  const reviewData = window.currentBrainDumpReview;
  if (!reviewData || !reviewData.items || reviewData.items.length === 0) return;

  const etsyItems = reviewData.items.filter(function(i) { return i.type === "etsy"; });
  const otherItems = reviewData.items.filter(function(i) { return i.type !== "etsy"; });

  otherItems.forEach(function(item) {
    if (item.type === "task")        saveConfirmedTask(item);
    else if (item.type === "streak") saveConfirmedStreak(item);
    else if (item.type === "health") saveConfirmedHealth(item);
    else                             saveConfirmedNote(item);
  });

  /* Handle etsy BEFORE clearing so the Classic/Neon overlay can show */
  if (etsyItems.length > 0) {
    await saveConfirmedEtsy(etsyItems);
  }

  clearBrainDumpInput();
  window.currentBrainDumpReview = null;
  closeBrainDumpPanel();
  rerenderAll();
}

/* =========================================================
   ETSY — inject a Classic/Neon overlay into the current page
   ========================================================= */

function getBrainDumpAskLine() {
  return function askLineFn(context) {
    return new Promise(function(resolve) {
      var overlay = document.getElementById("bd-etsy-line-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "bd-etsy-line-overlay";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(60,47,38,0.5);z-index:9000;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
        overlay.innerHTML =
          '<div style="background:#fdf8f3;border-radius:18px;padding:24px 20px;width:100%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.15);">' +
            '<p id="bd-etsy-line-title" style="font-family:\'Josefin Sans\',sans-serif;font-size:15px;font-weight:600;color:#3C2F26;margin:0 0 6px;"></p>' +
            '<p id="bd-etsy-line-sub" style="font-family:\'Josefin Sans\',sans-serif;font-size:13px;color:#4E4036;opacity:0.7;margin:0 0 16px;"></p>' +
            '<div style="display:flex;gap:10px;">' +
              '<button id="bd-etsy-classic-btn" style="flex:1;padding:11px;border-radius:12px;border:none;background:#B88C6A;color:white;font-family:\'Josefin Sans\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Classic</button>' +
              '<button id="bd-etsy-neon-btn" style="flex:1;padding:11px;border-radius:12px;border:1.5px solid #CBB7A3;background:white;color:#3C2F26;font-family:\'Josefin Sans\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Neon</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(overlay);
      }

      document.getElementById("bd-etsy-line-title").textContent = "Classic or Neon?";
      document.getElementById("bd-etsy-line-sub").textContent = context || "Which inventory line does this belong to?";
      overlay.style.display = "flex";

      function onClassic() { cleanup(); resolve("classic"); }
      function onNeon()    { cleanup(); resolve("neon"); }
      function cleanup() {
        overlay.style.display = "none";
        document.getElementById("bd-etsy-classic-btn").removeEventListener("click", onClassic);
        document.getElementById("bd-etsy-neon-btn").removeEventListener("click", onNeon);
      }
      document.getElementById("bd-etsy-classic-btn").addEventListener("click", onClassic);
      document.getElementById("bd-etsy-neon-btn").addEventListener("click", onNeon);
    });
  };
}

async function saveConfirmedEtsy(items) {
  const combined = items.map(function(i) { return i.name; }).join("\n");
  const askLineFn = getBrainDumpAskLine();
  const askSubtractFn = getBrainDumpAskSubtract();

  if (typeof processEtsyInput === "function") {
    await processEtsyInput(combined, askLineFn, askSubtractFn);
  } else {
    console.error("processEtsyInput not available — is etsy-system.js loaded?");
  }
}

function getBrainDumpAskSubtract() {
  return function askSubtractFn(context) {
    return new Promise(function(resolve) {
      var overlay = document.getElementById("bd-etsy-subtract-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "bd-etsy-subtract-overlay";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(60,47,38,0.5);z-index:9000;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
        overlay.innerHTML =
          '<div style="background:#fdf8f3;border-radius:18px;padding:24px 20px;width:100%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.15);">' +
            '<p id="bd-etsy-subtract-title" style="font-family:Josefin Sans,sans-serif;font-size:15px;font-weight:600;color:#3C2F26;margin:0 0 6px;"></p>' +
            '<p id="bd-etsy-subtract-sub" style="font-family:Josefin Sans,sans-serif;font-size:13px;color:#4E4036;opacity:0.7;margin:0 0 16px;">Which inventory should be reduced?</p>' +
            '<div style="display:flex;gap:10px;">' +
              '<button id="bd-etsy-necklace-btn" style="flex:1;padding:11px;border-radius:12px;border:none;background:#B88C6A;color:white;font-family:Josefin Sans,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Necklace</button>' +
              '<button id="bd-etsy-beads-btn" style="flex:1;padding:11px;border-radius:12px;border:1.5px solid #CBB7A3;background:white;color:#3C2F26;font-family:Josefin Sans,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Beads</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(overlay);
      }
      document.getElementById("bd-etsy-subtract-title").textContent = context || "Subtract from?";
      overlay.style.display = "flex";
      function onNecklace() { cleanup(); resolve("necklace"); }
      function onBeads()    { cleanup(); resolve("beads"); }
      function cleanup() {
        overlay.style.display = "none";
        document.getElementById("bd-etsy-necklace-btn").removeEventListener("click", onNecklace);
        document.getElementById("bd-etsy-beads-btn").removeEventListener("click", onBeads);
      }
      document.getElementById("bd-etsy-necklace-btn").addEventListener("click", onNecklace);
      document.getElementById("bd-etsy-beads-btn").addEventListener("click", onBeads);
    });
  };
}

/* =========================================================
   OTHER SAVE FUNCTIONS
   ========================================================= */

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
  let match = streaks.find(function(s) { return s.name === name; });
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
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  const entry = {
    day: dayKey,
    date: now.toISOString(),
    note: (item.data && item.data.note) ? item.data.note : item.name
  };

  if (cat === "weight" && item.data && item.data.value) entry.value = item.data.value;
  if (item.data && item.data.severity) entry.severity = item.data.severity;
  if (item.data && item.data.level) entry.level = item.data.level;

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
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now();
}

function getConfirmMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getConfirmTodayShort() {
  return new Date().toLocaleString("default", { weekday: "short" });
}
