/* =========================================================
   HISTORY.JS
   ---------------------------------------------------------
   Controls the History page.

   Responsibilities:
   - Load completed tasks from storage
   - Group repeated tasks (example: Wash Car x2)
   - Build monthly history list
   - Show popup with completion dates when tapped

   NOTE:
   Later versions will pull real completion data
   created by the task system.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeHistoryPage();
});


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeHistoryPage() {

  buildMonthDropdown();      /* builds dropdown of available months */
  renderSelectedMonth();     /* displays the currently selected month */

}


/* =========================================================
   SAMPLE DATA
   ---------------------------------------------------------
   Starter demo data so the page works before
   the full task system is connected.
   ========================================================= */

const historyData = {

  "2026-03": [
    { task: "Wash Car", date: "2026-03-02" },
    { task: "Wash Car", date: "2026-03-18" },
    { task: "Vitamins", date: "2026-03-01" },
    { task: "Vitamins", date: "2026-03-02" },
    { task: "Vitamins", date: "2026-03-03" }
  ],

  "2026-02": [
    { task: "Wash Car", date: "2026-02-07" },
    { task: "Laundry", date: "2026-02-12" }
  ]

};


/* =========================================================
   BUILD MONTH DROPDOWN
   ========================================================= */

function buildMonthDropdown() {

  const dropdown = document.getElementById("history-month-select");

  if (!dropdown) return;

  const months = Object.keys(historyData);

  months.forEach(function (month) {

    const option = document.createElement("option");

    option.value = month;
    option.textContent = formatMonthLabel(month);

    dropdown.appendChild(option);

  });

  dropdown.addEventListener("change", function () {
    renderSelectedMonth();
  });

}


/* =========================================================
   FORMAT MONTH LABEL
   Converts 2026-03 → March 2026
   ========================================================= */

function formatMonthLabel(monthString) {

  const parts = monthString.split("-");
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;

  const date = new Date(year, month);

  return date.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

}


/* =========================================================
   RENDER SELECTED MONTH
   ========================================================= */

function renderSelectedMonth() {

  const dropdown = document.getElementById("history-month-select");
  const container = document.getElementById("history-list");

  if (!dropdown || !container) return;

  const selectedMonth = dropdown.value;

  const monthEntries = historyData[selectedMonth] || [];

  const grouped = groupTasks(monthEntries);

  container.innerHTML = "";

  Object.keys(grouped).forEach(function (taskName) {

    const taskInfo = grouped[taskName];

    const row = document.createElement("div");
    row.className = "history-task-row";

    const label = document.createElement("span");

    if (taskInfo.count > 1) {
      label.textContent = taskName + " x" + taskInfo.count;
    } else {
      label.textContent = taskName;
    }

    row.appendChild(label);

    row.addEventListener("click", function () {
      showTaskDetails(taskName, taskInfo.dates);
    });

    container.appendChild(row);

  });

}


/* =========================================================
   GROUP TASKS
   Example:
   Wash Car
   Wash Car

   becomes

   Wash Car x2
   ========================================================= */

function groupTasks(entries) {

  const grouped = {};

  entries.forEach(function (entry) {

    if (!grouped[entry.task]) {

      grouped[entry.task] = {
        count: 0,
        dates: []
      };

    }

    grouped[entry.task].count += 1;
    grouped[entry.task].dates.push(entry.date);

  });

  return grouped;

}


/* =========================================================
   SHOW TASK DETAILS
   Opens popup with completion dates
   ========================================================= */

function showTaskDetails(taskName, dates) {

  const formattedDates = dates.map(function (date) {

    return new Date(date).toLocaleDateString();

  });

  alert(
    taskName + "\n\nCompleted on:\n" +
    formattedDates.join("\n")
  );

}
