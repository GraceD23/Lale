/* =========================================================
   BRAIN-CONFIRM.JS
   ---------------------------------------------------------
   Handles what happens when the user presses Confirm
   in the Brain Dump review panel.

   Current behavior:
   - task → adds task to task storage
   - streak → updates streak storage
   - health → saves health entry
   - note → saves note into history-style note storage placeholder

   IMPORTANT:
   This file expects brain-dump.js to store the latest parsed
   Brain Dump result on window.currentBrainDumpReview.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeBrainConfirm();
});


/* =========================================================
   INITIALIZER
   ========================================================= */

function initializeBrainConfirm() {
  const confirmButton = document.getElementById("review-confirm-button"); /* Confirm button inside Brain Dump review panel */

  if (!confirmButton) {
    return; /* Stops safely if this page does not contain the review confirm button */
  }

  confirmButton.addEventListener("click", function () {
    handleBrainDumpConfirm(); /* Runs the save logic when Confirm is tapped */
  });
}


/* =========================================================
   MAIN CONFIRM HANDLER
   ========================================================= */

function handleBrainDumpConfirm() {
  const reviewData = window.currentBrainDumpReview; /* Most recent parsed Brain Dump result */

  if (!reviewData) {
    return; /* Stops if there is no parsed review data to save */
  }

  const parsed = reviewData.parsed; /* Parsed object from brain-parser.js */
  const originalText = reviewData.originalText; /* Original typed Brain Dump text */

  if (!parsed || !parsed.type) {
    return; /* Stops safely if parsed data is missing */
  }

  if (parsed.type === "task") {
    saveBrainDumpTask(parsed.data);
  }

  else if (parsed.type === "streak") {
    saveBrainDumpStreak(parsed.data);
  }

  else if (parsed.type === "health") {
    saveBrainDumpHealth(parsed.data, originalText);
  }

  else {
    saveBrainDumpNote(originalText);
  }

  clearBrainDumpInputAfterConfirm(); /* Clears the Brain Dump textarea after successful confirm */
  closeBrainDumpReviewPanel(); /* Closes the review panel and overlay after saving */
  rerenderAfterBrainDumpSave(); /* Refreshes visible UI if relevant systems are loaded */
}


/* =========================================================
   SAVE TASK
   ========================================================= */

function saveBrainDumpTask(taskData) {
  const tasks = typeof loadTasks === "function" ? loadTasks() : []; /* Loads existing tasks from storage.js */

  const newTask = {
    id: buildSimpleId(taskData.name), /* Creates a simple reusable task ID */
    name: taskData.name, /* Visible task name */
    schedule: taskData.schedule || "weekly", /* Defaults to weekly if parser did not specify */
    completed: false, /* New tasks start incomplete */
    streak: false /* Brain Dump starter task defaults to non-streak unless expanded later */
  };

  tasks.push(newTask); /* Adds the new task to the task list */

  if (typeof saveTasks === "function") {
    saveTasks(tasks); /* Saves updated tasks back to storage */
  }
}


/* =========================================================
   SAVE STREAK
   ========================================================= */

function saveBrainDumpStreak(streakData) {
  const streaks = typeof loadStreaks === "function" ? loadStreaks() : []; /* Loads existing streaks from storage.js */

  let matchingStreak = streaks.find(function (streak) {
    return streak.name === streakData.name; /* Checks whether this streak already exists */
  });

  if (!matchingStreak) {
    matchingStreak = {
      name: streakData.name, /* Visible streak name */
      count: 0 /* New streak starts at zero then increments below */
    };

    streaks.push(matchingStreak); /* Adds the new streak if it did not already exist */
  }

  matchingStreak.count += 1; /* Adds one star/count for the confirmed streak action */

  if (typeof saveStreaks === "function") {
    saveStreaks(streaks); /* Saves updated streak data back to storage */
  }
}


/* =========================================================
   SAVE HEALTH ENTRY
   ========================================================= */

function saveBrainDumpHealth(healthData, originalText) {
  const health = typeof loadHealth === "function" ? loadHealth() : {}; /* Loads existing health storage */

  const monthKey = getCurrentMonthKey(); /* Current month bucket for storage */

  if (!health[monthKey]) {
    health[monthKey] = {
      headaches: [],
      weight: []
    }; /* Creates the current month structure if it does not exist yet */
  }

  if (healthData.category === "headache") {
    health[monthKey].headaches.push({
      day: getTodayShortName(), /* Stores weekday like Mon/Tue */
      severity: healthData.severity || null, /* Stores parsed severity if available */
      location: healthData.location || "", /* Location support for future parser expansion */
      note: originalText /* Stores the full original text as the note */
    });
  }

  if (typeof saveHealth === "function") {
    saveHealth(health); /* Saves updated health data back to storage */
  }
}


/* =========================================================
   SAVE NOTE
   ---------------------------------------------------------
   Starter placeholder for note saving.
   For now this stores notes inside history storage under a
   dedicated "__notes" bucket so they are not lost.
   ========================================================= */

function saveBrainDumpNote(originalText) {
  const history = typeof loadHistory === "function" ? loadHistory() : {}; /* Loads existing history storage */

  const monthKey = getCurrentMonthKey(); /* Current month bucket */

  if (!history.__notes) {
    history.__notes = {}; /* Creates notes bucket if it does not exist */
  }

  if (!history.__notes[monthKey]) {
    history.__notes[monthKey] = []; /* Creates current month notes list */
  }

  history.__notes[monthKey].push({
    text: originalText, /* Stores original Brain Dump note text */
    date: new Date().toISOString() /* Stores creation timestamp */
  });

  if (typeof saveHistory === "function") {
    saveHistory(history); /* Saves note bucket using existing history storage */
  }
}


/* =========================================================
   CLEAR BRAIN DUMP INPUT
   ========================================================= */

function clearBrainDumpInputAfterConfirm() {
  const input = document.getElementById("brain-dump-input"); /* Brain Dump textarea */

  if (!input) {
    return; /* Stops safely if input is missing */
  }

  input.value = ""; /* Clears the Brain Dump textarea after successful confirm */
}


/* =========================================================
   CLOSE REVIEW PANEL
   ========================================================= */

function closeBrainDumpReviewPanel() {
  const panel = document.getElementById("review-panel"); /* Brain Dump review panel */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* Hides the review panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* Hides the dim background overlay */
  }
}


/* =========================================================
   REFRESH VISIBLE UI
   ---------------------------------------------------------
   Re-renders task/streak/health UI if those page systems are
   loaded on the current page.
   ========================================================= */

function rerenderAfterBrainDumpSave() {
  if (typeof renderDailyTasks === "function") {
    renderDailyTasks(); /* Refreshes Daily Focus if tasks-system.js is loaded */
  }

  if (typeof renderWeeklyTasks === "function") {
    renderWeeklyTasks(); /* Refreshes Weekly Tasks if tasks-system.js is loaded */
  }

  if (typeof renderHomepageStreaks === "function") {
    renderHomepageStreaks(); /* Refreshes homepage streak display if streaks.js is loaded */
  }

  if (typeof renderWeeklyHealth === "function") {
    renderWeeklyHealth(); /* Refreshes Health page weekly view if health-system.js is loaded */
  }

  if (typeof renderWeightLog === "function") {
    renderWeightLog(); /* Refreshes Health page weight view if health-system.js is loaded */
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function buildSimpleId(text) {
  return String(text)
    .toLowerCase() /* Makes ID lowercase */
    .replace(/[^a-z0-9]+/g, "-") /* Replaces spaces/symbols with dashes */
    .replace(/^-+|-+$/g, "") + "-" + Date.now(); /* Trims edge dashes and adds timestamp for uniqueness */
}

function getCurrentMonthKey() {
  const now = new Date(); /* Current date */
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"); /* Example: 2026-03 */
}

function getTodayShortName() {
  return new Date().toLocaleString("default", { weekday: "short" }); /* Example: Mon */
}
