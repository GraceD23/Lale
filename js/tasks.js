/* =========================================================
   TASKS-SYSTEM.JS
   ---------------------------------------------------------
   Core task engine for the site.

   Controls:
   - Daily Focus
   - Weekly Tasks
   - Task completion
   - Carry-over unfinished tasks
   - Streak updates
   - History logging

   Uses storage.js to persist data.
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  initializeTasks();

});


/* =========================================================
   INITIALIZE TASK SYSTEM
   ========================================================= */

function initializeTasks() {

  checkMidnightRollover();
  injectRecurringTasks();
  renderDailyTasks();
  renderWeeklyTasks();
  wireDropZones();

}


/* =========================================================
   LOAD TASK DATA
   ========================================================= */

function getTasks() {

  return loadTasks(); /* from storage.js */

}


/* =========================================================
   SAVE TASK DATA
   ========================================================= */

function setTasks(tasks) {

  saveTasks(tasks);

}


/* =========================================================
   DAILY TASKS
   ========================================================= */

function renderDailyTasks() {

  const container = document.getElementById("daily-focus-list");
  if (!container) return;

  const tasks = getTasks();

  container.innerHTML = "";

  tasks
    .filter(task => task.schedule === "daily" && !task.completed)
    .forEach(task => {

      const row = buildTaskRow(task);
      container.appendChild(row);

    });

}


/* =========================================================
   WEEKLY TASKS
   ========================================================= */

function renderWeeklyTasks() {

  const container = document.getElementById("weekly-tasks-list")
  if (!container) return;

  const tasks = getTasks();

  container.innerHTML = "";

  tasks
    .filter(task => task.schedule === "weekly" && !task.completed)
    .forEach(task => {

      const row = buildTaskRow(task);
      container.appendChild(row);

    });

}


/* =========================================================
   BUILD TASK ROW
   ========================================================= */

function buildTaskRow(task) {

  const row = document.createElement("div");
  row.className = "task-row";
  row.setAttribute("draggable", "true");
  row.dataset.taskId = task.id;

  const label = document.createElement("span");
  label.className = "task-text";
  label.textContent = task.name;

  const button = document.createElement("button");
  button.className = "task-complete-button";
  button.textContent = "";

  button.addEventListener("click", function () {
    completeTask(task.id);
  });

  row.appendChild(label);
  row.appendChild(button);

  /* ---- Desktop drag events ---- */
  row.addEventListener("dragstart", function (e) {
    e.dataTransfer.setData("taskId", task.id);
    setTimeout(() => row.classList.add("dragging"), 0);
  });

  row.addEventListener("dragend", function () {
    row.classList.remove("dragging");
    document.querySelectorAll(".task-list").forEach(l => l.classList.remove("drop-target"));
    document.querySelectorAll(".task-row").forEach(r => r.classList.remove("drag-over"));
  });

  /* ---- Touch drag events (mobile) ---- */
  let touchClone = null;
  let touchOffsetX = 0;
  let touchOffsetY = 0;

  row.addEventListener("touchstart", function (e) {
    const touch = e.touches[0];
    touchOffsetX = touch.clientX - row.getBoundingClientRect().left;
    touchOffsetY = touch.clientY - row.getBoundingClientRect().top;

    touchClone = row.cloneNode(true);
    touchClone.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none;
      width: ${row.offsetWidth}px; opacity: 0.85;
      background: white; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      left: ${touch.clientX - touchOffsetX}px;
      top: ${touch.clientY - touchOffsetY}px;
    `;
    document.body.appendChild(touchClone);
    row.classList.add("dragging");
  }, { passive: true });

  row.addEventListener("touchmove", function (e) {
    e.preventDefault();
    const touch = e.touches[0];

    if (touchClone) {
      touchClone.style.left = (touch.clientX - touchOffsetX) + "px";
      touchClone.style.top  = (touch.clientY - touchOffsetY) + "px";
    }

    /* Highlight the list under the finger */
    document.querySelectorAll(".task-list").forEach(l => l.classList.remove("drop-target"));
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetList = el && el.closest(".task-list");
    if (targetList) targetList.classList.add("drop-target");

  }, { passive: false });

  row.addEventListener("touchend", function (e) {
    if (touchClone) { touchClone.remove(); touchClone = null; }
    row.classList.remove("dragging");
    document.querySelectorAll(".task-list").forEach(l => l.classList.remove("drop-target"));

    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetList = el && el.closest(".task-list");

    if (targetList) {
      const newSchedule = targetList.dataset.schedule;
      if (newSchedule && newSchedule !== task.schedule) {
        moveTask(task.id, newSchedule);
      }
    }
  }, { passive: true });

  return row;

}


/* =========================================================
   MOVE TASK BETWEEN SECTIONS
   ========================================================= */

function moveTask(taskId, newSchedule) {

  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.schedule = newSchedule;
  setTasks(tasks);

  renderDailyTasks();
  renderWeeklyTasks();

}


/* =========================================================
   WIRE DROP ZONES
   ========================================================= */

function wireDropZones() {

  document.querySelectorAll(".task-list").forEach(function (list) {

    list.addEventListener("dragover", function (e) {
      e.preventDefault();
      list.classList.add("drop-target");
    });

    list.addEventListener("dragleave", function (e) {
      if (!list.contains(e.relatedTarget)) {
        list.classList.remove("drop-target");
      }
    });

    list.addEventListener("drop", function (e) {
      e.preventDefault();
      list.classList.remove("drop-target");
      const taskId = e.dataTransfer.getData("taskId");
      const newSchedule = list.dataset.schedule;
      if (taskId && newSchedule) {
        moveTask(taskId, newSchedule);
      }
    });

  });

}


/* =========================================================
   COMPLETE TASK
   ========================================================= */

function completeTask(taskId) {

  const tasks = getTasks();

  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = true;

  setTasks(tasks);

  logTaskCompletion(task);

  updateStreak(task);

  renderDailyTasks();
  renderWeeklyTasks();

}


/* =========================================================
   LOG TASK COMPLETION
   ========================================================= */

function logTaskCompletion(task) {

  const history = loadHistory();

  const monthKey = getMonthKey();

  if (!history[monthKey]) {
    history[monthKey] = [];
  }

  history[monthKey].push({

    task: task.name,
    date: new Date().toISOString()

  });

  saveHistory(history);

}


/* =========================================================
   UPDATE STREAK
   ========================================================= */

function updateStreak(task) {

  if (!task.streak) return;

  const streaks = loadStreaks();

  let streak = streaks.find(s => s.name === task.name);

  if (!streak) {

    streak = {
      name: task.name,
      count: 0
    };

    streaks.push(streak);

  }

  streak.count += 1;

  saveStreaks(streaks);

}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getTodayName() {
  return new Date().toLocaleString("default", { weekday: "short" });
}

function getMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getTodayDayName() {
  /* Returns full lowercase day name e.g. "tuesday" */
  return new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
}


/* =========================================================
   MIDNIGHT ROLLOVER — unfinished Daily → Weekly
   ========================================================= */

function checkMidnightRollover() {

  const lastRun = localStorage.getItem("lale_last_rollover_date") || "";
  const today = getTodayKey();

  if (lastRun === today) return; /* Already ran today */

  /* Move all unfinished daily tasks to weekly */
  const tasks = getTasks();
  let changed = false;

  tasks.forEach(function (task) {
    if (task.schedule === "daily" && !task.completed && !task.recurring) {
      task.schedule = "weekly";
      changed = true;
    }
  });

  if (changed) setTasks(tasks);

  localStorage.setItem("lale_last_rollover_date", today);
}


/* =========================================================
   RECURRING TASKS — inject today's recurring tasks into Daily
   ========================================================= */

function loadRecurring() {
  return JSON.parse(localStorage.getItem("lale_recurring_tasks") || "[]");
}

function saveRecurring(recurring) {
  localStorage.setItem("lale_recurring_tasks", JSON.stringify(recurring));
}

function injectRecurringTasks() {

  const recurring = loadRecurring();
  const todayDay = getTodayDayName();    /* e.g. "tuesday" */
  const todayKey = getTodayKey();
  const tasks = getTasks();

  recurring.forEach(function (rec) {
    /* Check if this recurring task fires today */
    const days = rec.days || [];
    if (!days.includes(todayDay)) return;

    /* Check if already injected today */
    const alreadyExists = tasks.find(t =>
      t.recurringId === rec.id && t.injectedDate === todayKey
    );
    if (alreadyExists) return;

    tasks.push({
      id: "rec_" + rec.id + "_" + todayKey,
      recurringId: rec.id,
      injectedDate: todayKey,
      name: rec.name,
      schedule: "daily",
      completed: false,
      recurring: true
    });
  });

  setTasks(tasks);
}


/* =========================================================
   RECURRING TASK MANAGER UI
   ========================================================= */

function openRecurringManager() {

  const existing = document.getElementById("recurring-manager-overlay");
  if (existing) { existing.remove(); return; }

  const recurring = loadRecurring();
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const overlay = document.createElement("div");
  overlay.id = "recurring-manager-overlay";
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(60,47,38,0.5);z-index:4000;
    display:flex;align-items:flex-end;justify-content:center;
  `;

  overlay.innerHTML = `
    <div style="background:#fdf8f3;border-radius:20px 20px 0 0;width:100%;max-width:480px;
      padding:24px 20px 40px;max-height:80vh;overflow-y:auto;box-sizing:border-box;">
      <h3 style="margin:0 0 16px;font-family:'Josefin Sans',sans-serif;font-size:16px;color:#3C2F26;">
        Recurring Tasks
      </h3>

      <div id="recurring-list" style="margin-bottom:16px;"></div>

      <p style="font-size:12px;font-weight:600;opacity:0.5;font-family:'Josefin Sans',sans-serif;margin:0 0 8px;">
        ADD NEW
      </p>
      <input id="rec-name-input" type="text" placeholder="Task name..."
        style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid #CBB7A3;
        font-family:'Josefin Sans',sans-serif;font-size:14px;box-sizing:border-box;margin-bottom:10px;">
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;" id="rec-day-picks">
        ${days.map((d,i) => `
          <button type="button" data-day="${d}"
            style="padding:5px 10px;border-radius:8px;border:1.5px solid #CBB7A3;background:white;
            font-family:'Josefin Sans',sans-serif;font-size:12px;color:#4E4036;cursor:pointer;">
            ${dayLabels[i]}
          </button>
        `).join("")}
      </div>
      <button type="button" id="rec-add-btn"
        style="width:100%;padding:11px;border-radius:12px;border:none;background:#B88C6A;
        color:white;font-family:'Josefin Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;">
        Add Recurring Task
      </button>
      <button type="button" id="rec-close-btn"
        style="width:100%;padding:9px;border-radius:12px;border:1.5px solid #CBB7A3;
        background:none;font-family:'Josefin Sans',sans-serif;font-size:13px;color:#4E4036;cursor:pointer;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  function renderRecurringList() {
    const list = document.getElementById("recurring-list");
    const rec = loadRecurring();
    if (!rec.length) {
      list.innerHTML = "<p style='font-size:13px;opacity:0.5;font-family:\"Josefin Sans\",sans-serif;'>No recurring tasks yet.</p>";
      return;
    }
    list.innerHTML = "";
    rec.forEach(function (r) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e8ddd4;";
      row.innerHTML = `
        <div style="flex:1;">
          <div style="font-family:'Josefin Sans',sans-serif;font-size:14px;color:#3C2F26;">${r.name}</div>
          <div style="font-size:11px;opacity:0.6;font-family:'Josefin Sans',sans-serif;margin-top:2px;">
            Every ${r.days.map(d => d.charAt(0).toUpperCase() + d.slice(1,3)).join(", ")}
          </div>
        </div>
        <button type="button" data-id="${r.id}"
          style="background:none;border:none;font-size:18px;cursor:pointer;color:#b0977a;padding:4px;">✕</button>
      `;
      row.querySelector("button").addEventListener("click", function () {
        const updated = loadRecurring().filter(x => x.id !== r.id);
        saveRecurring(updated);
        /* Also remove any injected tasks from this recurring */
        const tasks = getTasks().filter(t => t.recurringId !== r.id);
        setTasks(tasks);
        renderRecurringList();
        renderDailyTasks();
      });
      list.appendChild(row);
    });
  }

  renderRecurringList();

  /* Day toggle */
  const selectedDays = new Set();
  overlay.querySelectorAll("[data-day]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const d = this.dataset.day;
      if (selectedDays.has(d)) {
        selectedDays.delete(d);
        this.style.background = "white";
        this.style.color = "#4E4036";
        this.style.borderColor = "#CBB7A3";
      } else {
        selectedDays.add(d);
        this.style.background = "#b0977a";
        this.style.color = "white";
        this.style.borderColor = "#b0977a";
      }
    });
  });

  document.getElementById("rec-add-btn").addEventListener("click", function () {
    const name = document.getElementById("rec-name-input").value.trim();
    if (!name) { alert("Please enter a task name."); return; }
    if (selectedDays.size === 0) { alert("Please select at least one day."); return; }

    const rec = loadRecurring();
    rec.push({ id: Date.now().toString(), name, days: Array.from(selectedDays) });
    saveRecurring(rec);
    injectRecurringTasks();
    renderRecurringList();
    renderDailyTasks();
    document.getElementById("rec-name-input").value = "";
    selectedDays.clear();
    overlay.querySelectorAll("[data-day]").forEach(b => {
      b.style.background = "white"; b.style.color = "#4E4036"; b.style.borderColor = "#CBB7A3";
    });
  });

  document.getElementById("rec-close-btn").addEventListener("click", function () {
    overlay.remove();
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.remove();
  });
}
