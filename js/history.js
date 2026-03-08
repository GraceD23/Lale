/* =========================================================
   HISTORY.JS
   ---------------------------------------------------------
   Full History page controller.

   What this file supports now:
   - reads real saved history from storage.js
   - falls back to starter demo data only if storage is empty
   - month dropdown
   - grouped task summaries
   - "x#" only when count > 1
   - tap task row -> detail panel with completion dates/times
   - sorting newest first
   - entry type support for future expansion
   - delete support for individual detail entries
   - global overlay support
   - future-ready structure for task / streak / health / note entries

   This file is written to work with your current history.html.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeHistoryPage(); /* Starts History page logic when HTML is ready */
});


/* =========================================================
   STARTER FALLBACK DATA
   ---------------------------------------------------------
   Used only if real storage is completely empty.
   Each entry now supports:
   - type
   - name
   - date
   ========================================================= */

const HISTORY_STARTER_DATA = {
  "2026-03": [
    { type: "task", name: "Wash Car", date: "2026-03-02T10:00:00.000Z" },
    { type: "task", name: "Wash Car", date: "2026-03-18T11:30:00.000Z" },
    { type: "task", name: "Call Dentist", date: "2026-03-05T09:15:00.000Z" },
    { type: "task", name: "Take Vitamins", date: "2026-03-01T08:00:00.000Z" },
    { type: "task", name: "Take Vitamins", date: "2026-03-02T08:00:00.000Z" },
    { type: "task", name: "Take Vitamins", date: "2026-03-03T08:00:00.000Z" }
  ]
};


/* =========================================================
   PAGE STATE
   ========================================================= */

let currentHistoryMonthKey = null; /* Currently selected month on the History page */
let currentHistoryDetailEntries = []; /* Entries currently shown in the detail panel */
let currentHistoryDetailGroupKey = null; /* Name/type key currently shown in the detail panel */


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeHistoryPage() {
  normalizeStoredHistoryIfNeeded(); /* Converts older history formats into the new future-ready format */

  const availableMonths = getAvailableHistoryMonths(); /* Builds month list from real stored data */

  if (availableMonths.length === 0) {
    renderEmptyHistoryState(); /* Shows empty state if no history exists */
    attachHistoryDetailCloseButton(); /* Still attaches close button safely */
    return;
  }

  currentHistoryMonthKey = availableMonths[0]; /* Defaults to newest available month */
  renderHistoryMonthDropdown(); /* Builds dropdown month buttons */
  renderHistorySummaryList(); /* Builds grouped monthly summary list */
  attachHistoryDetailCloseButton(); /* Enables detail panel close button */
}


/* =========================================================
   HISTORY DATA ACCESS
   ========================================================= */

function getHistoryData() {
  if (typeof loadHistory === "function") {
    const storedHistory = loadHistory(); /* Reads saved history from storage.js */

    if (
      storedHistory &&
      typeof storedHistory === "object" &&
      Object.keys(storedHistory).length > 0
    ) {
      return storedHistory; /* Uses real stored history if any exists */
    }
  }

  return HISTORY_STARTER_DATA; /* Falls back only if storage is empty */
}

function saveHistoryData(historyData) {
  if (typeof saveHistory === "function") {
    saveHistory(historyData); /* Saves updated history back into storage */
  }
}


/* =========================================================
   NORMALIZE OLD HISTORY
   ---------------------------------------------------------
   Older versions may store entries like:
   { task: "Wash Car", date: "..." }

   This function upgrades them into:
   { type: "task", name: "Wash Car", date: "..." }

   so future features work without breaking old data.
   ========================================================= */

function normalizeStoredHistoryIfNeeded() {
  const historyData = getHistoryData(); /* Current raw history object */
  let changed = false; /* Tracks whether any entry was upgraded */

  Object.keys(historyData).forEach(function (monthKey) {
    if (monthKey.startsWith("__")) {
      return; /* Skips helper buckets like __notes or __pages */
    }

    const entries = historyData[monthKey];

    if (!Array.isArray(entries)) {
      return; /* Skips invalid month buckets safely */
    }

    historyData[monthKey] = entries.map(function (entry) {
      if (entry && entry.type && entry.name) {
        return entry; /* Entry already uses the new format */
      }

      changed = true; /* Marks that we upgraded at least one old entry */

      return {
        type: "task", /* Old entries are treated as tasks */
        name: entry.task || entry.name || "Untitled", /* Converts old task/name fields into name */
        date: entry.date || new Date().toISOString(), /* Keeps original date if available */
        note: entry.note || "" /* Optional future-ready note field */
      };
    });
  });

  if (changed) {
    saveHistoryData(historyData); /* Persists upgraded history format */
  }
}


/* =========================================================
   AVAILABLE MONTHS
   ========================================================= */

function getAvailableHistoryMonths() {
  const historyData = getHistoryData(); /* Full history object */

  return Object.keys(historyData)
    .filter(function (key) {
      return !key.startsWith("__"); /* Excludes helper buckets from month dropdown */
    })
    .sort()
    .reverse(); /* Newest month first */
}


/* =========================================================
   MONTH DROPDOWN
   ========================================================= */

function renderHistoryMonthDropdown() {
  const dropdownContent = document.getElementById("history-month-dropdown-content"); /* Dropdown content area */
  const dropdownTitle = document.getElementById("history-month-title"); /* Visible dropdown title text */

  if (!dropdownContent || !dropdownTitle) {
    return; /* Stops safely if dropdown elements are missing */
  }

  const months = getAvailableHistoryMonths(); /* List of real available months */
  dropdownContent.innerHTML = ""; /* Clears old month options */

  dropdownTitle.textContent = "Month: " + formatHistoryMonthLabel(currentHistoryMonthKey); /* Updates visible selected month label */

  months.forEach(function (monthKey) {
    const monthButton = document.createElement("button"); /* Clickable month option */
    monthButton.type = "button";
    monthButton.className = "secondary-action-button"; /* Reuses themed button styling */
    monthButton.textContent = formatHistoryMonthLabel(monthKey); /* Human-readable month label */

    monthButton.addEventListener("click", function () {
      currentHistoryMonthKey = monthKey; /* Switches selected month */
      dropdownTitle.textContent = "Month: " + formatHistoryMonthLabel(currentHistoryMonthKey); /* Updates visible title */
      renderHistorySummaryList(); /* Rebuilds grouped summary for the selected month */
    });

    dropdownContent.appendChild(monthButton); /* Adds month button into dropdown */
  });
}


/* =========================================================
   SUMMARY LIST
   ---------------------------------------------------------
   Builds grouped rows like:
   Wash Car x2
   Call Dentist
   ========================================================= */

function renderHistorySummaryList() {
  const summaryList = document.getElementById("history-summary-list"); /* Main summary container */

  if (!summaryList) {
    return; /* Stops safely if summary container is missing */
  }

  const historyData = getHistoryData(); /* Full history object */
  const monthEntries = Array.isArray(historyData[currentHistoryMonthKey])
    ? historyData[currentHistoryMonthKey]
    : []; /* Current month entries */

  const groupedEntries = groupHistoryEntries(monthEntries); /* Groups repeated items */
  const groupKeys = Object.keys(groupedEntries).sort(function (a, b) {
    return groupedEntries[b].latestTimestamp - groupedEntries[a].latestTimestamp; /* Newest groups first */
  });

  summaryList.innerHTML = ""; /* Clears old rows before rebuilding */

  if (groupKeys.length === 0) {
    const emptyMessage = document.createElement("p"); /* Empty-state message for selected month */
    emptyMessage.textContent = "No completed items for this month.";
    summaryList.appendChild(emptyMessage);
    return;
  }

  groupKeys.forEach(function (groupKey) {
    const group = groupedEntries[groupKey]; /* Group info for this one name/type combo */
    const rowButton = document.createElement("button"); /* Clickable summary row */
    rowButton.type = "button";
    rowButton.className = "history-task-row";

    const nameSpan = document.createElement("span"); /* Visible item name */
    nameSpan.className = "history-task-name";
    nameSpan.textContent = group.name; /* Uses grouped display name */

    rowButton.appendChild(nameSpan);

    if (group.count > 1) {
      const countSpan = document.createElement("span"); /* Count shown only when greater than 1 */
      countSpan.className = "history-task-count";
      countSpan.textContent = "x" + group.count;
      rowButton.appendChild(countSpan);
    }

    rowButton.addEventListener("click", function () {
      openHistoryDetailPanel(groupKey, group); /* Opens details for this grouped item */
    });

    summaryList.appendChild(rowButton);
  });
}


/* =========================================================
   GROUP HISTORY ENTRIES
   ---------------------------------------------------------
   Groups by type + name so future non-task types can coexist.

   Example keys:
   task::Wash Car
   streak::Vitamins
   ========================================================= */

function groupHistoryEntries(entries) {
  const grouped = {}; /* Final grouped result object */

  entries.forEach(function (entry, index) {
    const normalizedEntry = normalizeHistoryEntry(entry); /* Makes sure entry has type/name/date */
    const groupKey = normalizedEntry.type + "::" + normalizedEntry.name; /* Unique grouping key */

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        type: normalizedEntry.type, /* task / streak / health / note */
        name: normalizedEntry.name, /* Visible name */
        count: 0, /* Number of entries in this group */
        entries: [], /* Full entry objects for detail popup */
        latestTimestamp: 0 /* Used for newest-first sorting */
      };
    }

    grouped[groupKey].count += 1; /* Adds one completion/item */
    grouped[groupKey].entries.push({
      entry: normalizedEntry, /* Stores the normalized entry */
      originalIndex: index /* Keeps original array index for delete support */
    });

    const entryTimestamp = new Date(normalizedEntry.date).getTime() || 0; /* Numeric timestamp for sorting */

    if (entryTimestamp > grouped[groupKey].latestTimestamp) {
      grouped[groupKey].latestTimestamp = entryTimestamp; /* Tracks newest entry in the group */
    }
  });

  Object.keys(grouped).forEach(function (groupKey) {
    grouped[groupKey].entries.sort(function (a, b) {
      return new Date(b.entry.date) - new Date(a.entry.date); /* Newest detail rows first */
    });
  });

  return grouped;
}


/* =========================================================
   NORMALIZE SINGLE ENTRY
   ========================================================= */

function normalizeHistoryEntry(entry) {
  return {
    type: entry.type || "task", /* Defaults older entries to task */
    name: entry.name || entry.task || "Untitled", /* Uses name or old task field */
    date: entry.date || new Date().toISOString(), /* Keeps existing date or adds fallback */
    note: entry.note || "" /* Future-ready optional note */
  };
}


/* =========================================================
   DETAIL PANEL
   ---------------------------------------------------------
   Shows the clicked group's full list of completion dates.
   Each detail row also includes a delete button for future
   cleanup/editing.
   ========================================================= */

function openHistoryDetailPanel(groupKey, group) {
  const panel = document.getElementById("history-detail-panel"); /* Slide-up detail panel */
  const content = document.getElementById("history-detail-content"); /* Detail content area */
  const overlay = document.getElementById("global-overlay"); /* Global dim overlay */

  if (!panel || !content) {
    return; /* Stops safely if panel/content is missing */
  }

  currentHistoryDetailEntries = group.entries; /* Saves current entries for later reference if needed */
  currentHistoryDetailGroupKey = groupKey; /* Saves current group key */

  const wrapper = document.createElement("div"); /* Main detail content wrapper */

  const title = document.createElement("p"); /* Group title */
  title.innerHTML = "<strong>" + escapeHistoryHtml(group.name) + "</strong>";
  wrapper.appendChild(title);

  const typeRow = document.createElement("p"); /* Shows entry type for future clarity */
  typeRow.textContent = "Type: " + capitalizeHistoryText(group.type);
  wrapper.appendChild(typeRow);

  if (group.entries.length === 0) {
    const emptyMessage = document.createElement("p"); /* Fallback if group somehow has no entries */
    emptyMessage.textContent = "No entries found.";
    wrapper.appendChild(emptyMessage);
  } else {
    const list = document.createElement("div"); /* Holds each detail row */
    list.className = "history-detail-list";

    group.entries.forEach(function (item) {
      const detailRow = document.createElement("div"); /* One detail row */
      detailRow.className = "history-detail-row";

      const dateText = document.createElement("p"); /* Formatted completion date/time */
      dateText.textContent = formatHistoryDateTime(item.entry.date);
      detailRow.appendChild(dateText);

      if (item.entry.note) {
        const noteText = document.createElement("p"); /* Optional note if present */
        noteText.textContent = item.entry.note;
        detailRow.appendChild(noteText);
      }

      const deleteButton = document.createElement("button"); /* Delete single history entry */
      deleteButton.type = "button";
      deleteButton.className = "secondary-action-button";
      deleteButton.textContent = "Delete"; /* Theme-safe button text */

      deleteButton.addEventListener("click", function () {
        deleteHistoryEntry(currentHistoryMonthKey, item.originalIndex); /* Deletes this single entry from history */
      });

      detailRow.appendChild(deleteButton);
      list.appendChild(detailRow);
    });

    wrapper.appendChild(list);
  }

  content.innerHTML = ""; /* Clears previous content */
  content.appendChild(wrapper); /* Inserts new detail content */
  panel.removeAttribute("hidden"); /* Shows detail panel */

  if (overlay) {
    overlay.removeAttribute("hidden"); /* Shows dim background overlay */
  }
}


/* =========================================================
   DELETE SINGLE HISTORY ENTRY
   ---------------------------------------------------------
   Removes one entry from the selected month, saves history,
   refreshes the page list, and refreshes/close detail panel.
   ========================================================= */

function deleteHistoryEntry(monthKey, entryIndex) {
  const historyData = getHistoryData(); /* Current history object */

  if (!Array.isArray(historyData[monthKey])) {
    return; /* Stops safely if selected month bucket is invalid */
  }

  historyData[monthKey].splice(entryIndex, 1); /* Removes the selected single entry */
  saveHistoryData(historyData); /* Saves updated history */

  renderHistorySummaryList(); /* Refreshes summary list */

  const updatedMonthEntries = Array.isArray(historyData[monthKey]) ? historyData[monthKey] : []; /* Updated month entries after delete */
  const regrouped = groupHistoryEntries(updatedMonthEntries); /* Rebuilds grouped data */

  if (!currentHistoryDetailGroupKey || !regrouped[currentHistoryDetailGroupKey]) {
    closeHistoryDetailPanel(); /* Closes detail panel if the whole group disappeared */
    return;
  }

  openHistoryDetailPanel(currentHistoryDetailGroupKey, regrouped[currentHistoryDetailGroupKey]); /* Reopens updated detail panel */
}


/* =========================================================
   CLOSE DETAIL PANEL
   ========================================================= */

function closeHistoryDetailPanel() {
  const panel = document.getElementById("history-detail-panel"); /* Detail panel */
  const overlay = document.getElementById("global-overlay"); /* Global overlay */

  if (panel) {
    panel.setAttribute("hidden", ""); /* Hides the detail panel */
  }

  if (overlay) {
    overlay.setAttribute("hidden", ""); /* Hides the dim overlay */
  }

  currentHistoryDetailEntries = []; /* Clears active detail entries */
  currentHistoryDetailGroupKey = null; /* Clears active group key */
}


/* =========================================================
   CLOSE BUTTON
   ========================================================= */

function attachHistoryDetailCloseButton() {
  const closeButton = document.getElementById("history-detail-close-button"); /* Close button in detail panel */

  if (!closeButton) {
    return; /* Stops safely if button is missing */
  }

  closeButton.addEventListener("click", function () {
    closeHistoryDetailPanel(); /* Closes detail panel when Close is tapped */
  });
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function renderEmptyHistoryState() {
  const summaryList = document.getElementById("history-summary-list"); /* Main summary container */
  const dropdownTitle = document.getElementById("history-month-title"); /* Dropdown title text */
  const dropdownContent = document.getElementById("history-month-dropdown-content"); /* Dropdown content area */

  if (dropdownTitle) {
    dropdownTitle.textContent = "Month: No History";
  }

  if (dropdownContent) {
    dropdownContent.innerHTML = "<p>No saved months yet.</p>";
  }

  if (summaryList) {
    summaryList.innerHTML = "<p>No completed task history yet.</p>";
  }
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatHistoryMonthLabel(monthKey) {
  const parts = String(monthKey).split("-"); /* Splits YYYY-MM */
  const year = Number(parts[0]); /* Numeric year */
  const monthIndex = Number(parts[1]) - 1; /* JS month index */

  const monthDate = new Date(year, monthIndex, 1); /* Date object for formatting */

  return monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });
}

function formatHistoryDateTime(dateString) {
  const date = new Date(dateString); /* Converts stored date into Date object */

  if (Number.isNaN(date.getTime())) {
    return String(dateString); /* Fallback if invalid */
  }

  return date.toLocaleString("default", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }); /* Includes time formatting for future-ready detail view */
}


/* =========================================================
   SMALL HELPERS
   ========================================================= */

function escapeHistoryHtml(value) {
  const div = document.createElement("div"); /* Safe temp element */
  div.textContent = value; /* Stores as plain text */
  return div.innerHTML; /* Returns HTML-safe string */
}

function capitalizeHistoryText(value) {
  const text = String(value || ""); /* Safe conversion */
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); /* Capitalizes first letter */
}
