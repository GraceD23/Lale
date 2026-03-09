/* =========================================================
   STREAKS.JS
   ---------------------------------------------------------
   Uses real stored streak data instead of starter demo data.

   What this file does:
   - renders homepage Streaks dropdown from storage
   - renders full Streaks page from storage
   - supports text stars now
   - supports custom PNG stars later
   - keeps weekly homepage view separate from full streak history
   ========================================================= */


/* =========================================================
   PAGE STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeStreaks(); /* Starts streak rendering when the page is ready */
});


/* =========================================================
   MAIN INITIALIZER
   ========================================================= */

function initializeStreaks() {
  exposeStreakHelpers(); /* Makes helper functions available to other scripts */
  renderHomepageStreaks(); /* Renders homepage dropdown if present */
  renderFullStreaksPage(); /* Renders full Streaks page if present */
}


/* =========================================================
   HELPERS EXPOSED GLOBALLY
   ========================================================= */

function exposeStreakHelpers() {
  window.renderHomepageStreaks = renderHomepageStreaks; /* Lets other scripts refresh homepage streaks */
  window.renderFullStreaksPage = renderFullStreaksPage; /* Lets other scripts refresh full streaks page */
  window.incrementStoredStreak = incrementStoredStreak; /* Lets other scripts add one streak completion */
  window.ensureStoredStreakExists = ensureStoredStreakExists; /* Lets other scripts create streak if missing */
  window.buildStarDisplay = buildStarDisplay; /* Reuses star rendering in other scripts */
}


/* =========================================================
   STORAGE ACCESS
   ========================================================= */

function getStoredStreaks() {
  if (typeof loadStreaks === "function") {
    const stored = loadStreaks(); /* Loads streaks from storage.js */

    if (Array.isArray(stored)) {
      return stored; /* Uses real stored streak data */
    }
  }

  return []; /* Safe fallback if storage.js is missing */
}

function saveStoredStreaks(streaks) {
  if (typeof saveStreaks === "function") {
    saveStreaks(streaks); /* Saves updated streak list into storage */
  }
}


/* =========================================================
   HOMEPAGE STREAKS
   ---------------------------------------------------------
   Renders tracker name + weekly stars on the homepage.
   ========================================================= */

function renderHomepageStreaks() {
  const container = document.getElementById("streaks-dropdown-content"); /* Homepage dropdown container */

  if (!container) {
    return; /* Stops safely if not on homepage */
  }

  const streaks = getStoredStreaks()
    .filter(function (streak) {
      return streak && streak.name; /* Keeps only valid streak objects */
    })
    .sort(function (a, b) {
      return (b.weeklyCount || 0) - (a.weeklyCount || 0); /* Highest weekly count first */
    });

  container.innerHTML = ""; /* Clears old rows before rebuilding */

  if (streaks.length === 0) {
    const emptyMessage = document.createElement("p"); /* Empty-state text */
    emptyMessage.textContent = "No streaks yet.";
    container.appendChild(emptyMessage);
    return;
  }

  streaks.forEach(function (streak) {
    const row = document.createElement("div"); /* One homepage streak row */
    row.className = "streak-row";

    const nameSpan = document.createElement("span"); /* Streak name */
    nameSpan.className = "streak-name";
    nameSpan.textContent = streak.name;

    const starsSpan = document.createElement("span"); /* Weekly stars */
    starsSpan.className = "streak-stars";
    starsSpan.innerHTML = buildStarDisplay(streak.weeklyCount || 0); /* Weekly homepage view */

    row.appendChild(nameSpan);
    row.appendChild(starsSpan);

    container.appendChild(row);
  });
}


/* =========================================================
   FULL STREAKS PAGE
   ---------------------------------------------------------
   Renders all streaks on streaks.html.

   Filled star = completed
   Unfilled star = missed / not completed in running history
   ========================================================= */

function renderFullStreaksPage() {
  const container = document.getElementById("full-streaks-container"); /* Full Streaks page container */

  if (!container) {
    return; /* Stops safely if not on streaks.html */
  }

  const streaks = getStoredStreaks()
    .filter(function (streak) {
      return streak && streak.name; /* Keeps only valid streak objects */
    })
    .sort(function (a, b) {
      return (b.count || 0) - (a.count || 0); /* Highest total count first */
    });

  container.innerHTML = ""; /* Clears old rows before rebuilding */

  if (streaks.length === 0) {
    const emptyMessage = document.createElement("p"); /* Empty-state text */
    emptyMessage.textContent = "No streaks yet.";
    container.appendChild(emptyMessage);
    return;
  }

  streaks.forEach(function (streak) {
    const row = document.createElement("div"); /* One full streak row */
    row.className = "streak-row";

    const nameSpan = document.createElement("span"); /* Streak name */
    nameSpan.className = "streak-name";
    nameSpan.textContent = streak.name;

    const starsSpan = document.createElement("span"); /* Full history stars */
    starsSpan.className = "streak-stars";
    starsSpan.innerHTML = buildHistoryStarDisplay(streak.history || [], streak.count || 0);

    row.appendChild(nameSpan);
    row.appendChild(starsSpan);

    container.appendChild(row);
  });
}


/* =========================================================
   STAR DISPLAY
   ---------------------------------------------------------
   Homepage weekly star display.
   ========================================================= */

function buildStarDisplay(starCount) {
  const count = Number.isFinite(starCount) ? Math.max(0, starCount) : 0; /* Safe non-negative count */

  if (shouldUseCustomStarImage()) {
    return buildImageStarDisplay(count); /* Uses image stars if enabled */
  }

  return buildTextStarDisplay(count); /* Uses text stars otherwise */
}

function buildTextStarDisplay(starCount) {
  const textStar = getConfiguredTextStar(); /* Reads fallback text star */
  return textStar.repeat(starCount); /* Repeats filled star count times */
}

function buildImageStarDisplay(starCount) {
  const starPath = getConfiguredStarPath(); /* Reads configured image path */
  let html = "";

  for (let index = 0; index < starCount; index += 1) {
    html += '<img class="streak-star-image" src="' + escapeAttribute(starPath) + '" alt="Star" />'; /* One image per star */
  }

  return html;
}


/* =========================================================
   FULL HISTORY STAR DISPLAY
   ---------------------------------------------------------
   Full streak page visual:
   - filled stars for completed entries
   - unfilled stars for missed entries
   - if no history exists yet, falls back to total count
   ========================================================= */

function buildHistoryStarDisplay(historyArray, totalCount) {
  const history = Array.isArray(historyArray) ? historyArray : []; /* Safe history array */

  if (history.length === 0) {
    return buildTextStarDisplay(totalCount || 0); /* Fallback if no running history exists yet */
  }

  let output = "";

  history.forEach(function (item) {
    if (item && item.filled === true) {
      output += getConfiguredTextStar(); /* Filled star */
    } else {
      output += "☆"; /* Unfilled star */
    }
  });

  return output;
}


/* =========================================================
   CREATE / UPDATE STREAKS
   ---------------------------------------------------------
   Used by other systems like:
   - Brain Dump confirm
   - future task completion logic
   ========================================================= */

function ensureStoredStreakExists(streakName) {
  const cleanedName = String(streakName || "").trim(); /* Safe streak name */

  if (cleanedName === "") {
    return null; /* Stops if no valid streak name */
  }

  const streaks = getStoredStreaks(); /* Current stored streaks */

  let matchingStreak = streaks.find(function (streak) {
    return streak.name === cleanedName; /* Looks for existing streak */
  });

  if (!matchingStreak) {
    matchingStreak = {
      id: buildSimpleStreakId(cleanedName), /* Unique streak ID */
      name: cleanedName, /* Visible streak name */
      count: 0, /* Total completions */
      weeklyCount: 0, /* Homepage weekly stars */
      history: [] /* Full streak history array */
    };

    streaks.push(matchingStreak); /* Adds new streak */
    saveStoredStreaks(streaks); /* Saves updated streak list */
  }

  return matchingStreak;
}

function incrementStoredStreak(streakName) {
  const cleanedName = String(streakName || "").trim(); /* Safe streak name */

  if (cleanedName === "") {
    return; /* Stops if no valid name */
  }

  const streaks = getStoredStreaks(); /* Current stored streaks */

  let matchingStreak = streaks.find(function (streak) {
    return streak.name === cleanedName; /* Finds existing streak */
  });

  if (!matchingStreak) {
    matchingStreak = {
      id: buildSimpleStreakId(cleanedName), /* Unique streak ID */
      name: cleanedName,
      count: 0,
      weeklyCount: 0,
      history: []
    };

    streaks.push(matchingStreak); /* Creates streak if missing */
  }

  matchingStreak.count += 1; /* Total count */
  matchingStreak.weeklyCount += 1; /* Homepage weekly count */
  matchingStreak.history.push({
    date: new Date().toISOString(), /* Stores completion timestamp */
    filled: true /* Completed streak day */
  });

  saveStoredStreaks(streaks); /* Saves updated streak list */
  renderHomepageStreaks(); /* Refreshes homepage dropdown if present */
  renderFullStreaksPage(); /* Refreshes full streaks page if present */
}


/* =========================================================
   CONFIG HELPERS
   ========================================================= */

function shouldUseCustomStarImage() {
  if (window.getConfig) {
    return Boolean(window.getConfig("useCustomStarImage")); /* Reads image-star setting */
  }

  return false;
}

function getConfiguredStarPath() {
  if (window.getConfig) {
    return window.getConfig("starIconPath") || "assets/icons/star-default.png"; /* Reads star image path */
  }

  return "assets/icons/star-default.png";
}

function getConfiguredTextStar() {
  if (window.getConfig) {
    return window.getConfig("starFallbackText") || "★"; /* Reads text star */
  }

  return "★";
}


/* =========================================================
   SMALL HELPERS
   ========================================================= */

function buildSimpleStreakId(streakName) {
  return String(streakName)
    .toLowerCase() /* Lowercase ID */
    .replace(/[^a-z0-9]+/g, "-") /* Replaces spaces/symbols with dashes */
    .replace(/^-+|-+$/g, "") + "-" + Date.now(); /* Trims edge dashes and adds timestamp */
}

function escapeAttribute(value) {
  const temporaryElement = document.createElement("div"); /* Safe temp element */
  temporaryElement.textContent = value;
  return temporaryElement.innerHTML.replace(/"/g, "&quot;"); /* Safe attribute string */
}
