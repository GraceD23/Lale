/* =========================================================
   ADD-SYSTEM.JS
   ---------------------------------------------------------
   Final starter logic for the Add page.

   What this file does:
   - reads the typed Add command
   - shows a review panel before saving
   - creates tasks
   - creates streaks
   - creates health categories
   - creates new pages/categories as starter records
   - saves everything through storage.js
   - keeps overlay/panel behavior clean

   IMPORTANT:
   This is still a rule-based command system.
   Later, this can become more AI-driven.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeAddSystem(); /* Starts Add page behavior after HTML is ready */
});


/* =========================================================
   INITIALIZER
   ========================================================= */

function initializeAddSystem() {
  attachAddSubmitHandler(); /* Connects the Add page Submit button */
  attachAddReviewButtons(); /* Connects Confirm / Edit / Cancel buttons in the Add review panel */
}


/* =========================================================
   SUBMIT BUTTON
   ========================================================= */

function attachAddSubmitHandler() {
  const submitButton = document.getElementById("add-command-submit-button"); /* Main Add page submit button */

  if (!submitButton) {
    return; /* Stops safely if button does not exist on this page */
  }

  submitButton.addEventListener("click", function () {
    handleAddCommandSubmit(); /* Runs Add page command flow */
  });
}


/* =========================================================
   HANDLE ADD COMMAND SUBMIT
   ---------------------------------------------------------
   Reads the typed command, parses it, and opens the review
   panel with a readable summary.
   ========================================================= */

function handleAddCommandSubmit() {
  const input = document.getElementById("add-command-input"); /* Typed command textarea */

  if (!input) {
    return; /* Stops safely if input is missing */
  }

  const rawText = input.value; /* Exact typed command */
  const cleanedText = rawText.trim(); /* Removes extra start/end spaces */

  if (cleanedText === "") {
    openAddReviewPanel(
      "<p><strong>Nothing to review yet.</strong></p><p>Please type a command before pressing Submit.</p>"
    ); /* Friendly empty-state review */
    return;
  }

  const parsed = parseAddCommand(cleanedText); /* Parses the typed command into a structured result */

  window.currentAddReview = {
    originalText: cleanedText, /* Stores original command text */
    parsed: parsed /* Stores parsed Add command result */
  }; /* Saves current Add review data for Confirm button use */

  openAddReviewPanel(buildAddReviewHtml(parsed, cleanedText)); /* Opens the Add review panel with a summary */
}


/* =========================================================
   PARSE ADD COMMAND
   ---------------------------------------------------------
   Rule-based parser for the Add page.

   Supported starter commands:
   - create task wash car every Tuesday streak yes
   - create streak vitamins
   - create health category migraines
   - create new page Projects
   - create category Cleaning on Home
   ========================================================= */

function parseAddCommand(commandText) {
  const lower = commandText.toLowerCase(); /* Lowercase copy for easier keyword checks */

  const result = {
    action: "unknown", /* Default action if parser cannot understand the command */
    data: {}
  };

  /* -------------------------
     CREATE TASK
     ------------------------- */
  if (lower.startsWith("create task ")) {
    const taskName = commandText.replace(/^create task /i, "").trim(); /* Removes the command prefix and keeps the remaining task text */

    result.action = "create-task";
    result.data = {
      name: cleanTaskName(taskName), /* Task name with schedule/streak phrases stripped if detected */
      schedule: parseTaskSchedule(commandText), /* Recurring schedule if present */
      day: parseTaskDay(commandText), /* Day like Tuesday if included */
      streak: parseYesNoFlag(commandText, "streak") /* Detects "streak yes" */
    };

    return result;
  }

  /* -------------------------
     CREATE STREAK
     ------------------------- */
  if (lower.startsWith("create streak ")) {
    const streakName = commandText.replace(/^create streak /i, "").trim(); /* Keeps streak name text */

    result.action = "create-streak";
    result.data = {
      name: streakName
    };

    return result;
  }

  /* -------------------------
     CREATE HEALTH CATEGORY
     ------------------------- */
  if (lower.startsWith("create health category ")) {
    const categoryName = commandText.replace(/^create health category /i, "").trim(); /* Health category name */

    result.action = "create-health-category";
    result.data = {
      name: categoryName,
      trackerType: inferHealthTrackerType(categoryName) /* Starter guess: symptom vs measurement */
    };

    return result;
  }

  /* -------------------------
     CREATE NEW PAGE
     ------------------------- */
  if (lower.startsWith("create new page ")) {
    const pageName = commandText.replace(/^create new page /i, "").trim(); /* New page name */

    result.action = "create-page";
    result.data = {
      name: pageName
    };

    return result;
  }

  /* -------------------------
     CREATE GENERIC CATEGORY
     Example:
     create category Cleaning on Home
     ------------------------- */
  if (lower.startsWith("create category ")) {
    const remainder = commandText.replace(/^create category /i, "").trim(); /* Everything after "create category " */
    const splitMatch = remainder.match(/^(.*?)\s+on\s+(.*)$/i); /* Attempts to split category name and page location */

    result.action = "create-category";
    result.data = {
      name: splitMatch ? splitMatch[1].trim() : remainder, /* Category name before "on" if present */
      page: splitMatch ? splitMatch[2].trim() : "Unassigned" /* Page name after "on", otherwise unassigned */
    };

    return result;
  }

  return result; /* Returns unknown if no rule matched */
}


/* =========================================================
   BUILD REVIEW HTML
   ---------------------------------------------------------
   Creates the review panel summary for the parsed Add command.
   ========================================================= */

function buildAddReviewHtml(parsed, originalText) {
  let html = ""; /* Final review HTML */

  html += "<p><strong>Review your Add command:</strong></p>";
  html += "<p><strong>Typed text:</strong><br>" + escapeAddHtml(originalText) + "</p>";

  if (parsed.action === "create-task") {
    html += "<p><strong>Detected action:</strong><br>Create Task</p>";
    html += "<p><strong>Task name:</strong><br>" + escapeAddHtml(parsed.data.name || "") + "</p>";
    html += "<p><strong>Schedule:</strong><br>" + escapeAddHtml(parsed.data.schedule || "weekly") + "</p>";

    if (parsed.data.day) {
      html += "<p><strong>Day:</strong><br>" + escapeAddHtml(parsed.data.day) + "</p>";
    }

    html += "<p><strong>Counts as streak:</strong><br>" + (parsed.data.streak ? "Yes" : "No") + "</p>";
  }

  else if (parsed.action === "create-streak") {
    html += "<p><strong>Detected action:</strong><br>Create Streak</p>";
    html += "<p><strong>Streak name:</strong><br>" + escapeAddHtml(parsed.data.name || "") + "</p>";
  }

  else if (parsed.action === "create-health-category") {
    html += "<p><strong>Detected action:</strong><br>Create Health Category</p>";
    html += "<p><strong>Name:</strong><br>" + escapeAddHtml(parsed.data.name || "") + "</p>";
    html += "<p><strong>Tracker type:</strong><br>" + escapeAddHtml(parsed.data.trackerType || "symptom") + "</p>";
  }

  else if (parsed.action === "create-page") {
    html += "<p><strong>Detected action:</strong><br>Create New Page</p>";
    html += "<p><strong>Page name:</strong><br>" + escapeAddHtml(parsed.data.name || "") + "</p>";
  }

  else if (parsed.action === "create-category") {
    html += "<p><strong>Detected action:</strong><br>Create Category</p>";
    html += "<p><strong>Category name:</strong><br>" + escapeAddHtml(parsed.data.name || "") + "</p>";
    html += "<p><strong>Page:</strong><br>" + escapeAddHtml(parsed.data.page || "Unassigned") + "</p>";
  }

  else {
    html += "<p><strong>Detected action:</strong><br>Needs more detail</p>";
    html += "<p>This command is not recognized yet. Try commands like:</p>";
    html += "<ul>";
    html += "<li>create task wash car every Tuesday streak yes</li>";
    html += "<li>create streak vitamins</li>";
    html += "<li>create health category migraines</li>";
    html += "<li>create new page Projects</li>";
    html += "</ul>";
  }

  return html;
}


/* =========================================================
   OPEN REVIEW PANEL
   ========================================================= */

function openAddReviewPanel(html) {
  const panel = document.getElementById("add-review-panel"); /* Add review panel */
  const content = document.getElementById("add-review-content"); /* Review content area */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (!panel || !content) {
    return; /* Stops safely if panel/content is missing */
  }

  content.innerHTML = html; /* Inserts review HTML */
  panel.removeAttribute("hidden"); /* Shows review panel */

  if (overlay) {
    overlay.removeAttribute("hidden"); /* Shows dim overlay */
  }
}


/* =========================================================
   CLOSE REVIEW PANEL
   ========================================================= */

function closeAddReviewPanel() {
  const panel = document.getElementById("add-review-panel"); /* Add review panel */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* Hides review panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* Hides overlay */
  }
}


/* =========================================================
   REVIEW BUTTONS
   ========================================================= */

function attachAddReviewButtons() {
  const confirmButton = document.getElementById("add-review-confirm-button"); /* Confirm button */
  const editButton = document.getElementById("add-review-edit-button"); /* Edit button */
  const cancelButton = document.getElementById("add-review-cancel-button"); /* Cancel button */

  if (confirmButton) {
    confirmButton.addEventListener("click", function () {
      handleAddReviewConfirm(); /* Saves the parsed Add command */
    });
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      handleAddReviewEdit(); /* Leaves panel open for further editing */
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      handleAddReviewCancel(); /* Closes panel without saving */
    });
  }
}


/* =========================================================
   CONFIRM BUTTON
   ---------------------------------------------------------
   Saves the parsed Add command into storage.
   ========================================================= */

function handleAddReviewConfirm() {
  const currentReview = window.currentAddReview; /* Temporary Add review data */

  if (!currentReview || !currentReview.parsed) {
    return; /* Stops if there is no parsed Add command to save */
  }

  const parsed = currentReview.parsed; /* Parsed command object */

  if (parsed.action === "create-task") {
    saveAddTask(parsed.data); /* Saves a new task */
  }

  else if (parsed.action === "create-streak") {
    saveAddStreak(parsed.data); /* Saves a new streak */
  }

  else if (parsed.action === "create-health-category") {
    saveAddHealthCategory(parsed.data); /* Saves a health category definition */
  }

  else if (parsed.action === "create-page") {
    saveAddPage(parsed.data); /* Saves a page definition */
  }

  else if (parsed.action === "create-category") {
    saveAddCategory(parsed.data); /* Saves a category definition */
  }

  clearAddCommandInput(); /* Clears the typed command box */
  clearAddReviewMemory(); /* Clears temporary review data */
  closeAddReviewPanel(); /* Hides panel + overlay */
}


/* =========================================================
   EDIT BUTTON
   ========================================================= */

function handleAddReviewEdit() {
  console.log("Add review edit clicked."); /* Starter debug note */
}


/* =========================================================
   CANCEL BUTTON
   ========================================================= */

function handleAddReviewCancel() {
  closeAddReviewPanel(); /* Hides the panel but keeps current typed text */
}


/* =========================================================
   SAVE TASK
   ========================================================= */

function saveAddTask(taskData) {
  const tasks = typeof loadTasks === "function" ? loadTasks() : []; /* Current task list */

  tasks.push({
    id: buildAddUniqueId(taskData.name || "task"), /* Unique task ID */
    name: taskData.name || "Untitled Task", /* Visible task name */
    schedule: taskData.schedule || "weekly", /* Schedule string */
    day: taskData.day || null, /* Optional weekday */
    completed: false, /* New tasks begin incomplete */
    streak: Boolean(taskData.streak) /* Whether this task should count as a streak */
  });

  if (typeof saveTasks === "function") {
    saveTasks(tasks); /* Saves updated task array */
  }
}


/* =========================================================
   SAVE STREAK
   ========================================================= */

function saveAddStreak(streakData) {
  const streaks = typeof loadStreaks === "function" ? loadStreaks() : []; /* Current streak list */

  const alreadyExists = streaks.some(function (streak) {
    return streak.name === streakData.name; /* Checks for duplicate streak name */
  });

  if (alreadyExists) {
    return; /* Stops if streak already exists */
  }

  streaks.push({
    id: buildAddUniqueId(streakData.name || "streak"), /* Unique streak ID */
    name: streakData.name || "Untitled Streak", /* Visible streak name */
    count: 0, /* Running total count */
    weeklyCount: 0, /* Weekly count for homepage view */
    history: [] /* Running streak history for future use */
  });

  if (typeof saveStreaks === "function") {
    saveStreaks(streaks); /* Saves updated streak list */
  }
}


/* =========================================================
   SAVE HEALTH CATEGORY
   ---------------------------------------------------------
   Stores health category definitions inside health storage
   under a helper bucket called __categories.
   ========================================================= */

function saveAddHealthCategory(categoryData) {
  const health = typeof loadHealth === "function" ? loadHealth() : {}; /* Current health storage */

  if (!health.__categories) {
    health.__categories = []; /* Creates health category definition array */
  }

  const alreadyExists = health.__categories.some(function (category) {
    return category.name === categoryData.name; /* Prevents duplicate category names */
  });

  if (alreadyExists) {
    return; /* Stops if the health category already exists */
  }

  health.__categories.push({
    id: buildAddUniqueId(categoryData.name || "health-category"), /* Unique category ID */
    name: categoryData.name || "Untitled Health Category", /* Visible category name */
    trackerType: categoryData.trackerType || "symptom" /* symptom or measurement */
  });

  if (typeof saveHealth === "function") {
    saveHealth(health); /* Saves updated health storage */
  }
}


/* =========================================================
   SAVE PAGE DEFINITION
   ---------------------------------------------------------
   Stores custom page definitions inside history storage
   helper bucket __pages for now.
   ========================================================= */

function saveAddPage(pageData) {
  const history = typeof loadHistory === "function" ? loadHistory() : {}; /* Reuses history storage for starter page definitions */

  if (!history.__pages) {
    history.__pages = []; /* Creates page-definition bucket */
  }

  const alreadyExists = history.__pages.some(function (page) {
    return page.name === pageData.name; /* Prevents duplicate page names */
  });

  if (alreadyExists) {
    return; /* Stops if page already exists */
  }

  history.__pages.push({
    id: buildAddUniqueId(pageData.name || "page"), /* Unique page ID */
    name: pageData.name || "Untitled Page" /* Visible page name */
  });

  if (typeof saveHistory === "function") {
    saveHistory(history); /* Saves updated history helper data */
  }
}


/* =========================================================
   SAVE CATEGORY DEFINITION
   ---------------------------------------------------------
   Stores custom categories in history storage helper bucket
   __categories for now.
   ========================================================= */

function saveAddCategory(categoryData) {
  const history = typeof loadHistory === "function" ? loadHistory() : {}; /* Reuses history storage for starter category definitions */

  if (!history.__categories) {
    history.__categories = []; /* Creates category-definition bucket */
  }

  history.__categories.push({
    id: buildAddUniqueId(categoryData.name || "category"), /* Unique category ID */
    name: categoryData.name || "Untitled Category", /* Visible category name */
    page: categoryData.page || "Unassigned" /* Page where the category should be featured */
  });

  if (typeof saveHistory === "function") {
    saveHistory(history); /* Saves updated helper category data */
  }
}


/* =========================================================
   HELPERS: PARSE TASK DETAILS
   ========================================================= */

function cleanTaskName(taskNameText) {
  return String(taskNameText)
    .replace(/\bevery\s+[a-z]+\b/gi, "") /* Removes recurring day phrase like "every Tuesday" */
    .replace(/\bstreak\s+(yes|no)\b/gi, "") /* Removes streak yes/no phrase */
    .trim(); /* Final cleaned task name */
}

function parseTaskSchedule(commandText) {
  const lower = commandText.toLowerCase(); /* Lowercase command text */

  if (lower.includes(" every ")) {
    return "recurring"; /* Starter recurring label if command includes "every" */
  }

  return "weekly"; /* Default schedule if no recurring phrase exists */
}

function parseTaskDay(commandText) {
  const dayMatch = commandText.match(/\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i); /* Detects recurring weekday */

  if (!dayMatch) {
    return null; /* No day found */
  }

  return capitalizeFirstLetter(dayMatch[1]); /* Returns weekday with capital first letter */
}

function parseYesNoFlag(commandText, flagName) {
  const regex = new RegExp("\\b" + flagName + "\\s+(yes|no)\\b", "i"); /* Detects phrases like "streak yes" */
  const match = commandText.match(regex);

  if (!match) {
    return false; /* Defaults to false if no yes/no flag is found */
  }

  return match[1].toLowerCase() === "yes"; /* Returns true only for yes */
}

function inferHealthTrackerType(categoryName) {
  const lower = String(categoryName).toLowerCase(); /* Lowercase category name */

  if (lower.includes("weight")) {
    return "measurement"; /* Weight-like terms default to measurement tracker */
  }

  return "symptom"; /* Everything else defaults to symptom for now */
}


/* =========================================================
   HELPERS: UI STATE
   ========================================================= */

function clearAddCommandInput() {
  const input = document.getElementById("add-command-input"); /* Typed Add command textarea */

  if (!input) {
    return; /* Stops if input does not exist */
  }

  input.value = ""; /* Clears typed command */
}

function clearAddReviewMemory() {
  window.currentAddReview = null; /* Removes temporary Add review memory */
}


/* =========================================================
   HELPERS: GENERAL
   ========================================================= */

function buildAddUniqueId(text) {
  return String(text)
    .toLowerCase() /* Lowercase ID */
    .replace(/[^a-z0-9]+/g, "-") /* Replaces spaces/symbols with dashes */
    .replace(/^-+|-+$/g, "") + "-" + Date.now(); /* Trims edge dashes and adds timestamp */
}

function capitalizeFirstLetter(value) {
  const text = String(value || ""); /* Safe text conversion */
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); /* Capitalizes first letter */
}

function escapeAddHtml(value) {
  const div = document.createElement("div"); /* Safe temp element */
  div.textContent = value; /* Stores as plain text */
  return div.innerHTML; /* Returns escaped HTML-safe string */
}
