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
