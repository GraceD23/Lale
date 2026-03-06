/* =========================================================
   HEALTH-SYSTEM.JS
   ---------------------------------------------------------
   Controls the Health page.

   Features:
   - Weekly health tracker (Mon–Sun)
   - Headache entries with severity + location
   - Weight logging
   - Month selector
   - Tap day → view entry notes
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeHealthPage();
});


/* =========================================================
   INITIALIZE HEALTH PAGE
   ========================================================= */

function initializeHealthPage() {

  buildMonthDropdown();
  renderWeeklyHealth();
  renderWeightLog();

}


/* =========================================================
   SAMPLE DATA
   Starter demo data until real storage is connected
   ========================================================= */

const healthData = {

  "2026-03": {
    headaches: [
      { day: "Mon", severity: 3, location: "Back of neck", note: "Possible sugar crash" },
      { day: "Thu", severity: 1, location: "Forehead", note: "Short headache" }
    ],

    weight: [
      { date: "2026-03-02", value: "120lb 3oz" },
      { date: "2026-03-09", value: "119lb 14oz" }
    ]
  }

};


/* =========================================================
   BUILD MONTH DROPDOWN
   ========================================================= */

function buildMonthDropdown() {

  const dropdown = document.getElementById("health-month-select");
  if (!dropdown) return;

  const months = Object.keys(healthData);

  months.forEach(function (month) {

    const option = document.createElement("option");
    option.value = month;
    option.textContent = formatMonthLabel(month);

    dropdown.appendChild(option);

  });

  dropdown.addEventListener("change", function () {
    renderWeeklyHealth();
    renderWeightLog();
  });

}


/* =========================================================
   FORMAT MONTH LABEL
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
   RENDER WEEKLY HEALTH GRID
   ========================================================= */

function renderWeeklyHealth() {

  const dropdown = document.getElementById("health-month-select");
  const grid = document.getElementById("health-week-grid");

  if (!dropdown || !grid) return;

  const month = dropdown.value;
  const entries = healthData[month]?.headaches || [];

  grid.innerHTML = "";

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  days.forEach(function (day) {

    const box = document.createElement("div");
    box.className = "health-day-box";

    const entry = entries.find(e => e.day === day);

    if (entry) {
      box.classList.add("health-day-filled");

      box.addEventListener("click", function () {
        showHealthEntry(entry);
      });
    }

    const label = document.createElement("span");
    label.textContent = day;

    box.appendChild(label);
    grid.appendChild(box);

  });

}


/* =========================================================
   SHOW ENTRY DETAILS
   ========================================================= */

function showHealthEntry(entry) {

  const message =
    "Headache\n\n" +
    "Severity: " + entry.severity + "\n" +
    "Location: " + entry.location + "\n" +
    "Note: " + entry.note;

  alert(message);

}


/* =========================================================
   RENDER WEIGHT LOG
   ========================================================= */

function renderWeightLog() {

  const dropdown = document.getElementById("health-month-select");
  const container = document.getElementById("weight-log");

  if (!dropdown || !container) return;

  const month = dropdown.value;
  const entries = healthData[month]?.weight || [];

  container.innerHTML = "";

  entries.forEach(function (entry) {

    const row = document.createElement("div");
    row.className = "weight-row";

    const date = document.createElement("span");
    date.textContent = new Date(entry.date).toLocaleDateString();

    const value = document.createElement("span");
    value.textContent = entry.value;

    row.appendChild(date);
    row.appendChild(value);

    container.appendChild(row);

  });

}
