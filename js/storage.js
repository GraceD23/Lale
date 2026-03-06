/* =========================================================
   STORAGE.JS
   ---------------------------------------------------------
   Central storage system for the entire site.

   Handles saving and loading:
   - tasks
   - streaks
   - health entries
   - history

   Uses localStorage for now.
   Later this can sync with GitHub or Cloudflare.

   Everything goes through this file so we never
   access localStorage directly elsewhere.
   ========================================================= */


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE_KEYS = {

  TASKS: "prod_tasks",
  STREAKS: "prod_streaks",
  HEALTH: "prod_health",
  HISTORY: "prod_history"

};


/* =========================================================
   GENERIC LOAD FUNCTION
   ========================================================= */

function loadFromStorage(key) {

  const raw = localStorage.getItem(key);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Storage parse error:", key);
    return null;
  }

}


/* =========================================================
   GENERIC SAVE FUNCTION
   ========================================================= */

function saveToStorage(key, value) {

  const serialized = JSON.stringify(value);
  localStorage.setItem(key, serialized);

}


/* =========================================================
   TASK STORAGE
   ========================================================= */

function loadTasks() {

  return loadFromStorage(STORAGE_KEYS.TASKS) || [];

}

function saveTasks(tasks) {

  saveToStorage(STORAGE_KEYS.TASKS, tasks);

}


/* =========================================================
   STREAK STORAGE
   ========================================================= */

function loadStreaks() {

  return loadFromStorage(STORAGE_KEYS.STREAKS) || [];

}

function saveStreaks(streaks) {

  saveToStorage(STORAGE_KEYS.STREAKS, streaks);

}


/* =========================================================
   HEALTH STORAGE
   ========================================================= */

function loadHealth() {

  return loadFromStorage(STORAGE_KEYS.HEALTH) || {};

}

function saveHealth(healthData) {

  saveToStorage(STORAGE_KEYS.HEALTH, healthData);

}


/* =========================================================
   HISTORY STORAGE
   ========================================================= */

function loadHistory() {

  return loadFromStorage(STORAGE_KEYS.HISTORY) || {};

}

function saveHistory(historyData) {

  saveToStorage(STORAGE_KEYS.HISTORY, historyData);

}


/* =========================================================
   CLEAR ALL DATA
   Useful for testing
   ========================================================= */

function clearAllStorage() {

  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.STREAKS);
  localStorage.removeItem(STORAGE_KEYS.HEALTH);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);

}
