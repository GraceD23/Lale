/* =========================================================
   HEALTH-SYSTEM.JS
   ---------------------------------------------------------
   Fully dynamic Health Page controller.

   Features:
   - Renders all trackers from storage (default + custom)
   - Headache / Burnout: calendar-style circle grid
   - Weight: line chart + written log (no Mon-Sun row)
   - Energy Level: 1-5 daily scale
   - Month selector per tracker
   - Tap circle to add/view entry
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeHealthSystem();
});

function initializeHealthSystem() {
  buildHealthPage();
}

/* =========================================================
   BUILD HEALTH PAGE DYNAMICALLY
   ========================================================= */

function buildHealthPage() {
  const main = document.querySelector(".home-page-main-content");
  if (!main) return;

  /* Remove old hardcoded health sections and old edit button */
  const oldSections = main.querySelectorAll(".health-category-card");
  oldSections.forEach(s => s.remove());
  const oldEditBtn = document.getElementById("health-edit-trackers-btn");
  if (oldEditBtn) oldEditBtn.remove();

  const trackers = loadHealthTrackers();

  trackers.forEach(function (tracker) {
    const section = buildTrackerSection(tracker);
    if (section) {
      const detailPanel = document.getElementById("health-detail-panel");
      if (detailPanel) {
        main.insertBefore(section, detailPanel);
      } else {
        main.appendChild(section);
      }
    }
  });

  /* Edit Trackers button at the very bottom */
  const editBtn = document.createElement("button");
  editBtn.id = "health-edit-trackers-btn";
  editBtn.type = "button";
  editBtn.className = "secondary-action-button";
  editBtn.textContent = "Edit Trackers";
  editBtn.style.cssText = "width:100%;margin-top:8px;margin-bottom:24px;";
  editBtn.addEventListener("click", openTrackerEditPanel);
  main.appendChild(editBtn);
}

/* =========================================================
   BUILD ONE TRACKER SECTION
   ========================================================= */

function buildTrackerSection(tracker) {
  if (tracker.type === "weight")   return buildWeightSection(tracker);
  if (tracker.type === "calendar") return buildCalendarSection(tracker);
  if (tracker.type === "scale")    return buildScaleSection(tracker);
  if (tracker.type === "yesno")    return buildYesNoSection(tracker);
  return buildCalendarSection(tracker); /* Default */
}

/* =========================================================
   CALENDAR SECTION (Headaches, Burnout, etc.)
   Shows a monthly grid of circles — filled = entry logged
   ========================================================= */

function buildCalendarSection(tracker) {
  const section = document.createElement("section");
  section.className = "dashboard-card health-category-card";
  section.id = "tracker-" + tracker.id;
  section.setAttribute("aria-labelledby", tracker.id + "-title");

  const monthKey = getCurrentMonthKey();

  section.innerHTML = `
    <h2 id="${tracker.id}-title" class="card-title" style="color:${tracker.color || '#b0977a'}">${escH(tracker.name)}</h2>
    <div class="health-month-nav" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <button type="button" style="background:none;border:none;font-size:20px;cursor:pointer;color:#b0977a;padding:4px 8px;line-height:1;" data-tracker="${tracker.id}" data-dir="-1">‹</button>
      <span class="health-month-label" data-tracker="${tracker.id}" style="font-size:13px;flex:1;text-align:center;">${formatMonthLabel(monthKey)}</span>
      <button type="button" style="background:none;border:none;font-size:20px;cursor:pointer;color:#b0977a;padding:4px 8px;line-height:1;" data-tracker="${tracker.id}" data-dir="1">›</button>
    </div>
    <div class="health-calendar-grid" id="calendar-${tracker.id}" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;"></div>
    <div class="health-entry-form" id="entry-form-${tracker.id}" style="display:none;margin-top:10px;padding:10px;background:rgba(255,255,255,0.5);border-radius:10px;">
      <p id="entry-form-title-${tracker.id}" style="margin:0 0 6px 0;font-size:13px;font-weight:600;"></p>
      <label style="font-size:12px;">Severity (1-5):
        <input type="number" min="1" max="5" id="entry-severity-${tracker.id}" style="width:50px;margin-left:6px;padding:2px 4px;border-radius:4px;border:1px solid #b0977a;">
      </label>
      <br><br>
      <label style="font-size:12px;">Note:
        <input type="text" id="entry-note-${tracker.id}" placeholder="Optional note..." style="width:100%;margin-top:4px;padding:4px 6px;border-radius:4px;border:1px solid #b0977a;box-sizing:border-box;">
      </label>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button type="button" class="primary-action-button" style="font-size:12px;" data-tracker="${tracker.id}" data-action="save-entry">Save</button>
        <button type="button" class="secondary-action-button" style="font-size:12px;" data-tracker="${tracker.id}" data-action="cancel-entry">Cancel</button>
      </div>
    </div>
  `;

  /* Store current month per tracker */
  section.dataset.currentMonth = monthKey;

  /* Attach month nav */
  section.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("click", function () {
      const dir = parseInt(btn.dataset.dir);
      const current = section.dataset.currentMonth;
      const newMonth = shiftMonth(current, dir);
      section.dataset.currentMonth = newMonth;
      section.querySelector("[data-tracker='" + tracker.id + "'].health-month-label").textContent = formatMonthLabel(newMonth);
      renderCalendarGrid(tracker, newMonth, section);
    });
  });

  /* Save entry button */
  section.querySelector("[data-action='save-entry']").addEventListener("click", function () {
    saveCalendarEntry(tracker, section);
  });

  /* Cancel entry button */
  section.querySelector("[data-action='cancel-entry']").addEventListener("click", function () {
    section.querySelector("#entry-form-" + tracker.id).style.display = "none";
    section.dataset.selectedDay = "";
  });

  renderCalendarGrid(tracker, monthKey, section);
  return section;
}

function renderCalendarGrid(tracker, monthKey, section) {
  const grid = section
    ? section.querySelector("#calendar-" + tracker.id)
    : document.getElementById("calendar-" + tracker.id);
  if (!grid) return;

  const health = loadHealth();
  const monthData = (health[monthKey] && health[monthKey][tracker.id]) || [];
  const filledDays = new Set(monthData.map(e => e.day));

  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); /* 0=Sun */
  const startOffset = (firstDay + 6) % 7; /* Mon=0 offset */

  grid.innerHTML = "";

  /* Day labels */
  ["M","T","W","T","F","S","S"].forEach(d => {
    const label = document.createElement("div");
    label.style.cssText = "text-align:center;font-size:10px;opacity:0.5;padding-bottom:2px;";
    label.textContent = d;
    grid.appendChild(label);
  });

  /* Empty cells for offset */
  for (let i = 0; i < startOffset; i++) {
    grid.appendChild(document.createElement("div"));
  }

  /* Day circles */
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, "0");
    const dateKey = monthKey + "-" + dayStr;
    const dayEntries = monthData.filter(e => e.day === dateKey);
    const isFilled = dayEntries.length > 0;
    const isToday = dateKey === getTodayKey();

    const circle = document.createElement("button");
    circle.type = "button";
    circle.style.cssText = `
      width:100%;aspect-ratio:1;border-radius:50%;border:1.5px solid ${tracker.color || '#b0977a'};
      background:${isFilled ? (tracker.color || '#b0977a') : 'transparent'};
      color:${isFilled ? 'white' : (tracker.color || '#b0977a')};
      font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;
      ${isToday ? 'box-shadow:0 0 0 2px ' + (tracker.color || '#b0977a') + '44;' : ''}
    `;
    /* Always show checkmark when filled, day number when empty */
    circle.textContent = isFilled ? "✓" : String(day);
    circle.title = "Day " + day + (dayEntries.length > 1 ? " (" + dayEntries.length + " entries)" : "");

    circle.addEventListener("click", function () {
      openDayEntryForm(tracker, dateKey, day, section, isFilled, dayEntries);
    });

    grid.appendChild(circle);
  }
}

function openDayEntryForm(tracker, dateKey, day, section, isFilled, existingEntries) {
  const form = section.querySelector("#entry-form-" + tracker.id);
  const titleEl = section.querySelector("#entry-form-title-" + tracker.id);
  if (!form || !titleEl) return;

  section.dataset.selectedDay = dateKey;

  /* Show existing entries with timestamps if any */
  let existingHtml = "";
  if (existingEntries.length > 0) {
    existingHtml = existingEntries.map(e => {
      const t = new Date(e.date);
      const timeStr = t.toLocaleTimeString("default", { hour:"2-digit", minute:"2-digit" });
      return `<p style="font-size:12px;margin:2px 0;opacity:0.7;">${timeStr}${e.severity ? " — severity " + e.severity : ""}${e.note ? " — " + e.note : ""}</p>`;
    }).join("");
  }

  titleEl.innerHTML = existingEntries.length > 0
    ? "Day " + day + " (" + existingEntries.length + " entr" + (existingEntries.length > 1 ? "ies" : "y") + ")<br><small style='font-weight:normal;font-size:12px;'>" + existingHtml + "</small><br>Add another:"
    : "Add entry for Day " + day;

  const sevInput = section.querySelector("#entry-severity-" + tracker.id);
  const noteInput = section.querySelector("#entry-note-" + tracker.id);
  if (sevInput) sevInput.value = "";
  if (noteInput) noteInput.value = "";

  /* Show/hide delete button — only show if single entry (for multi-entry, delete via edit page) */
  let deleteBtn = section.querySelector("[data-action='delete-entry']");
  if (existingEntries.length === 1) {
    if (!deleteBtn) {
      deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "secondary-action-button";
      deleteBtn.style.cssText = "font-size:12px;color:#a94442;border-color:#a94442;";
      deleteBtn.setAttribute("data-action", "delete-entry");
      deleteBtn.textContent = "Delete";
      const btnRow = form.querySelector("div[style*='flex']");
      if (btnRow) btnRow.appendChild(deleteBtn);
      deleteBtn.addEventListener("click", function () {
        deleteCalendarEntry(tracker, dateKey, section);
      });
    }
    deleteBtn.style.display = "";
  } else if (deleteBtn) {
    deleteBtn.style.display = "none";
  }

  form.style.display = "block";
}

function saveCalendarEntry(tracker, section) {
  const dateKey = section.dataset.selectedDay;
  if (!dateKey) return;

  const sevInput = section.querySelector("#entry-severity-" + tracker.id);
  const noteInput = section.querySelector("#entry-note-" + tracker.id);

  const health = loadHealth();
  const monthKey = section.dataset.currentMonth;

  if (!health[monthKey]) health[monthKey] = {};
  if (!health[monthKey][tracker.id]) health[monthKey][tracker.id] = [];

  /* Replace existing entry for this day if present, otherwise add */
  const existing = health[monthKey][tracker.id].findIndex(e => e.day === dateKey);
  const newEntry = {
    day: dateKey,
    date: new Date().toISOString(),
    severity: sevInput ? sevInput.value : null,
    note: noteInput ? noteInput.value : ""
  };

  if (existing >= 0) {
    health[monthKey][tracker.id][existing] = newEntry;
  } else {
    health[monthKey][tracker.id].push(newEntry);
  }

  saveHealth(health);

  section.querySelector("#entry-form-" + tracker.id).style.display = "none";
  renderCalendarGrid(tracker, monthKey, section);
}

function deleteCalendarEntry(tracker, dateKey, section) {
  const health = loadHealth();
  const monthKey = section.dataset.currentMonth;

  if (health[monthKey] && health[monthKey][tracker.id]) {
    health[monthKey][tracker.id] = health[monthKey][tracker.id].filter(e => e.day !== dateKey);
    saveHealth(health);
  }

  section.querySelector("#entry-form-" + tracker.id).style.display = "none";
  renderCalendarGrid(tracker, monthKey, section);
}

/* =========================================================
   WEIGHT SECTION
   Line chart + written log, no Mon-Sun row
   ========================================================= */

function buildWeightSection(tracker) {
  const section = document.createElement("section");
  section.className = "dashboard-card health-category-card";
  section.id = "tracker-" + tracker.id;

  const monthKey = getCurrentMonthKey();
  section.dataset.currentMonth = monthKey;

  section.innerHTML = `
    <h2 class="card-title" style="color:#3a2e28;">${escH(tracker.name)}</h2>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <button type="button" style="background:none;border:none;font-size:20px;cursor:pointer;color:#b0977a;padding:4px 8px;line-height:1;" data-tracker="${tracker.id}" data-dir="-1">‹</button>
      <span class="health-month-label" data-tracker="${tracker.id}" style="font-size:13px;flex:1;text-align:center;">${formatMonthLabel(monthKey)}</span>
      <button type="button" style="background:none;border:none;font-size:20px;cursor:pointer;color:#b0977a;padding:4px 8px;line-height:1;" data-tracker="${tracker.id}" data-dir="1">›</button>
    </div>
    <canvas id="weight-chart-${tracker.id}" height="120" style="display:none;width:100%;margin-bottom:10px;"></canvas>
    <div id="weight-entry-area-${tracker.id}" style="display:none;gap:6px;margin-bottom:10px;align-items:center;flex-wrap:wrap;">
      <input type="text" id="weight-input-${tracker.id}" placeholder="e.g. 120lb 3oz" style="flex:1;min-width:120px;padding:6px 8px;border-radius:8px;border:1px solid #b0977a;font-size:13px;">
      <div style="display:flex;gap:6px;">
        <button type="button" class="primary-action-button" style="font-size:12px;" data-tracker="${tracker.id}" data-action="log-weight">Save</button>
        <button type="button" class="secondary-action-button" style="font-size:12px;" data-tracker="${tracker.id}" data-action="cancel-weight">Cancel</button>
      </div>
    </div>
    <button type="button" class="secondary-action-button" id="weight-add-btn-${tracker.id}" style="font-size:12px;margin-bottom:8px;" data-tracker="${tracker.id}" data-action="show-weight-entry">+ Add Entry</button>
    <div id="weight-log-${tracker.id}" style="font-size:13px;"></div>
  `;

  /* Month nav */
  section.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("click", function () {
      const dir = parseInt(btn.dataset.dir);
      const newMonth = shiftMonth(section.dataset.currentMonth, dir);
      section.dataset.currentMonth = newMonth;
      section.querySelector(".health-month-label[data-tracker='" + tracker.id + "']").textContent = formatMonthLabel(newMonth);
      renderWeightSection(tracker, newMonth, section);
    });
  });

  /* Show entry area on + Add Entry click */
  const addBtn = section.querySelector("[data-action='show-weight-entry']");
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      const area = document.getElementById("weight-entry-area-" + tracker.id);
      if (area) { area.style.display = "flex"; addBtn.style.display = "none"; }
    });
  }

  /* Cancel entry */
  const cancelBtn = section.querySelector("[data-action='cancel-weight']");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      const area = document.getElementById("weight-entry-area-" + tracker.id);
      const addB = document.getElementById("weight-add-btn-" + tracker.id);
      if (area) area.style.display = "none";
      if (addB) addB.style.display = "";
    });
  }

  /* Log weight */
  section.querySelector("[data-action='log-weight']").addEventListener("click", function () {
    const input = document.getElementById("weight-input-" + tracker.id);
    const val = input ? input.value.trim() : "";
    if (!val) return;
    logWeightEntry(tracker, val);
    if (input) input.value = "";
    const area = document.getElementById("weight-entry-area-" + tracker.id);
    const addB = document.getElementById("weight-add-btn-" + tracker.id);
    if (area) area.style.display = "none";
    if (addB) addB.style.display = "";
    renderWeightSection(tracker, section.dataset.currentMonth, section);
  });

  renderWeightSection(tracker, monthKey, section);
  return section;
}

function logWeightEntry(tracker, value) {
  const health = loadHealth();
  const monthKey = getCurrentMonthKey();
  if (!health[monthKey]) health[monthKey] = {};
  if (!health[monthKey][tracker.id]) health[monthKey][tracker.id] = [];
  health[monthKey][tracker.id].push({ date: new Date().toISOString(), value: value });
  saveHealth(health);
}

function renderWeightSection(tracker, monthKey, section) {
  const health = loadHealth();
  const entries = (health[monthKey] && health[monthKey][tracker.id]) || [];
  const log = section
    ? section.querySelector("#weight-log-" + tracker.id)
    : document.getElementById("weight-log-" + tracker.id);

  if (log) {
    log.innerHTML = entries.length === 0
      ? ""
      : entries.slice().reverse().map(e => {
          const t = new Date(e.date);
          const timeStr = t.toLocaleTimeString("default", { hour:"2-digit", minute:"2-digit" });
          const dateStr = t.toLocaleDateString("default", { month:"short", day:"numeric" });
          return `<p style="margin:0 0 4px 0;font-family:'Josefin Sans',sans-serif;font-size:13px;">
            ${dateStr} ${timeStr} — ${escH(e.value || e.note || "")}
            <button type="button" onclick="deleteWeightEntry('${tracker.id}','${e.date}')" style="background:none;border:none;color:#a94442;font-size:11px;cursor:pointer;padding:0 4px;">✕</button>
          </p>`;
        }).join("");
  }

  drawWeightChart(tracker, entries, section);
}

function drawWeightChart(tracker, entries, section) {
  const canvas = section
    ? section.querySelector("#weight-chart-" + tracker.id)
    : document.getElementById("weight-chart-" + tracker.id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.offsetWidth || 300;
  const h = 120;
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  /* Parse weight values to numbers */
  const points = entries.map(e => {
    const lbMatch = String(e.value).match(/(\d+)\s*lb/i);
    const ozMatch = String(e.value).match(/(\d+)\s*oz/i);
    const lb = lbMatch ? parseFloat(lbMatch[1]) : 0;
    const oz = ozMatch ? parseFloat(ozMatch[1]) : 0;
    return lb + oz / 16;
  }).filter(v => v > 0);

  if (points.length < 2) {
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";

  const min = Math.min(...points) - 1;
  const max = Math.max(...points) + 1;
  const range = max - min || 1;
  const padX = 10;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  /* Draw line */
  ctx.beginPath();
  ctx.strokeStyle = tracker.color || "#8fa98f";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  points.forEach((val, i) => {
    const x = padX + (i / (points.length - 1)) * chartW;
    const y = padY + (1 - (val - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  /* Draw dots */
  points.forEach((val, i) => {
    const x = padX + (i / (points.length - 1)) * chartW;
    const y = padY + (1 - (val - min) / range) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = tracker.color || "#8fa98f";
    ctx.fill();
  });
}

/* =========================================================
   SCALE SECTION (Energy Level 1-5)
   ========================================================= */

function buildScaleSection(tracker) {
  const section = document.createElement("section");
  section.className = "dashboard-card health-category-card";
  section.id = "tracker-" + tracker.id;

  const monthKey = getCurrentMonthKey();
  section.dataset.currentMonth = monthKey;

  section.innerHTML = `
    <h2 class="card-title" style="color:${tracker.color || '#a09fc0'}">${escH(tracker.name)}</h2>
    <div style="margin-bottom:10px;">
      <p style="font-size:13px;margin:0 0 6px 0;">Today's level:</p>
      <div style="display:flex;gap:8px;" id="scale-buttons-${tracker.id}">
        ${[1,2,3,4,5].map(n => `<button type="button" data-level="${n}" data-tracker="${tracker.id}" style="width:36px;height:36px;border-radius:50%;border:1.5px solid ${tracker.color || '#a09fc0'};background:transparent;color:${tracker.color || '#a09fc0'};font-size:14px;cursor:pointer;">${n}</button>`).join("")}
      </div>
    </div>
    <div id="scale-log-${tracker.id}" style="font-size:13px;"></div>
  `;

  section.querySelectorAll("[data-level]").forEach(btn => {
    btn.addEventListener("click", function () {
      const level = btn.dataset.level;
      logScaleEntry(tracker, level);
      /* Highlight selected */
      section.querySelectorAll("[data-level]").forEach(b => {
        b.style.background = b.dataset.level === level ? (tracker.color || "#a09fc0") : "transparent";
        b.style.color = b.dataset.level === level ? "white" : (tracker.color || "#a09fc0");
      });
      renderScaleLog(tracker, section);
    });
  });

  renderScaleLog(tracker, section);
  return section;
}

function logScaleEntry(tracker, level) {
  const health = loadHealth();
  const monthKey = getCurrentMonthKey();
  if (!health[monthKey]) health[monthKey] = {};
  if (!health[monthKey][tracker.id]) health[monthKey][tracker.id] = [];
  health[monthKey][tracker.id].push({ date: new Date().toISOString(), level: level, day: getTodayKey() });
  saveHealth(health);
}

function renderScaleLog(tracker, section) {
  const health = loadHealth();
  const monthKey = getCurrentMonthKey();
  const entries = (health[monthKey] && health[monthKey][tracker.id]) || [];
  const log = document.getElementById("scale-log-" + tracker.id);
  if (!log) return;
  log.innerHTML = entries.slice(-7).reverse().map(e =>
    `<p style="margin:0 0 3px 0;font-size:12px;">${formatShortDate(e.date)}: Level ${e.level}</p>`
  ).join("") || "<p style='opacity:0.5;font-size:12px;'>No entries yet.</p>";
}

/* =========================================================
   YES/NO SECTION
   ========================================================= */

function buildYesNoSection(tracker) {
  const section = document.createElement("section");
  section.className = "dashboard-card health-category-card";
  section.id = "tracker-" + tracker.id;

  section.innerHTML = `
    <h2 class="card-title" style="color:${tracker.color || '#b0977a'}">${escH(tracker.name)}</h2>
    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <button type="button" class="primary-action-button" data-tracker="${tracker.id}" data-val="yes">✓ Yes</button>
      <button type="button" class="secondary-action-button" data-tracker="${tracker.id}" data-val="no">✗ No</button>
    </div>
    <div id="yesno-log-${tracker.id}" style="font-size:13px;"></div>
  `;

  section.querySelectorAll("[data-val]").forEach(btn => {
    btn.addEventListener("click", function () {
      const val = btn.dataset.val;
      const health = loadHealth();
      const mk = getCurrentMonthKey();
      if (!health[mk]) health[mk] = {};
      if (!health[mk][tracker.id]) health[mk][tracker.id] = [];
      health[mk][tracker.id].push({ date: new Date().toISOString(), value: val });
      saveHealth(health);
      const log = document.getElementById("yesno-log-" + tracker.id);
      if (log) {
        const entries = health[mk][tracker.id].slice(-7).reverse();
        log.innerHTML = entries.map(e => `<p style="margin:0 0 3px 0;font-size:12px;">${formatShortDate(e.date)}: ${e.value === "yes" ? "✓" : "✗"}</p>`).join("");
      }
    });
  });

  return section;
}

/* =========================================================
   HELPERS
   ========================================================= */

function renderWeeklyHealth() { buildHealthPage(); } /* Exposed for brain-confirm.js */

function getCurrentMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function shiftMonth(monthKey, dir) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m-1, 1).toLocaleString("default", { month:"long", year:"numeric" });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("default", { month:"short", day:"numeric" });
}

function escH(text) {
  const d = document.createElement("div");
  d.textContent = String(text||"");
  return d.innerHTML;
}

/* Delete a weight entry by tracker id and date key */
function deleteWeightEntry(trackerId, isoDate) {
  const health = loadHealth();
  const section = document.getElementById("tracker-" + trackerId);
  const trackers = loadHealthTrackers();
  const tracker = trackers.find(t => t.id === trackerId);
  if (!tracker || !section) return;
  const monthKey = section.dataset.currentMonth || getCurrentMonthKey();
  if (!health[monthKey] || !health[monthKey][trackerId]) return;
  health[monthKey][trackerId] = health[monthKey][trackerId].filter(e => e.date !== isoDate);
  saveHealth(health);
  renderWeightSection(tracker, monthKey, section);
}

/* =========================================================
   TRACKER EDIT PANEL
   Edit name, delete trackers from Health Page
   ========================================================= */

function openTrackerEditPanel() {
  /* Remove existing panel if any */
  const existing = document.getElementById("tracker-edit-panel");
  if (existing) { existing.remove(); return; }

  const trackers = loadHealthTrackers();
  const panel = document.createElement("div");
  panel.id = "tracker-edit-panel";
  panel.style.cssText = `
    position:fixed;bottom:0;left:0;width:100%;max-height:70vh;overflow-y:auto;
    background:#F3EADF;border-radius:20px 20px 0 0;
    box-shadow:0 -4px 20px rgba(0,0,0,0.15);z-index:1000;padding:20px;box-sizing:border-box;
  `;

  panel.innerHTML = `
    <h3 style="font-family:'Josefin Sans',sans-serif;font-size:16px;font-weight:600;color:#3a2e28;margin:0 0 16px 0;">Edit Trackers</h3>
    <div id="tracker-edit-list"></div>
    <button type="button" onclick="document.getElementById('tracker-edit-panel').remove()" 
      style="width:100%;margin-top:12px;padding:10px;border-radius:10px;border:1px solid #c9b49a;background:white;font-family:'Josefin Sans',sans-serif;font-size:14px;color:#3a2e28;cursor:pointer;">
      Done
    </button>
  `;

  const list = panel.querySelector("#tracker-edit-list");

  trackers.forEach(function(tracker) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;";
    row.innerHTML = `
      <input type="text" value="${escH(tracker.name)}" data-tracker-id="${tracker.id}"
        style="flex:1;padding:8px;border-radius:8px;border:1px solid #c9b49a;font-size:14px;font-family:'Josefin Sans',sans-serif;">
      <button type="button" data-save-tracker="${tracker.id}"
        style="padding:6px 12px;border-radius:8px;border:1px solid #b0977a;background:#b0977a;color:white;font-size:13px;cursor:pointer;font-family:'Josefin Sans',sans-serif;">
        Save
      </button>
      <button type="button" data-delete-tracker="${tracker.id}"
        style="padding:6px 10px;border-radius:8px;border:1px solid #a94442;background:white;color:#a94442;font-size:13px;cursor:pointer;">
        ✕
      </button>
    `;
    list.appendChild(row);
  });

  /* Wire save buttons */
  panel.querySelectorAll("[data-save-tracker]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const id = btn.getAttribute("data-save-tracker");
      const input = panel.querySelector("[data-tracker-id='" + id + "']");
      const newName = input ? input.value.trim() : "";
      if (!newName) return;
      const trackers = loadHealthTrackers();
      const t = trackers.find(x => x.id === id);
      if (t) { t.name = newName; saveHealthTrackers(trackers); buildHealthPage(); }
    });
  });

  /* Wire delete buttons */
  panel.querySelectorAll("[data-delete-tracker]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const id = btn.getAttribute("data-delete-tracker");
      if (!confirm("Delete this tracker and all its data?")) return;
      const trackers = loadHealthTrackers().filter(x => x.id !== id);
      saveHealthTrackers(trackers);
      buildHealthPage();
      panel.remove();
    });
  });

  document.body.appendChild(panel);
}
