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

  const today = getTodayName();

  container.innerHTML = "";

  tasks
    .filter(task => task.schedule === "daily" || task.day === today)
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
    .filter(task => !task.completed)
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

  const label = document.createElement("span");
  label.className = "task-text";
  label.textContent = task.name;

  const button = document.createElement("button");
  button.className = "task-complete-button";
  button.textContent = "✓";

  button.addEventListener("click", function () {

    completeTask(task.id);

  });

  row.appendChild(label);
  row.appendChild(button);

  return row;

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
