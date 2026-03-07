/* =========================================================
   BRAIN-CONFIRM.JS
   ---------------------------------------------------------
   Final confirm handler for Brain Dump review.

   What this file does:
   - task → saves into task storage
   - streak → saves/updates streak storage
   - health → saves health entries
   - note → saves notes into history note bucket
   - refreshes visible UI after save
   - clears Brain Dump input
   - closes review panel + overlay
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeBrainConfirm(); /* Starts confirm-button wiring after page HTML is ready */
});


/* =========================================================
   INITIALIZER
   ========================================================= */

function initializeBrainConfirm() {
  const confirmButton = document.getElementById("review-confirm-button"); /* Confirm button inside the Brain Dump review panel */

  if (!confirmButton) {
    return; /* Stops safely if the page does not contain the Brain Dump confirm button */
  }

  confirmButton.addEventListener("click", function () {
    handleBrainDumpConfirm(); /* Runs save logic when Confirm is tapped */
  });
}


/* =========================================================
   MAIN CONFIRM HANDLER
   ========================================================= */

function handleBrainDumpConfirm() {
  const reviewData = window.currentBrainDumpReview; /* Most recent parsed Brain Dump result stored by brain-dump.js */

  if (!reviewData || !reviewData.parsed) {
    return; /* Stops safely if there is no current review data to save */
  }

  const parsed = reviewData.parsed; /* Parsed result from brain-parser.js */
  const originalText = reviewData.originalText || ""; /* Original typed Brain Dump text */

  if (parsed.type === "task") {
    saveConfirmedTask(parsed.data, originalText); /* Saves detected task */
  }

  else if (parsed.type === "streak") {
    saveConfirmedStreak(parsed.data, originalText); /* Saves detected streak action */
  }

  else if (parsed.type === "health") {
    saveConfirmedHealth(parsed.data, originalText); /* Saves detected health entry */
  }

  else {
    saveConfirmedNote(originalText); /* Saves fallback note */
  }

  clearBrainDumpInput(); /* Clears the Brain Dump textarea after successful confirm */
  clearBrainDumpReviewMemory(); /* Removes temporary review memory so stale data is not reused */
  closeBrainDumpReviewPanel(); /* Hides the review panel and overlay */
  rerenderConnectedSystems(); /* Refreshes any visible UI using the saved data */
}


/* =========================================================
   SAVE CONFIRMED TASK
   ---------------------------------------------------------
   Saves a new task into task storage.

   Default behavior:
   - new tasks start incomplete
   - default schedule = weekly unless parser provided one
   - default streak flag = false
   ========================================================= */

function saveConfirmedTask(taskData, originalText) {
  const tasks = typeof loadTasks === "function" ? loadTasks() : []; /* Loads current tasks from storage.js */

  const taskName = getSafeTaskName(taskData, originalText); /* Uses parsed task name if available, otherwise falls back to original text */

  const newTask = {
    id: buildUniqueId(taskName), /* Unique ID for this task */
    name: taskName, /* Visible task name */
    schedule: taskData && taskData.schedule ? taskData.schedule : "weekly", /* Uses parser schedule or defaults to weekly */
    day: taskData && taskData.day ? taskData.day : null, /* Optional day-of-week field for future recurring task support */
    completed: false, /* New tasks start incomplete */
    streak: Boolean(taskData && taskData.streak) /* Uses parsed streak setting if later added */
  };

  tasks.push(newTask); /* Adds the new task into the task array */

  if (typeof saveTasks === "function") {
    saveTasks(tasks); /* Saves updated task list into storage */
  }
}


/* =========================================================
   SAVE CONFIRMED STREAK
   ---------------------------------------------------------
   Adds one completion to a streak action.

   If the streak does not exist yet:
   - creates it
   Then:
   - increments count by 1
   ========================================================= */

function saveConfirmedStreak(streakData, originalText) {
  const streaks = typeof loadStreaks === "function" ? loadStreaks() : []; /* Loads current streaks from storage.js */

  const streakName = getSafeStreakName(streakData, originalText); /* Uses parsed streak name if available */

  let matchingStreak = streaks.find(function (streak) {
    return streak.name === streakName; /* Looks for an existing streak with the same name */
  });

  if (!matchingStreak) {
    matchingStreak = {
      id: buildUniqueId(streakName), /* Unique ID for new streak */
      name: streakName, /* Visible streak name */
      count: 0, /* Running total count */
      weeklyCount: 0, /* Weekly count used for homepage dropdown */
      history: [] /* Running history pattern for future full streak page */
    };

    streaks.push(matchingStreak); /* Adds new streak if it did not already exist */
  }

  matchingStreak.count += 1; /* Increments total count */
  matchingStreak.weeklyCount += 1; /* Increments weekly count */
  matchingStreak.history.push({
    date: new Date().toISOString(), /* Stores completion date/time */
    filled: true /* Starter history marker for a completed day */
  });

  if (typeof saveStreaks === "function") {
    saveStreaks(streaks); /* Saves updated streak list into storage */
  }
}


/* =========================================================
   SAVE CONFIRMED HEALTH ENTRY
   ---------------------------------------------------------
   Saves health entries into monthly buckets.

   Current supported category:
   - headache

   Structure:
   health[monthKey].headaches[]
   ========================================================= */

function saveConfirmedHealth(healthData, originalText) {
  const health = typeof loadHealth === "function" ? loadHealth() : {}; /* Loads current health storage */

  const monthKey = getCurrentMonthKey(); /* Example: 2026-03 */

  if (!health[monthKey]) {
    health[monthKey] = {
      headaches: [], /* Symptom entries bucket */
      weight: [] /* Weight entries bucket */
    };
  }

  if (healthData && healthData.category === "headache") {
    health[monthKey].headaches.push({
      day: getTodayShortName(), /* Stores weekday like Mon/Tue/Wed */
      date: new Date().toISOString(), /* Stores full timestamp */
      severity: healthData.severity || null, /* Parsed severity if available */
      location: healthData.location || "", /* Parsed location if available */
      note: originalText /* Full original text saved as note */
    });
  }

  if (typeof saveHealth === "function") {
    saveHealth(health); /* Saves updated health data into storage */
  }
}


/* =========================================================
   SAVE CONFIRMED NOTE
   ---------------------------------------------------------
   Saves general notes into a dedicated note bucket inside
   history storage for now.

   This prevents notes from being lost before a dedicated
   notes system exists.
   ========================================================= */

function saveConfirmedNote(originalText) {
  const history = typeof loadHistory === "function" ? loadHistory() : {}; /* Loads history storage */

  const monthKey = getCurrentMonthKey(); /* Current month key */

  if (!history.__notes) {
    history.__notes = {}; /* Creates notes bucket if it does not exist */
  }

  if (!history.__notes[monthKey]) {
    history.__notes[monthKey] = []; /* Creates month-specific note array */
  }

  history.__notes[monthKey].push({
    text: originalText, /* Stores note text */
    date: new Date().toISOString() /* Stores timestamp */
  });

  if (typeof saveHistory === "function") {
    saveHistory(history); /* Saves updated history/note data */
  }
}


/* =========================================================
   UI REFRESH
   ---------------------------------------------------------
   Re-renders connected systems only if their functions exist.
   This avoids errors on pages that do not load those systems.
   ========================================================= */

function rerenderConnectedSystems() {
  if (typeof renderDailyTasks === "function") {
    renderDailyTasks(); /* Refreshes Daily Focus if task system is loaded */
  }

  if (typeof renderWeeklyTasks === "function") {
    renderWeeklyTasks(); /* Refreshes Weekly Tasks if task system is loaded */
  }

  if (typeof renderHomepageStreaks === "function") {
    renderHomepageStreaks(); /* Refreshes homepage streak display if streaks.js is loaded */
  }

  if (typeof renderWeeklyHealth === "function") {
    renderWeeklyHealth(); /* Refreshes weekly health boxes if health system is loaded */
  }

  if (typeof renderWeightLog === "function") {
    renderWeightLog(); /* Refreshes weight area if health system is loaded */
  }

  if (typeof renderHistorySummaryList === "function") {
    renderHistorySummaryList(); /* Refreshes History page if open and loaded */
  }
}


/* =========================================================
   CLOSE REVIEW PANEL
   ---------------------------------------------------------
   Hides the review panel and the global dim overlay.
   ========================================================= */

function closeBrainDumpReviewPanel() {
  const panel = document.getElementById("review-panel"); /* Brain Dump review panel */
  const overlay = document.getElementById("global-overlay"); /* Page dim overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* Hides review panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* Hides dim overlay */
  }
}


/* =========================================================
   CLEAR BRAIN DUMP INPUT
   ========================================================= */

function clearBrainDumpInput() {
  const input = document.getElementById("brain-dump-input"); /* Brain Dump textarea */

  if (!input) {
    return; /* Stops safely if textarea does not exist */
  }

  input.value = ""; /* Clears typed Brain Dump text */
}


/* =========================================================
   CLEAR TEMP REVIEW MEMORY
   ---------------------------------------------------------
   Removes temporary parsed review data after saving so old
   data cannot be accidentally reused.
   ========================================================= */

function clearBrainDumpReviewMemory() {
  window.currentBrainDumpReview = null; /* Clears temporary review memory */
}


/* =========================================================
   SAFE NAME HELPERS
   ========================================================= */

function getSafeTaskName(taskData, originalText) {
  if (taskData && typeof taskData.name === "string" && taskData.name.trim() !== "") {
    return taskData.name.trim(); /* Uses parsed task name if valid */
  }

  return originalText.trim(); /* Falls back to original text if parser did not provide a name */
}

function getSafeStreakName(streakData, originalText) {
  if (streakData && typeof streakData.name === "string" && streakData.name.trim() !== "") {
    return streakData.name.trim(); /* Uses parsed streak name if valid */
  }

  return originalText.trim(); /* Falls back to original text if parser did not provide a name */
}


/* =========================================================
   DATE / ID HELPERS
   ========================================================= */

function buildUniqueId(text) {
  return String(text)
    .toLowerCase() /* Makes ID lowercase */
    .replace(/[^a-z0-9]+/g, "-") /* Replaces spaces/symbols with dashes */
    .replace(/^-+|-+$/g, "") + "-" + Date.now(); /* Trims edge dashes and adds timestamp */
}

function getCurrentMonthKey() {
  const now = new Date(); /* Current date */
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"); /* Example: 2026-03 */
}

function getTodayShortName() {
  return new Date().toLocaleString("default", { weekday: "short" }); /* Example: Mon */
}
