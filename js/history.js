/* =========================================================
   HISTORY.JS
   ---------------------------------------------------------
   Controls the History page using the HTML structure that
   already exists in history.html.

   What this file does:
   - builds the month dropdown content
   - updates the visible month label
   - groups repeated completed tasks
   - shows task name only if completed once
   - shows x# only if completed more than once
   - opens a solid detail panel with completion dates
   - shows/hides the global overlay correctly

   This version is written to work with the current page
   without requiring HTML edits.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeHistoryPage(); /* Starts the History page once the HTML is ready */
});


/* =========================================================
   STARTER FALLBACK DATA
   ---------------------------------------------------------
   Used only if storage.js is missing or has no saved history yet.
   ========================================================= */

const HISTORY_STARTER_DATA = {
  "2026-03": [
    { task: "Wash Car", date: "2026-03-02T10:00:00.000Z" },
    { task: "Wash Car", date: "2026-03-18T11:30:00.000Z" },
    { task: "Call Dentist", date: "2026-03-05T09:15:00.000Z" },
    { task: "Take Vitamins", date: "2026-03-01T08:00:00.000Z" },
    { task: "Take Vitamins", date: "2026-03-02T08:00:00.000Z" },
    { task: "Take Vitamins", date: "2026-03-03T08:00:00.000Z" }
  ],
  "2026-02": [
    { task: "Wash Car", date: "2026-02-07T10:00:00.000Z" },
    { task: "Laundry", date: "2026-02-12T14:20:00.000Z" }
  ]
};


/* =========================================================
   PAGE STATE
   ---------------------------------------------------------
   Tracks the currently selected month for the History page.
   ========================================================= */

let currentHistoryMonthKey = null; /* Stores the month currently being shown on the page */


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeHistoryPage() {
  const availableMonths = getAvailableHistoryMonths(); /* Builds the list of months we can show */

  if (availableMonths.length === 0) {
    renderEmptyHistoryState(); /* Shows a fallback message if there is no history at all */
    attachHistoryDetailCloseButton(); /* Still attaches close button safely */
    return;
  }

  currentHistoryMonthKey = availableMonths[0]; /* Default to the newest available month */
  renderHistoryMonthDropdown(); /* Builds the clickable month list inside the dropdown content */
  renderHistorySummaryList(); /* Builds the grouped completed task summary for the selected month */
  attachHistoryDetailCloseButton(); /* Enables closing the detail panel */
}


/* =========================================================
   GET HISTORY DATA
   ---------------------------------------------------------
   Loads saved history from storage.js if available.
   Falls back to starter demo data if no saved history exists.
   ========================================================= */

function getHistoryData() {
  if (typeof loadHistory === "function") {
    const storedHistory = loadHistory(); /* Attempts to load saved history from storage.js */

    if (storedHistory && typeof storedHistory === "object") {
      return storedHistory; /* Uses real saved history if present */
    }
  }

  return HISTORY_STARTER_DATA; /* Falls back to starter data if saved history is unavailable */
}


/* =========================================================
   GET AVAILABLE MONTHS
   ---------------------------------------------------------
   Returns the month keys sorted newest-first.
   Excludes special helper buckets like "__notes".
   ========================================================= */

function getAvailableHistoryMonths() {
  const historyData = getHistoryData(); /* Full history object */

  return Object.keys(historyData)
    .filter(function (key) {
      return key !== "__notes"; /* Removes the note bucket so it does not appear in the task month dropdown */
    })
    .sort()
    .reverse(); /* Newest month first */
}


/* =========================================================
   RENDER MONTH DROPDOWN CONTENT
   ---------------------------------------------------------
   Builds the clickable month list inside:
   #history-month-dropdown-content
   ========================================================= */

function renderHistoryMonthDropdown() {
  const dropdownContent = document.getElementById("history-month-dropdown-content"); /* Dropdown content area that opens/closes */
  const dropdownTitle = document.getElementById("history-month-title"); /* Visible dropdown title text on the button */

  if (!dropdownContent || !dropdownTitle) {
    return; /* Stops safely if the expected History dropdown elements are missing */
  }

  const months = getAvailableHistoryMonths(); /* Gets the month list */
  dropdownContent.innerHTML = ""; /* Clears old dropdown items before rebuilding */

  dropdownTitle.textContent = "Month: " + formatHistoryMonthLabel(currentHistoryMonthKey); /* Updates the visible selected month label */

  months.forEach(function (monthKey) {
    const monthButton = document.createElement("button"); /* Creates one clickable month option */
    monthButton.type = "button"; /* Keeps it as a button instead of form submission */
    monthButton.className = "secondary-action-button"; /* Reuses existing button styling so it fits the theme */
    monthButton.textContent = formatHistoryMonthLabel(monthKey); /* Human-friendly month text */

    monthButton.addEventListener("click", function () {
      currentHistoryMonthKey = monthKey; /* Switches the selected month */
      dropdownTitle.textContent = "Month: " + formatHistoryMonthLabel(currentHistoryMonthKey); /* Updates the title text immediately */
      renderHistorySummaryList(); /* Rebuilds the visible grouped task list for the newly selected month */
    });

    dropdownContent.appendChild(monthButton); /* Adds the month option into the dropdown content area */
  });
}


/* =========================================================
   RENDER HISTORY SUMMARY LIST
   ---------------------------------------------------------
   Builds the grouped completed task list inside:
   #history-summary-list

   Rules:
   - once = task name only
   - more than once = task name + x#
   ========================================================= */

function renderHistorySummaryList() {
  const summaryList = document.getElementById("history-summary-list"); /* Main completed task list area */

  if (!summaryList) {
    return; /* Stops safely if the summary container does not exist */
  }

  const historyData = getHistoryData(); /* Full task history */
  const monthEntries = historyData[currentHistoryMonthKey] || []; /* Entries for the selected month */
  const groupedTasks = groupHistoryEntriesByTask(monthEntries); /* Groups repeated tasks into one row */

  summaryList.innerHTML = ""; /* Clears the old rows before rebuilding */

  const taskNames = Object.keys(groupedTasks);

  if (taskNames.length === 0) {
    const emptyMessage = document.createElement("p"); /* Creates empty-state text if this month has no tasks */
    emptyMessage.textContent = "No completed tasks for this month."; /* Friendly empty-state message */
    summaryList.appendChild(emptyMessage);
    return;
  }

  taskNames.forEach(function (taskName) {
    const taskGroup = groupedTasks[taskName]; /* The grouped data for this one task */
    const rowButton = document.createElement("button"); /* Each task row is clickable */
    rowButton.type = "button"; /* Button, not form submit */
    rowButton.className = "history-task-row"; /* Uses the class already referenced in history.html */

    const nameSpan = document.createElement("span"); /* Visible task name */
    nameSpan.className = "history-task-name"; /* Reuses current task-name class */
    nameSpan.textContent = taskName; /* Shows the task name */

    rowButton.appendChild(nameSpan); /* Adds the task name into the row */

    if (taskGroup.count > 1) {
      const countSpan = document.createElement("span"); /* Repeat count shown only when > 1 */
      countSpan.className = "history-task-count"; /* Existing count class from history.html */
      countSpan.textContent = "x" + taskGroup.count; /* Example: x2 */
      rowButton.appendChild(countSpan); /* Adds the repeat count into the row */
    }

    rowButton.addEventListener("click", function () {
      openHistoryDetailPanel(taskName, taskGroup.dates); /* Opens the detail panel with completion dates */
    });

    summaryList.appendChild(rowButton); /* Adds the task row into the visible summary list */
  });
}


/* =========================================================
   GROUP HISTORY ENTRIES BY TASK
   ---------------------------------------------------------
   Turns:
   Wash Car
   Wash Car
   Call Dentist

   into grouped objects with counts + date lists.
   ========================================================= */

function groupHistoryEntriesByTask(entries) {
  const grouped = {}; /* Object holding grouped task data */

  entries.forEach(function (entry) {
    if (!grouped[entry.task]) {
      grouped[entry.task] = {
        count: 0, /* Number of times this task was completed in the selected month */
        dates: [] /* Completion date list used for the popup/detail panel */
      };
    }

    grouped[entry.task].count += 1; /* Adds one completion */
    grouped[entry.task].dates.push(entry.date); /* Stores the completion date */
  });

  return grouped;
}


/* =========================================================
   OPEN HISTORY DETAIL PANEL
   ---------------------------------------------------------
   Opens the slide-up panel and shows all completion dates
   for the tapped task.
   ========================================================= */

function openHistoryDetailPanel(taskName, dates) {
  const panel = document.getElementById("history-detail-panel"); /* Slide-up detail panel */
  const content = document.getElementById("history-detail-content"); /* Content area inside the panel */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (!panel || !content) {
    return; /* Stops safely if the expected panel elements are missing */
  }

  let html = ""; /* Builds the detail panel HTML */

  html += "<p><strong>" + escapeHistoryHtml(taskName) + "</strong></p>"; /* Task heading */
  html += "<p>Completed on:</p>"; /* Intro text */

  if (!dates || dates.length === 0) {
    html += "<p>No dates found.</p>"; /* Fallback if a task somehow has no saved dates */
  } else {
    html += "<ul>"; /* Starts the date list */

    dates.forEach(function (dateString) {
      html += "<li>" + formatHistoryDate(dateString) + "</li>"; /* Adds one human-readable completion date */
    });

    html += "</ul>"; /* Ends the date list */
  }

  content.innerHTML = html; /* Inserts the detail HTML into the content area */
  panel.removeAttribute("hidden"); /* Shows the detail panel */

  if (overlay) {
    overlay.removeAttribute("hidden"); /* Dims the page behind the panel */
  }
}


/* =========================================================
   CLOSE HISTORY DETAIL PANEL
   ---------------------------------------------------------
   Hides the detail panel and overlay.
   ========================================================= */

function closeHistoryDetailPanel() {
  const panel = document.getElementById("history-detail-panel"); /* Detail panel */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* Hides the detail panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* Hides the dim background overlay */
  }
}


/* =========================================================
   ATTACH CLOSE BUTTON
   ---------------------------------------------------------
   Connects the Close button on the History detail panel.
   ========================================================= */

function attachHistoryDetailCloseButton() {
  const closeButton = document.getElementById("history-detail-close-button"); /* Close button in the detail panel */

  if (!closeButton) {
    return; /* Stops safely if the close button is missing */
  }

  closeButton.addEventListener("click", function () {
    closeHistoryDetailPanel(); /* Closes the detail panel when Close is tapped */
  });
}


/* =========================================================
   EMPTY PAGE STATE
   ---------------------------------------------------------
   Used only if absolutely no month history exists.
   ========================================================= */

function renderEmptyHistoryState() {
  const summaryList = document.getElementById("history-summary-list"); /* Main summary area */
  const dropdownTitle = document.getElementById("history-month-title"); /* Month label in the dropdown button */
  const dropdownContent = document.getElementById("history-month-dropdown-content"); /* Month dropdown content area */

  if (dropdownTitle) {
    dropdownTitle.textContent = "Month: No History"; /* Friendly label when there is no history */
  }

  if (dropdownContent) {
    dropdownContent.innerHTML = "<p>No saved months yet.</p>"; /* Empty dropdown message */
  }

  if (summaryList) {
    summaryList.innerHTML = "<p>No completed task history yet.</p>"; /* Empty summary message */
  }
}


/* =========================================================
   FORMAT MONTH LABEL
   ---------------------------------------------------------
   Converts:
   2026-03 -> March 2026
   ========================================================= */

function formatHistoryMonthLabel(monthKey) {
  const parts = String(monthKey).split("-"); /* Splits year-month string */
  const year = Number(parts[0]); /* Numeric year */
  const monthIndex = Number(parts[1]) - 1; /* JavaScript month index */

  const monthDate = new Date(year, monthIndex, 1); /* Date used for formatting */

  return monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });
}


/* =========================================================
   FORMAT DETAIL DATE
   ---------------------------------------------------------
   Converts ISO dates into readable dates for the popup.
   ========================================================= */

function formatHistoryDate(dateString) {
  const date = new Date(dateString); /* Converts stored date string into a Date object */

  if (Number.isNaN(date.getTime())) {
    return String(dateString); /* Falls back to raw text if the date is invalid */
  }

  return date.toLocaleString("default", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


/* =========================================================
   HTML ESCAPE
   ---------------------------------------------------------
   Keeps text safe before inserting into HTML.
   ========================================================= */

function escapeHistoryHtml(value) {
  const div = document.createElement("div"); /* Temporary safe element */
  div.textContent = value; /* Stores as plain text */
  return div.innerHTML; /* Returns safe HTML string */
}
